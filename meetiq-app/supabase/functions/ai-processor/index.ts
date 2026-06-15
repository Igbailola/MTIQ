import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { meeting_id } = await req.json();

    if (!meeting_id) {
      return new Response(JSON.stringify({ error: 'Missing meeting_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch the meeting details
    const { data: meeting, error: meetingError } = await supabaseClient
      .from('meetings')
      .select('*')
      .eq('id', meeting_id)
      .single();

    if (meetingError || !meeting) {
      return new Response(JSON.stringify({ error: 'Meeting not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabaseClient
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meeting_id);

    // 2. Fetch workspace members and their profiles to match owners
    const { data: members, error: membersError } = await supabaseClient
      .from('workspace_members')
      .select('user_id');

    if (membersError) {
      throw new Error(`Failed to fetch workspace members: ${membersError.message}`);
    }

    const userIds = (members || []).map((m: any) => m.user_id);
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const memberListStr = (profiles || [])
      .map((p: any) => `- Name: "${p.display_name}", ID: "${p.id}"`)
      .join('\n');

    // 3. Prepare OpenAI prompt
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
- Ensure the output is valid JSON in the requested format.`;

    const userPrompt = `Meeting Title: ${meeting.title}
Meeting Date: ${meeting.meeting_date}
Meeting Content:
${meeting.raw_text}`;

    const isDeepSeek = !!Deno.env.get('DEEPSEEK_API_KEY');
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY') || Deno.env.get('OPENAI_API_KEY') || '';
    const defaultModel = isDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini';
    const model = Deno.env.get('DEEPSEEK_MODEL') || Deno.env.get('OPENAI_MODEL') || defaultModel;
    const defaultBase = isDeepSeek ? 'https://api.deepseek.com' : 'https://api.openai.com/v1';
    const baseUrl = Deno.env.get('DEEPSEEK_API_BASE') || defaultBase;

    if (!apiKey) {
      throw new Error('AI API_KEY is not set');
    }

    // Call Chat completions
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
    await supabaseClient
      .from('meetings')
      .update({
        status: 'ready',
        summary: { bullets: summaryBullets, ai_confidence: summaryConfidence },
      })
      .eq('id', meeting_id);

    // Delete existing decisions/commitments if re-processing
    await supabaseClient.from('decisions').delete().eq('meeting_id', meeting_id);
    await supabaseClient.from('commitments').delete().eq('meeting_id', meeting_id);

    // Insert Decisions
    const decisions = resultJson.decisions || [];
    if (decisions.length > 0) {
      const decisionRows = decisions.map((d: any) => ({
        meeting_id,
        content: d.content,
        ai_confidence: d.ai_confidence || 'medium',
      }));
      await supabaseClient.from('decisions').insert(decisionRows);
    }

    // Insert Commitments
    const commitments = resultJson.commitments || [];
    if (commitments.length > 0) {
      const commitmentRows = commitments.map((c: any) => ({
        meeting_id,
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
      await supabaseClient.from('commitments').insert(commitmentRows);
    }

    // Log Activity
    await supabaseClient.from('activity_feed').insert({
      workspace_id: meeting.workspace_id,
      action: 'meeting_processed',
      entity_type: 'meeting',
      entity_id: meeting_id,
      details: { title: meeting.title, commitments_count: commitments.length },
    });

    return new Response(JSON.stringify({ success: true, commitmentsCount: commitments.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in Edge Function:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
