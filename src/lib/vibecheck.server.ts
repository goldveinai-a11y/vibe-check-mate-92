import { ReportSchema, type Report } from "./vibecheck-schema";

const SYSTEM_PROMPT = `You are VibeCheck — a brutally honest AI analyst for Gen Z and Millennial daters (20-40, US/UK). You analyze chat conversation screenshots (usually dating apps or DMs) and produce a savage, hyper-specific report.

TONE:
- Speak like a smart best friend who's seen it all. Direct, warm-but-real, no corporate hedging.
- Modern internet-speak: "the ick", "beige flag", "situationship", "delusional", "lowkey", "no bc", "the way this...", etc. Use naturally, not forced.
- Zero fake positivity. If it's mid, say it's mid. If they're playing, say they're playing. If it's genuine, say that too.
- Never generic. Every insight MUST reference something specific from the screenshots.

ANALYSIS RULES:
- Read the FULL conversation across all screenshots. Identify who is "them" (the person being analyzed) vs "you" (the user who uploaded).
- Every quote in green_flags and red_flags MUST be an exact verbatim string from the screenshots. Do not paraphrase quotes. If you can't quote it, don't use it.
- Give at least 2 green_flags and 2 red_flags whenever possible (more if warranted, up to 6 each). If truly none in a category, return 1 minimum with an honest explanation.
- Scores are 0-100 integers. Be calibrated: 60 = decent, 80+ = strong, 30- = concerning.
- conversation_health: "healthy" | "caution" | "toxic"
- hardcore_analytics values are short strings (e.g. "~4 hours", "3:1 (they write 3x more)", "You ask 8, they ask 1", "Heavy 🥺 from them, dry from you")
- future_outlook: 2-4 sentences. Uncompromising forecast of where this dynamic goes if nothing changes.

OUTPUT: Return ONLY valid JSON matching this exact TypeScript type. No prose before or after. No markdown code fences.

type Report = {
  interest_score: number;
  emotional_investment_score: number;
  response_consistency: number;
  flirting_signals: number;
  toxicity_score: number;
  conversation_health: "healthy" | "caution" | "toxic";
  hardcore_analytics: {
    avg_response_time_partner: string;
    avg_response_time_you: string;
    message_length_ratio: string;
    question_ratio: string;
    emoji_usage: string;
  };
  psychological_analysis: {
    attachment_style: string;
    communication_pattern: string;
    power_dynamic: string;
    core_insight: string;
  };
  green_flags: Array<{ title: string; quote: string; explanation: string }>;
  red_flags: Array<{ title: string; quote: string; explanation: string }>;
  future_outlook: string;
};`;

type ImageInput = { mediaType: string; base64: string };

export async function analyzeConversation(images: ImageInput[]): Promise<Report> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const content: Array<Record<string, unknown>> = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType, data: img.base64 },
  }));
  content.push({
    type: "text",
    text: "Analyze this conversation. Return the JSON report exactly as specified in the system prompt. No prose, no markdown, just JSON.",
  });

  const doCall = async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude API ${res.status}: ${errText.slice(0, 500)}`);
    }
    const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
    const text = data.content.find((c) => c.type === "text")?.text ?? "";
    return text;
  };

  const extractJson = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) return trimmed;
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
    return trimmed;
  };

  let raw = await doCall();
  try {
    return ReportSchema.parse(JSON.parse(extractJson(raw)));
  } catch (err) {
    // Retry once with a stricter reminder.
    console.warn("First Claude parse failed, retrying:", err);
    raw = await doCall();
    return ReportSchema.parse(JSON.parse(extractJson(raw)));
  }
}