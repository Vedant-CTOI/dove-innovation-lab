/**
 * coach.ts — Provider-agnostic LLM coach system for the Minute Maid workshop platform.
 *
 * Three personas (Provocateur, Sharpener, BrandLens) provide multi-turn creative
 * coaching grounded in the Minute Maid Pulpy Orange (India) 50th-anniversary brand brief.
 *
 * CORE PRINCIPLE: PROVOCATION OVER EVALUATION.
 * Coaches NEVER score, rank, or judge. They expand, provoke, and reframe.
 *
 * Provider detection: auto-detects GEMINI_API_KEY (@google/genai),
 * OPENAI_API_KEY (openai), or ANTHROPIC_API_KEY (@anthropic-ai/sdk).
 * All SDK imports are dynamic so a missing package never crashes the server.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The three coach personas. Exported here because types.ts does not export
 * this union; types.ts defines CoachMessage (which we import below) and uses
 * `persona` as a string field whose value is one of these literals.
 */
export type CoachPersona = 'Provocateur' | 'Sharpener' | 'BrandLens';

/** Conversation message — mirrors the CoachMessage interface in types.ts. */
import type { CoachMessage } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FALLBACK_MESSAGE =
  'No LLM key configured — coach unavailable. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.';

/** Generous token budget — thinking models burn tokens before the visible reply. */
const MAX_OUTPUT_TOKENS = 1024;

// ---------------------------------------------------------------------------
// Brand context (sourced from contracts/brand-brief.md)
// ---------------------------------------------------------------------------

const BRAND_CONTEXT = `\
BRAND: Minute Maid Pulpy Orange (India).
OCCASION: 50th Anniversary & New Flavour Launch — "Filled With Life at 50".
WORKSHOP TITLE: "Around the Orchard".

CAMPAIGN TAGLINES:
- "Filled With Life™" — global platform
- "Bounce Back with every Gulp!" — Pulpy Orange line
- "Shake It Up" — India campaign (Feb 2025)
- "World's No.1 Juice Drink" — on-pack badge

TONE: Upbeat, playful, youthful (Gen Z), warm, unpretentious. Short imperatives on
physical verbs — Shake, Bounce, Gulp, Twist. Humor over earnestness. Sensory/texture-forward.

DESIGN LANGUAGE: Motion posture is shake → bounce → burst. The product ritual is
"shake to distribute the pulp." Pulp burst = the ownable asset — radial burst of
golden-yellow pulp shards exploding from behind focal elements.

MARKET: India. Target: Gen Z and young millennials. Product: pulpy orange juice drink.`;

// ---------------------------------------------------------------------------
// Provocation-over-evaluation principle (shared across all personas)
// ---------------------------------------------------------------------------

const PROVOCATION_PRINCIPLE = `\
CRITICAL PRINCIPLE — PROVOCATION OVER EVALUATION:
You are a creative coach, NOT a judge. You NEVER score, rank, grade, or evaluate ideas.
Never say an idea is "good", "bad", "strong", "weak", "better", or "worse".
Never compare ideas or suggest which is "the best".
Your sole job is to EXPAND, PROVOKE, and REFRAME — open new doors, challenge thinking,
stretch the idea into territory the participant hasn't explored yet.

Judged participants stop submitting → creative volume collapses → the workshop dies.
Your role is to keep the creative energy flowing, always.`;

// ---------------------------------------------------------------------------
// Persona system prompts
// ---------------------------------------------------------------------------

const PERSONA_PROMPTS: Record<CoachPersona, string> = {
  Provocateur: `\
You are THE PROVOCATEUR — a fearless creative coach who challenges assumptions,
pushes boundaries, and reframes problems. You are the person in the room who says
the uncomfortable thing that makes everyone think differently.

${BRAND_CONTEXT}

${PROVOCATION_PRINCIPLE}

YOUR APPROACH:
- Challenge the obvious. "What if the opposite were true?"
- Push beyond the first idea. "That's the safe version — what's the dangerous one?"
- Reframe the problem entirely. Shift the angle so the participant sees new possibility.
- Introduce productive tension. "What would make a brand manager nervous? Go there."
- Use provocation as a creative tool, never as cruelty. Be bold but warm.
- One provocation at a time — don't list five questions. Pick the sharpest one.

Respond in 2-4 sentences. Be direct, vivid, and energizing. No bullet points.`,

  Sharpener: `\
You are THE SHARPENER — a precise editor-coach who refines language, tightens value
propositions, and clarifies impact. You are the copy director who trims the fat until
the idea hits like a pulpy burst.

${BRAND_CONTEXT}

${PROVOCATION_PRINCIPLE}

YOUR APPROACH:
- Refine the language. "Say it in fewer words. Say it so a 12-year-old feels it."
- Tighten the value proposition. What is the ONE thing this idea delivers?
- Clarify impact. "Who feels this? What changes for them the moment it happens?"
- Sharpen the hook. Make the idea instantly graspable.
- Offer 1-2 alternative articulations that cut through the noise — sharper phrasing,
  not a different idea.
- Never evaluate. Don't say "this is clear" or "this is muddy." Just make it sharper.

Respond in 2-4 sentences. Be surgical, clear, and actionable. No bullet points.`,

  BrandLens: `\
You are THE BRAND LENS — a brand strategist who grounds ideas in brand equity, consumer
insight, and market reality. You are the person who asks "Does this feel like Minute Maid,
or could any brand do this?"

${BRAND_CONTEXT}

${PROVOCATION_PRINCIPLE}

YOUR APPROACH:
- Ground ideas in Minute Maid's brand equity: 50 years of "Filled With Life," pulpy
  authenticity, the shake-to-distribute-pulp ritual, the burst of golden pulp.
- Connect to consumer insight: Gen Z India, playful, sensory, anti-boring, humor over
  earnestness.
- Ask where this lives: "Is this an Instagram reel, an in-store activation, an on-pack
  moment, a campus event? What medium makes it sing?"
- Link to campaign pillars: "Filled With Life at 50," "Bounce Back," "Shake It Up."
- Provoke brand ownership: "What makes this unmistakably Minute Maid? What would need to
  change for a competitor to steal it tomorrow?"
- Never evaluate. Don't say "this is on-brand" or "off-brand." Just expand the brand lens.

Respond in 2-4 sentences. Be insightful, brand-true, and expansive. No bullet points.`,
};

