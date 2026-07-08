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