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
  // The uploader's ("you") own writing-style fingerprint — structural only
  // (sentence length, emoji use, formality, humor, directness), never
  // verbatim quotes, since raw screenshots aren't retained after analysis
  // (see "no receipts kept" privacy promise). Optional so reports generated
  // before this field existed still parse cleanly. Consumed by
  // vibecheck-chat.server.ts's reply-suggestion coach so suggested replies
  // sound like the actual user, not a generic tone label.
  your_voice_style: z.string().max(220).optional(),
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

// A dated, falsifiable claim about observable behaviour, generated at the
// end of every report.
//
// Why this exists: the report used to end on "Loop closed" - which is a
// literal instruction to stop thinking about it. That's the correct
// emotional beat and a catastrophic commercial one, because it closes the
// exact Zeigarnik loop the /science page cites as the reason people come
// back. This replaces closure with an open question that has a date on it.
//
// The second reason matters more than the first: a prediction that can be
// publicly wrong is the only structural defence against sycophancy. A model
// that never commits to anything can always agree with the user; a model
// that has to post a checkable claim has to mean it.
export const PredictionSchema = z.object({
  // "He won't name a specific day." Observable, binary, checkable by
  // looking at her phone.
  claim: z.string().min(1).max(200),
  window_days: z.number().int().min(5).max(21),
  // What would prove the prediction wrong. Stated separately so the claim
  // can't hide behind vagueness - if you can't write the falsifier, the
  // claim wasn't a prediction, it was a horoscope.
  falsifier: z.string().min(1).max(200),
});

// The second line of analysis: her, not him.
//
// Every competitor analyses the other person. But the question underneath
// "what is he doing" is almost always "am I losing my mind" - and a product
// that only ever describes him can't answer it. Commercially this is also
// the single biggest LTV lever available: a report about him dies when the
// relationship does, a read on her own pattern outlives it.
//
// Deliberately NOT rendered when safety.concern is true - see the prompt.
// "Here's what you're doing that keeps this going" is a useful mirror in a
// bad dynamic and straightforward victim-blaming in an abusive one.
export const SelfMirrorSchema = z.object({
  title: z.string().min(1).max(80),
  observation: z.string().min(1).max(340),
  mechanic: z.string().min(1).max(340),
});