// ---------------------------------------------------------------------------
// Provider detection
// ---------------------------------------------------------------------------

type LLMProvider = 'gemini' | 'openai' | 'anthropic';

function detectProvider(): LLMProvider | null {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

// ---------------------------------------------------------------------------
// Message building
// ---------------------------------------------------------------------------

/** Provider-agnostic message shape (OpenAI-compatible roles). */
interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Build the full message array for the LLM call: system prompt, conversation
 * history (multi-turn), and the current idea as the latest user message.
 */
function buildMessages(
  persona: CoachPersona,
  ideaText: string,
  history: CoachMessage[],
): ProviderMessage[] {
  const messages: ProviderMessage[] = [
    { role: 'system', content: PERSONA_PROMPTS[persona] },
  ];

  // Replay conversation history — coaches are conversational (multi-turn).
  for (const msg of history) {
    messages.push({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text,
    });
  }

  // Current idea as the latest user turn.
  messages.push({
    role: 'user',
    content: `Coach this idea:\n\n${ideaText}`,
  });

  return messages;
}

// ---------------------------------------------------------------------------
// Provider implementations (all use dynamic import — lazy / crash-safe)
// ---------------------------------------------------------------------------

/**
 * Gemini — @google/genai SDK.
 * Default model: gemini-2.5-flash (per contract).
 * Override with GEMINI_MODEL env var.
 */
async function callGemini(messages: ProviderMessage[]): Promise<string> {
  // @ts-ignore — optional dependency, dynamically imported; missing package throws at runtime (caught by caller)
  const { GoogleGenAI } = await import('@google/genai');

  const apiKey = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const ai = new GoogleGenAI({ apiKey });

  // Gemini separates system instruction from conversation contents.
  const systemInstruction =
    messages.find((m) => m.role === 'system')?.content ?? '';
  const conversation = messages.filter((m) => m.role !== 'system');

  // Gemini uses 'user'/'model' roles.
  const contents = conversation.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  return response.text ?? '';
}

/**
 * OpenAI — openai SDK (v4+).
 * Default model: gpt-4o.
 * Override with OPENAI_MODEL env var.
 */
async function callOpenAI(messages: ProviderMessage[]): Promise<string> {
  // @ts-ignore — optional dependency, dynamically imported; missing package throws at runtime (caught by caller)
  const OpenAI = (await import('openai')).default;

  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model,
    // OpenAI accepts system/user/assistant roles directly.
    messages: messages as unknown as Array<Record<string, string>>,
    max_tokens: MAX_OUTPUT_TOKENS,
  });

  return response.choices[0]?.message?.content ?? '';
}

/**
 * Anthropic — @anthropic-ai/sdk.
 * Default model: claude-sonnet-4-20250514.
 * Override with ANTHROPIC_MODEL env var.
 */
async function callAnthropic(messages: ProviderMessage[]): Promise<string> {
  // @ts-ignore — optional dependency, dynamically imported; missing package throws at runtime (caught by caller)
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  const client = new Anthropic({ apiKey });

  // Anthropic separates system prompt from conversation messages.
  const systemInstruction =
    messages.find((m) => m.role === 'system')?.content ?? '';
  const conversation = messages.filter((m) => m.role !== 'system');

  const response = await client.messages.create({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemInstruction,
    messages: conversation.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  });

  // Anthropic returns content as an array of blocks; extract text.
  const textBlock = response.content.find(
    (block: { type: string }) => block.type === 'text',
  );
  return (textBlock as { text?: string })?.text ?? '';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Request a coaching reply from the active LLM provider.
 *
 * @param persona   — which coach persona to invoke
 * @param ideaText  — the idea text to coach
 * @param history   — prior conversation messages for this idea (multi-turn)
 * @returns         — the coach's reply text, or a graceful fallback message
 *
 * If no API key is configured, returns a human-readable fallback (never throws).
 * If an API key IS set but the SDK package or the call fails, returns an error
 * message (never throws) so the workshop continues uninterrupted.
 */
export async function requestCoach(
  persona: CoachPersona,
  ideaText: string,
  history: CoachMessage[],
): Promise<string> {
  const provider = detectProvider();

  if (!provider) {
    return FALLBACK_MESSAGE;
  }

  const messages = buildMessages(persona, ideaText, history);

  try {
    switch (provider) {
      case 'gemini':
        return await callGemini(messages);
      case 'openai':
        return await callOpenAI(messages);
      case 'anthropic':
        return await callAnthropic(messages);
      default:
        return FALLBACK_MESSAGE;
    }
  } catch (error) {
    // Never crash the server — log and return a graceful message.
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[coach] ${provider} call failed:`, detail);
    return `Coach is temporarily unavailable (${provider} error). Please try again in a moment.`;
  }
}
