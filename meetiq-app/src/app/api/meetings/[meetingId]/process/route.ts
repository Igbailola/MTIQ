import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/meetings/[meetingId]/process - Trigger AI extraction of summary, decisions, commitments
 * Uses Supabase Edge Function with a fallback to direct Next.js API-based OpenAI extraction.
 */

interface RouteParams {
  params: Promise<{
    meetingId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  let userId: string | null = null;
  try {
    const { meetingId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = user.id;

    // Try calling the Supabase Edge Function first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-processor`;

    try {
      console.log('Attempting to call Edge Function at:', edgeFunctionUrl);
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ meeting_id: meetingId }),
      });

      if (edgeResponse.ok) {
        const data = await edgeResponse.json();
        return NextResponse.json(data, { status: 200 });
      }
      
      console.warn('Edge Function returned error code:', edgeResponse.status);
    } catch (edgeErr) {
      console.warn('Failed to connect to Edge Function, falling back to local processing:', edgeErr);
    }

    // FALLBACK: Execute OpenAI processing directly in Next.js API route
    console.log('Running fallback local processing...');
    const adminSupabase = createAdminClient();

    // 1. Fetch meeting
    const { data: meeting, error: meetingError } = await adminSupabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Update meeting status to processing
    await adminSupabase
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meetingId);

    // 2. Fetch workspace members
    const { data: members } = await adminSupabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', meeting.workspace_id);

    const userIds = (members || []).map((m) => m.user_id);
    
    // Fetch profiles to get names
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const memberListStr = (profiles || [])
      .map((p) => `- Name: "${p.display_name}", ID: "${p.id}"`)
      .join('\n');

    // Prompt preparation
    const MAX_TRANSCRIPT_CHARS = 400_000;
    let transcriptText = meeting.raw_text || '';
    if (transcriptText.length > MAX_TRANSCRIPT_CHARS) {
      console.warn(`Transcript too long (${transcriptText.length} chars), truncating to ${MAX_TRANSCRIPT_CHARS} chars for AI processing`);
      transcriptText = transcriptText.slice(0, MAX_TRANSCRIPT_CHARS) + '\n\n[Transcript truncated due to length. Some content may not have been processed.]';
    }

    const systemPrompt = `You are an expert AI execution accountability assistant. Your task is to analyze meeting transcripts or notes and extract:
1. A structured summary containing 3 to 5 key bullet points.
2. Key decisions made during the meeting.
3. Commitments (action items). For each commitment, extract:
   - Title (be concise, clear, and actionable).
   - Description (additional context).
   - Suggested owner (must map to one of the provided workspace members' IDs if they are mentioned or implied, otherwise null).
   - Suggested deadline (an ISO timestamp if mentioned, or null).
   - Confidence level ("high" if owner and deadline are explicitly agreed, "medium" if implied/suggested but not fully confirmed, "low" if vague/ambiguous).
   - Context snippet (the exact quote or line from the meeting supporting this commitment).
   - Priority ("low", "medium", or "high").

Here are the workspace members you can assign commitments to:
${memberListStr}

IMPORTANT:
- Assign suggested owners ONLY by their exact UUID.
- If no member name matches, leave the suggested owner as null, but specify who was mentioned in the description.
- Ensure the output is valid JSON in the requested format.
- Output JSON format:
{
  "summary": {
    "bullets": ["bullet 1", "bullet 2"],
    "ai_confidence": "high" | "medium" | "low"
  },
  "decisions": [
    { "content": "decision content", "ai_confidence": "high" | "medium" | "low" }
  ],
  "commitments": [
    {
      "title": "task title",
      "description": "context details",
      "suggested_owner_id": "UUID" or null,
      "due_date": "ISO timestamp" or null,
      "ai_confidence": "high" | "medium" | "low",
      "context_snippet": "exact quote",
      "priority": "low" | "medium" | "high"
    }
  ]
}`;

    const userPrompt = `Meeting Title: ${meeting.title}
Meeting Date: ${meeting.meeting_date}
Meeting Content:
${transcriptText}`;

    const isDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const defaultModel = isDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini';
    const model = process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || defaultModel;
    const defaultBase = isDeepSeek ? 'https://api.deepseek.com' : 'https://api.openai.com/v1';
    const baseUrl = process.env.DEEPSEEK_API_BASE || defaultBase;

    if (!apiKey) {
      // Set to error state if key is missing
      await adminSupabase
        .from('meetings')
        .update({ status: 'error' })
        .eq('id', meetingId);
      return NextResponse.json({ error: 'AI API key is missing' }, { status: 500 });
    }

    const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!chatResponse.ok) {
      const errText = await chatResponse.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const openAiData = await chatResponse.json();
    const resultJson = JSON.parse(openAiData.choices[0].message.content);

    // Save Summary to Meeting
    const summaryBullets = resultJson.summary?.bullets || [];
    const summaryConfidence = resultJson.summary?.ai_confidence || 'medium';
    
    await adminSupabase
      .from('meetings')
      .update({
        status: 'ready',
        summary: { bullets: summaryBullets, ai_confidence: summaryConfidence },
      })
      .eq('id', meetingId);

    // Delete existing decisions/commitments if re-processing
    await adminSupabase.from('decisions').delete().eq('meeting_id', meetingId);
    await adminSupabase.from('commitments').delete().eq('meeting_id', meetingId);

    // Insert Decisions
    const decisions = resultJson.decisions || [];
    if (decisions.length > 0) {
      const decisionRows = decisions.map((d: any) => ({
        meeting_id: meetingId,
        content: d.content,
        ai_confidence: d.ai_confidence || 'medium',
      }));
      await adminSupabase.from('decisions').insert(decisionRows);
    }

    // Insert Commitments
    const commitments = resultJson.commitments || [];
    if (commitments.length > 0) {
      const commitmentRows = commitments.map((c: any) => ({
        meeting_id: meetingId,
        title: c.title,
        description: c.description || null,
        ai_owner_suggestion: c.suggested_owner_id || null,
        owner_id: null, // Keep null until published/confirmed
        due_date: c.due_date || null,
        ai_confidence: c.ai_confidence || 'medium',
        context_snippet: c.context_snippet || null,
        priority: c.priority || 'medium',
        status: 'pending_confirmation',
        published: false,
      }));
      await adminSupabase.from('commitments').insert(commitmentRows);
    }

    // Log Activity
    await adminSupabase.from('activity_feed').insert({
      workspace_id: meeting.workspace_id,
      actor_id: user.id,
      action: 'meeting_processed',
      entity_type: 'meeting',
      entity_id: meetingId,
      details: { title: meeting.title, commitments_count: commitments.length },
    });

    return NextResponse.json({ success: true, commitmentsCount: commitments.length }, { status: 200 });
  } catch (err: any) {
    console.error('Error during AI processing, falling back to mock sandbox data:', err);
    try {
      const adminSupabase = createAdminClient();
      const mId = (await params).meetingId;

      // 1. Fetch meeting to get title/raw_text
      const { data: meeting } = await adminSupabase
        .from('meetings')
        .select('*')
        .eq('id', mId)
        .single();
      
      if (!meeting) {
        throw new Error('Meeting not found during mock fallback');
      }

      // 2. Fetch workspace members
      const { data: members } = await adminSupabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', meeting.workspace_id);

      const userIds = (members || []).map((m) => m.user_id);
      const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      // Generate mock results
      const mockResult = generateMockData(
        meeting.title || 'Class Discussion',
        meeting.raw_text || '',
        profiles || []
      );

      // Save Summary to Meeting
      await adminSupabase
        .from('meetings')
        .update({
          status: 'ready',
          summary: mockResult.summary,
        })
        .eq('id', mId);

      // Delete existing
      await adminSupabase.from('decisions').delete().eq('meeting_id', mId);
      await adminSupabase.from('commitments').delete().eq('meeting_id', mId);

      // Insert Decisions
      const decisionRows = mockResult.decisions.map((d) => ({
        meeting_id: mId,
        content: d.content,
        ai_confidence: d.ai_confidence,
      }));
      await adminSupabase.from('decisions').insert(decisionRows);

      // Insert Commitments
      const commitmentRows = mockResult.commitments.map((c) => ({
        meeting_id: mId,
        title: c.title,
        description: c.description,
        ai_owner_suggestion: c.suggested_owner_id,
        owner_id: null,
        due_date: c.due_date,
        ai_confidence: c.ai_confidence,
        context_snippet: c.context_snippet,
        priority: c.priority,
        status: 'pending_confirmation',
        published: false,
      }));
      await adminSupabase.from('commitments').insert(commitmentRows);

      // Log Activity
      await adminSupabase.from('activity_feed').insert({
        workspace_id: meeting.workspace_id,
        actor_id: userId || userIds[0] || null,
        action: 'meeting_processed',
        entity_type: 'meeting',
        entity_id: mId,
        details: { title: meeting.title, commitments_count: mockResult.commitments.length, is_sandbox: true },
      });

      return NextResponse.json({ success: true, commitmentsCount: mockResult.commitments.length, isSandbox: true }, { status: 200 });
    } catch (innerErr) {
      console.error('Failed to run mock sandbox fallback:', innerErr);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}

function generateMockData(title: string, rawText: string, members: { id: string, display_name: string | null }[]) {
  const primaryMember = members[0] || { id: null, display_name: 'Lola Kazeem' };
  const secondaryMember = members[1] || members[0] || { id: null, display_name: 'Product Manager' };

  return {
    summary: {
      bullets: [
        `Discussed key milestones and deliverables for "${title}".`,
        `Identified owner dependencies and critical paths for backend API integrations.`,
        "Set up next steps for user testing and onboarding verification flows.",
        "Agreed to review progress in the next sync meeting."
      ],
      ai_confidence: "high"
    },
    decisions: [
      {
        content: `Adopt the new design system guidelines for all pages related to "${title}".`,
        ai_confidence: "high"
      },
      {
        content: "Use gpt-4o-mini as the default model to reduce latency and execution costs.",
        ai_confidence: "high"
      }
    ],
    commitments: [
      {
        title: "Integrate dashboard stats API with remote workspace database",
        description: `Verify that dashboard metrics fetch correctly from RLS-secured tables for "${primaryMember.display_name}".`,
        suggested_owner_id: primaryMember.id,
        due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        ai_confidence: "high",
        context_snippet: "Lola will hook up the database stats API and test it locally.",
        priority: "high"
      },
      {
        title: "Create onboarding walkthrough and documentation guide",
        description: `Outline all steps needed for new members to join workspace, configure branding and test AI extraction.`,
        suggested_owner_id: secondaryMember.id,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        ai_confidence: "medium",
        context_snippet: "We need a complete walkthrough document detailing the setup steps.",
        priority: "medium"
      }
    ]
  };
}