// Duluth Power & Control routing. When coercion, threats, intimidation,
// isolation or financial control show up, the product stops being clever
// and points at real help.
//
// This is not a disclaimer bolted on for cover. A scoring engine that hands
// someone a "Toxicity 74%" badge and a pop-culture joke while she's
// describing being threatened is doing active harm, and no amount of
// footnote fixes that. The scores still compute; the presentation changes.
export const SafetySchema = z.object({
  concern: z.boolean(),
  categories: z.array(z.string().min(1).max(60)).max(8),
  note: z.string().max(400),
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
  // Both were .min(1), and that took down a real report: an eleven-year
  // marriage built on contempt, where the model honestly found nothing good
  // to list. Zod rejected the empty array and the user got "the AI could not
  // read it" instead of her read.
  //
  // The floor of one is a demand for false balance, and it fails at exactly
  // the two ends of the scale where the read matters most — a relationship
  // with no green flags left, and a genuinely healthy one with no red flags
  // to find. It also fails hardest for the most distressed user, who is the
  // one most likely to pay. A product whose whole pitch is refusing to tell
  // her what she wants to hear should not require it to invent a positive.
  green_flags: z.array(FlagSchema).min(0).max(6),
  red_flags: z.array(FlagSchema).min(0).max(6),
  future_outlook: z.string(),
  suggested_replies: SuggestedRepliesSchema.optional(),
  viral: ViralSchema.optional(),
  // All three optional so every report generated before these fields
  // existed still parses. The UI falls back to the old ending when
  // prediction is missing.
  prediction: PredictionSchema.optional(),
  self_mirror: SelfMirrorSchema.optional(),
  safety: SafetySchema.optional(),
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
  // Deliberately given away in full on the free page rather than held back
  // for the paid report.
  //
  // The prediction is not premium content, it's the return mechanism - and
  // the email that makes it work can only be collected from people who
  // haven't paid yet, because everyone who pays already hands over an
  // address at checkout. Putting it behind the paywall would mean the only
  // addresses we ever hold belong to the people we least need to bring
  // back. It also costs nothing: it's one sentence the model already wrote.
  prediction?: { claim: string; window_days: number; falsifier: string } | null;
  // Safety travels with the preview too - the free page renders scores and
  // a verdict, and those need suppressing in exactly the same situations
  // the full report does.
  safety?: { concern: boolean; categories: string[]; note: string } | null;
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

  const hardcoreAnalytics = r.hardcore_analytics as Record<string, unknown> | undefined;
  if (hardcoreAnalytics && typeof hardcoreAnalytics.your_voice_style === "string") {
    r.hardcore_analytics = {
      ...hardcoreAnalytics,
      your_voice_style: clampStr(hardcoreAnalytics.your_voice_style, 220),
    };
  }

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

  const prediction = r.prediction as Record<string, unknown> | undefined;
  if (prediction) {
    r.prediction = {
      ...prediction,
      claim: clampStr(prediction.claim, 200),
      falsifier: clampStr(prediction.falsifier, 200),
    };
  }

  const selfMirror = r.self_mirror as Record<string, unknown> | undefined;
  if (selfMirror) {
    r.self_mirror = {
      ...selfMirror,
      title: clampStr(selfMirror.title, 80),
      observation: clampStr(selfMirror.observation, 340),
      mechanic: clampStr(selfMirror.mechanic, 340),
    };
  }

  const safety = r.safety as Record<string, unknown> | undefined;
  if (safety) {
    r.safety = { ...safety, note: clampStr(safety.note, 400) };
  }

  // Hard invariant, enforced in code rather than trusted to the prompt:
  // never show someone a breakdown of what SHE is doing to sustain the
  // pattern while she is describing coercion. The model is told this too,
  // but a rule this consequential shouldn't depend on the model obeying.
  if (safety && safety.concern === true) {
    delete r.self_mirror;
  }

  return r;
}

export type Report = z.infer<typeof ReportSchema>;
export type Flag = z.infer<typeof FlagSchema>;
export type Scores = z.infer<typeof ScoresSchema>;
export type Viral = z.infer<typeof ViralSchema>;
export type ViralKeyword = z.infer<typeof ViralKeywordSchema>;
export type SuggestedReplies = z.infer<typeof SuggestedRepliesSchema>;
export type Prediction = z.infer<typeof PredictionSchema>;
export type SelfMirror = z.infer<typeof SelfMirrorSchema>;
export type Safety = z.infer<typeof SafetySchema>;

// The date a prediction becomes checkable. Kept here rather than in the
// page so the report page, any future email, and the check-in flow all
// compute the same day from the same two inputs.
export function predictionDueDate(createdAtIso: string, windowDays: number): Date {
  const d = new Date(createdAtIso);
  d.setDate(d.getDate() + windowDays);
  return d;
}

export function formatPredictionDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

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
  const safetyConcern = report.safety?.concern === true;
  return {
    scores: report.scores,
    initiative_stat: report.hardcore_analytics.initiative_stat,
    green_flag_preview: report.green_flags[0] ?? null,
    red_flag_preview: report.red_flags[0]
      ? { title: report.red_flags[0].title }
      : null,
    green_flags_count: report.green_flags.length,
    red_flags_count: report.red_flags.length,
    prediction: report.prediction ?? null,
    safety: report.safety ?? null,
    // Same suppression rule as the full report: no award, no pop-culture
    // pairing, no shareable badge when the safety router has fired.
    viral_preview: !safetyConcern && report.viral
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
