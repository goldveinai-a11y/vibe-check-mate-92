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

export const ReportSchema = z.object({
  scores: ScoresSchema,
  hardcore_analytics: HardcoreAnalyticsSchema,
  psychological_analysis: PsychAnalysisSchema,
  green_flags: z.array(FlagSchema).min(1).max(6),
  red_flags: z.array(FlagSchema).min(1).max(6),
  future_outlook: z.string(),
});

export type Report = z.infer<typeof ReportSchema>;
export type Flag = z.infer<typeof FlagSchema>;
export type Scores = z.infer<typeof ScoresSchema>;

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
  };
}

export type Preview = ReturnType<typeof buildPreview>;