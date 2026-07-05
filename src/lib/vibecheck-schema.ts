import { z } from "zod";

export const HardcoreAnalyticsSchema = z.object({
  avg_response_time_partner: z.string(),
  avg_response_time_you: z.string(),
  message_length_ratio: z.string(),
  question_ratio: z.string(),
  emoji_usage: z.string(),
});

export const PsychAnalysisSchema = z.object({
  attachment_style: z.string(),
  communication_pattern: z.string(),
  power_dynamic: z.string(),
  core_insight: z.string(),
});

export const FlagSchema = z.object({
  title: z.string(),
  quote: z.string(),
  explanation: z.string(),
});

export const ReportSchema = z.object({
  interest_score: z.number().min(0).max(100),
  emotional_investment_score: z.number().min(0).max(100),
  response_consistency: z.number().min(0).max(100),
  flirting_signals: z.number().min(0).max(100),
  toxicity_score: z.number().min(0).max(100),
  conversation_health: z.enum(["healthy", "caution", "toxic"]),
  hardcore_analytics: HardcoreAnalyticsSchema,
  psychological_analysis: PsychAnalysisSchema,
  green_flags: z.array(FlagSchema).min(1).max(6),
  red_flags: z.array(FlagSchema).min(1).max(6),
  future_outlook: z.string(),
});

export type Report = z.infer<typeof ReportSchema>;
export type Flag = z.infer<typeof FlagSchema>;

export function buildPreview(report: Report) {
  return {
    interest_score: report.interest_score,
    emotional_investment_score: report.emotional_investment_score,
    response_consistency: report.response_consistency,
    flirting_signals: report.flirting_signals,
    toxicity_score: report.toxicity_score,
    conversation_health: report.conversation_health,
    green_flag_preview: report.green_flags[0] ?? null,
    red_flag_preview: report.red_flags[0] ?? null,
  };
}

export type Preview = ReturnType<typeof buildPreview>;