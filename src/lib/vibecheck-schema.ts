import { z } from "zod";

export const ScoresSchema = z.object({
  interest_score: z.number().min(0).max(100),
  reciprocity_score: z.number().min(0).max(100),
  emotional_warmth: z.number().min(0).max(100),
  response_consistency: z.number().min(0).max(100),
  flirting_signals: z.number().min(0).max(100),
  toxicity_score: z.number().min(0).max(100),
  conversation_health: z.number().min(0).max(100),
});

export const HardcoreAnalyticsSchema = z.object({
  initiative_stat: z.string(),
  engagement_stat: z.string(),
  timeline_changes: z.string(),
  communication_style: z.string(),
});

export const PsychAnalysisSchema = z.object({
  attachment_style_prediction: z.string(),
  gottman_patterns: z.string(),
});

export const FlagSchema = z.object({
  title: z.string(),
  quote: z.string(),
  explanation: z.string(),
});

export const ViralKeywordSchema = z.object({
  word: z.string().min(1).max(60),
  type: z.enum(["red_flag", "green_flag", "beige_flag"]),
  impact: z.string().min(1).max(240),
});

export const VibeAwardSchema = z.object({
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(200),
});

export const PopCultureMatchSchema = z.object({
  couple: z.string().min(1).max(100),
  source: z.string().min(1).max(80),
  explanation: z.string().min(1).max(280),
});

export const VibeDecaySchema = z.object({
  trajectory: z.enum(["rising", "steady", "cooling", "nose-diving"]),
  weekly_delta_pct: z.number().min(-100).max(100),
  range: z.string().min(1).max(60),
  verdict: z.string().min(1).max(280),
});

export const SuggestedRepliesSchema = z.object({
  warm: z.string().min(1).max(300),
  neutral: z.string().min(1).max(300),
});

export const ViralSchema = z.object({
  vibe_award: VibeAwardSchema,
  pop_culture_match: PopCultureMatchSchema,
  their_type_in_3_words: z.array(z.string().min(1).max(30)).length(3),
  viral_keywords: z.array(ViralKeywordSchema).min(1).max(6),
  vibe_decay: VibeDecaySchema,
});

export const ReportSchema = z.object({
  scores: ScoresSchema,
  hardcore_analytics: HardcoreAnalyticsSchema,
  psychological_analysis: PsychAnalysisSchema,
  green_flags: z.array(FlagSchema).min(1).max(6),
  red_flags: z.array(FlagSchema).min(1).max(6),
  future_outlook: z.string(),
  suggested_replies: SuggestedRepliesSchema.optional(),
  viral: ViralSchema.optional(),
});

// Shape of `analyses.preview_json` as built by buildPreview() below — the
// free, pre-paywall preview payload. Shared between results.$id.tsx (free
// preview page) and compare.$id.tsx (Compare Vibes) so both read the exact
// same public data contract without duplicating the type.
export type PreviewJson = {
  scores: Scores;
  initiative_stat: string;
  green_flag_preview: { title: string; quote: string; explanation: string } | null;
  red_flag_preview: { title: string } | null;
  green_flags_count: number;
  red_flags_count: number;
  viral_preview?: {
    vibe_award: { title: string; subtitle: string };
    pop_culture_match: { couple: string; source: string; explanation: string };
    first_keyword: { word: string; type: "red_flag" | "green_flag" | "beige_flag"; impact: string } | null;
    keywords_count: number;
  } | null;
};

