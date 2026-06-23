import { MAX_TRANSCRIPT_CHARS } from '@/lib/constants';
import { type SupabaseClient } from '@supabase/supabase-js';

interface AIProcessingInput {
  meetingId: string;
  rawText: string;
  meetingTitle: string;
  meetingDate: string;
  workspaceId: string;
  members: { id: string; display_name: string | null }[];
}

interface AIProcessingOutput {
  summary: { bullets: string[]; ai_confidence: string };
  decisions: { content: string; ai_confidence: string }[];
  commitments: {
    title: string;
    description: string | null;
    suggested_owner_id: string | null;
    due_date: string | null;
    ai_confidence: string;
    context_snippet: string | null;
    priority: string;
  }[];
}


function buildPrompts(input: AIProcessingInput) {
  const { rawText, meetingTitle, meetingDate, members } = input;

  const memberListStr = members
    .map((m) => `- Name: "${m.display_name}", ID: "${m.id}"`)
    .join('\n');

  let transcriptText = rawText;
  if (transcriptText.length > MAX_TRANSCRIPT_CHARS) {
    transcriptText =
      transcriptText.slice(0, MAX_TRANSCRIPT_CHARS) +
      '\n\n[Transcript truncated due to length. Some content may not have been processed.]';
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

  const userPrompt = `Meeting Title: ${meetingTitle}
Meeting Date: ${meetingDate}
Meeting Content:
${transcriptText}`;

  return { systemPrompt, userPrompt };
}

async function callAIAPI(systemPrompt: string, userPrompt: string) {
  const isDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  const defaultModel = isDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini';
  const model = process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || defaultModel;
  const defaultBase = isDeepSeek ? 'https://api.deepseek.com' : 'https://api.openai.com/v1';
  const baseUrl = process.env.DEEPSEEK_API_BASE || defaultBase;

  if (!apiKey) {
    throw new Error('AI API key is missing');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('AI returned empty response');
    }

    return JSON.parse(choice.message.content);
  } finally {
    clearTimeout(timeout);
  }
}

function parseAIResponse(raw: Record<string, unknown>): AIProcessingOutput {
  return {
    summary: {
      bullets: Array.isArray((raw.summary as Record<string, unknown>)?.bullets) ? (raw.summary as Record<string, unknown>).bullets as string[] : [],
      ai_confidence: ((raw.summary as Record<string, unknown>)?.ai_confidence as string) || 'medium',
    },
    decisions: Array.isArray(raw.decisions) ? (raw.decisions as Record<string, unknown>[]).map((d: Record<string, unknown>) => ({
      content: String(d.content ?? ''),
      ai_confidence: (d.ai_confidence as string) || 'medium',
    })) : [],
    commitments: Array.isArray(raw.commitments) ? (raw.commitments as Record<string, unknown>[]).map((c: Record<string, unknown>) => ({
      title: String(c.title ?? ''),
      description: c.description ? String(c.description) : null,
      suggested_owner_id: c.suggested_owner_id ? String(c.suggested_owner_id) : null,
      due_date: c.due_date ? String(c.due_date) : null,
      ai_confidence: (c.ai_confidence as string) || 'medium',
      context_snippet: c.context_snippet ? String(c.context_snippet) : null,
      priority: (c.priority as string) || 'medium',
    })) : [],
  };
}

async function saveResults(
  adminSupabase: SupabaseClient,
  meetingId: string,
  userId: string,
  workspaceId: string,
  meetingTitle: string,
  result: AIProcessingOutput
) {
  await adminSupabase
    .from('meetings')
    .update({
      status: 'ready',
      summary: { bullets: result.summary.bullets, ai_confidence: result.summary.ai_confidence },
    })
    .eq('id', meetingId);

  await adminSupabase.from('decisions').delete().eq('meeting_id', meetingId);
  await adminSupabase.from('commitments').delete().eq('meeting_id', meetingId);

  if (result.decisions.length > 0) {
    const decisionRows = result.decisions.map((d) => ({
      meeting_id: meetingId,
      content: d.content,
      ai_confidence: d.ai_confidence,
    }));
    await adminSupabase.from('decisions').insert(decisionRows);
  }

  if (result.commitments.length > 0) {
    const commitmentRows = result.commitments.map((c) => ({
      meeting_id: meetingId,
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
  }

  await adminSupabase.from('activity_feed').insert({
    workspace_id: workspaceId,
    actor_id: userId,
    action: 'meeting_processed',
    entity_type: 'meeting',
    entity_id: meetingId,
    details: { title: meetingTitle, commitments_count: result.commitments.length },
  });
}

export async function processMeetingWithAI(
  adminSupabase: SupabaseClient,
  meetingId: string,
  userId: string,
  workspaceId: string,
  meetingTitle: string,
  meetingDate: string,
  rawText: string,
  members: { id: string; display_name: string | null }[]
) {
  const input: AIProcessingInput = {
    meetingId,
    rawText,
    meetingTitle,
    meetingDate,
    workspaceId,
    members,
  };

  const { systemPrompt, userPrompt } = buildPrompts(input);
  const rawResult = await callAIAPI(systemPrompt, userPrompt);
  const parsed = parseAIResponse(rawResult);
  await saveResults(adminSupabase, meetingId, userId, workspaceId, meetingTitle, parsed);

  return parsed;
}