// Claude is instructed to keep these fields short ("1-2 sentences", "max 20
// words", etc.) but that's a soft guideline, not a hard guarantee — at
// temperature 0 a single overshoot is also fully reproducible, so the
// existing "retry once" in analyzeConversation doesn't help: the retry sends
// the exact same input and gets the exact same too-long field back. Without
// this, ReportSchema.parse() throws on ANY oversized field and kills the
// entire analysis over one slightly-too-long sentence (this is exactly what
// happened live: pop_culture_match.explanation over the 280-char cap failed
// the whole report and leaked a raw Zod error to the user).
// Clamp every bounded free-text field to its schema max BEFORE validating,
// so a verbose field gets trimmed instead of crashing the whole read.
function clampStr(value: unknown, max: number): unknown {
  if (typeof value !== "string" || value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}

export function sanitizeReportShape(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r: Record<string, unknown> = { ...(raw as Record<string, unknown>) };

  const viral = r.viral as Record<string, unknown> | undefined;
  if (viral && typeof viral === "object") {
    const v: Record<string, unknown> = { ...viral };

    const vibeAward = v.vibe_award as Record<string, unknown> | undefined;
    if (vibeAward) {
      v.vibe_award = {
        ...vibeAward,
        title: clampStr(vibeAward.title, 80),
        subtitle: clampStr(vibeAward.subtitle, 200),
      };
    }

    const popCulture = v.pop_culture_match as Record<string, unknown> | undefined;
    if (popCulture) {
      v.pop_culture_match = {
        ...popCulture,
        couple: clampStr(popCulture.couple, 100),
        source: clampStr(popCulture.source, 80),
        explanation: clampStr(popCulture.explanation, 280),
      };
    }

    if (Array.isArray(v.their_type_in_3_words)) {
      v.their_type_in_3_words = v.their_type_in_3_words.map((w) => clampStr(w, 30));
    }

    if (Array.isArray(v.viral_keywords)) {
      v.viral_keywords = v.viral_keywords.map((k) => {
        const kw = k as Record<string, unknown>;
        return { ...kw, word: clampStr(kw.word, 60), impact: clampStr(kw.impact, 240) };
      });
    }

    const vibeDecay = v.vibe_decay as Record<string, unknown> | undefined;
    if (vibeDecay) {
      v.vibe_decay = {
        ...vibeDecay,
        range: clampStr(vibeDecay.range, 60),
        verdict: clampStr(vibeDecay.verdict, 280),
      };
    }

    r.viral = v;
  }

  const suggestedReplies = r.suggested_replies as Record<string, unknown> | undefined;
  if (suggestedReplies) {
    r.suggested_replies = {
      ...suggestedReplies,
      warm: clampStr(suggestedReplies.warm, 300),
      neutral: clampStr(suggestedReplies.neutral, 300),
    };
  }

  return r;
}

export type Report = z.infer<typeof ReportSchema>;
export type Flag = z.infer<typeof FlagSchema>;
export type Scores = z.infer<typeof ScoresSchema>;
export type Viral = z.infer<typeof ViralSchema>;
export type ViralKeyword = z.infer<typeof ViralKeywordSchema>;
export type SuggestedReplies = z.infer<typeof SuggestedRepliesSchema>;

// "Delusion Level" — NOT a new AI judgment, just arithmetic on scores the
// model already produced. It's the gap between how exciting a conversation
// FEELS (flirting + warmth) and how much of that is actually reciprocated
// and consistent (reciprocity + response consistency + conversation health).
// A big gap means the vibe is running ahead of the substance backing it up.
// Framed as "for fun" like vibe_award — no false precision claimed.
export function computeDelusionLevel(scores: Scores): { score: number; label: string; blurb: string } {
  const feeling = (scores.flirting_signals + scores.emotional_warmth) / 2;
  const substance = (scores.reciprocity_score + scores.response_consistency + scores.conversation_health) / 3;
  const score = Math.max(0, Math.min(100, Math.round(feeling - substance)));

  if (score <= 15) return { score, label: "Grounded", blurb: "You're reading this one accurately — the vibe matches the substance." };
  if (score <= 35) return { score, label: "Rose-Tint", blurb: "A little wishful thinking creeping in, but nothing wild." };
  if (score <= 55) return { score, label: "Delulu Era", blurb: "The vibe is outrunning the receipts. Feelings ahead of the facts." };
  return { score, label: "Certified Delusional", blurb: "Big gap between how this feels and what's actually being reciprocated." };
}

export function buildPreview(report: Report) {
  return {
    scores: report.scores,
    initiative_stat: report.hardcore_analytics.initiative_stat,
    green_flag_preview: report.green_flags[0] ?? null,
    red_flag_preview: report.red_flags[0]
      ? { title: report.red_flags[0].title }
      : null,
    green_flags_count: report.green_flags.length,
    red_flags_count: report.red_flags.length,
    viral_preview: report.viral
      ? {
          vibe_award: report.viral.vibe_award,
          pop_culture_match: report.viral.pop_culture_match,
          first_keyword: report.viral.viral_keywords[0] ?? null,
          keywords_count: report.viral.viral_keywords.length,
        }
      : null,
  };
}

export type Preview = ReturnType<typeof buildPreview>;