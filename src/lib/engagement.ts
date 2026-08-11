// When to show the paywall.
//
// The rule this replaces was "hand off to a report once five slots are
// filled". Two days of paid traffic killed it: thirteen people started a
// chat, the median stopped at three replies, one reached a read. The chat
// was an intake pretending to be a conversation, and the paywall sat behind
// a door almost nobody opened.
//
// The new rule is that the chat IS the product and the wall goes up inside
// it. The question is only when.
//
// Not on a message count. Message five from someone who pasted a screenshot
// and a two-paragraph account of last night is not the same event as message
// five from someone typing three words at a time, and charging them at the
// same moment treats a committed user and a tourist identically.
//
// So: a score. And one timing rule that matters more than the score — cut at
// a peak, never in a trough. Someone who has just described something
// painful and gets a price instead of an answer feels used, does not pay,
// and does not come back. The wall waits for the turn AFTER the model has
// said something worth hearing.

export type Tier = "T0" | "T1" | "T2" | "T3";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  images?: number;
};

// Ten is a starting guess, not a finding. It puts a user who uploads a
// screenshot and writes at length at the wall around their third message,
// and a monosyllabic one at their eighth. Both ends are deliberate. This
// number is the first thing to A/B once there is traffic.
export const PAYWALL_THRESHOLD = 10;

// Below this the product has not yet proved it is worth money, whatever the
// score says. Two substantive replies is the floor.
export const MIN_AI_REPLIES = 2;

// And an upper bound, so a low-scoring but persistent user does not read
// forever for free.
export const MAX_FREE_USER_MESSAGES = 12;

const LONG_MESSAGE_CHARS = 200;

// She is asking for a read, not venting. "What do I do", "is he", "am I
// being" — the shape of someone who wants an answer and will notice if she
// does not get one.
const DIRECT_ASK = [
  /\bwhat (do|should) i do\b/i,
  /\bshould i\b/i,
  /\bis (he|she|they|this|that) (actually |even |really )?\w+ing\b/i,
  /\bam i (being|the|overreacting|crazy|wrong)\b/i,
  /\bdoes (he|she|they) (actually |even |really )?\w+/i,
  /\bwhat does (this|that|it) mean\b/i,
  /\bis (this|that) normal\b/i,
  /\bwhy (does|is|did) (he|she|they)\b/i,
];

// A named person, a dated event, a quoted line. All three mean she has
// stopped describing a category and started describing her actual life,
// which is the point at which the product can do anything useful.
const SPECIFICS = [
  /\b(last night|yesterday|this morning|last week|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  /\b\d{1,2}\s?(am|pm)\b/i,
  /"[^"]{8,}"/,
  /\u201C[^\u201D]{8,}\u201D/,
  /\bhe (said|texted|wrote|replied|told me)\b/i,
];

// Raw disclosure. Not a scoring signal — a veto on showing the wall this
// turn. Putting a price in front of someone who has just said the hardest
// thing they came to say is the single most expensive thing this product
// could do, in refunds and in what it would make us.
const RAW_DISCLOSURE = [
  /\bi'?ve never told anyone\b/i,
  /\bi'?m scared\b/i,
  /\bi (cry|cried|can'?t stop crying)\b/i,
  /\bi feel (so |completely |totally )?(alone|worthless|stupid|broken|trapped)\b/i,
  /\bi don'?t know who i am\b/i,
  /\bi think i'?m losing\b/i,
  /\bevery day\b.*\b(worse|harder|tired)\b/i,
];

export function looksLikeDirectAsk(text: string): boolean {
  return DIRECT_ASK.some((r) => r.test(text));
}

export function mentionsSpecifics(text: string): boolean {
  return SPECIFICS.some((r) => r.test(text));
}

export function isRawDisclosure(text: string): boolean {
  return RAW_DISCLOSURE.some((r) => r.test(text));
}

export type EngagementInput = {
  turns: ChatTurn[];
  sessionMs: number;
  returning: boolean;
};

export type EngagementBreakdown = {
  score: number;
  parts: Record<string, number>;
  userMessages: number;
  aiReplies: number;
  screenshots: number;
};

export function scoreEngagement(input: EngagementInput): EngagementBreakdown {
  const user = input.turns.filter((t) => t.role === "user");
  const ai = input.turns.filter((t) => t.role === "assistant");
  const screenshots = user.reduce((n, t) => n + (t.images ?? 0), 0);

  const parts: Record<string, number> = {
    messages: user.length,
    long: user.filter((t) => t.content.length > LONG_MESSAGE_CHARS).length * 2,
    // Four, and the highest single weight on the list. Uploading a
    // screenshot means leaving the page, opening the photo library and
    // choosing — the most effort any user will spend here, and the clearest
    // statement that she wants this taken seriously.
    screenshots: screenshots > 0 ? 4 : 0,
    specifics: user.some((t) => mentionsSpecifics(t.content)) ? 2 : 0,
    directAsk: user.some((t) => looksLikeDirectAsk(t.content)) ? 2 : 0,
    time: input.sessionMs > 3 * 60_000 ? 2 : 0,
    // A second session is worth more than anything that happens in the
    // first. She closed the tab, went back to her life, and chose to come
    // back — no other signal here comes close to that.
    returning: input.returning ? 5 : 0,
  };

  const score = Object.values(parts).reduce((a, b) => a + b, 0);
  return { score, parts, userMessages: user.length, aiReplies: ai.length, screenshots };
}

export type PaywallDecision = {
  show: boolean;
  reason:
    | "score"
    | "ceiling"
    | "below_threshold"
    | "too_early"
    | "raw_disclosure"
    | "safety_tier"
    | "already_paid";
};

export function decidePaywall(args: {
  breakdown: EngagementBreakdown;
  lastUserMessage: string;
  tier: Tier;
  isPaid: boolean;
}): PaywallDecision {
  const { breakdown, lastUserMessage, tier, isPaid } = args;

  if (isPaid) return { show: false, reason: "already_paid" };

  // Absolute. Someone describing monitoring, threats or violence is not a
  // conversion opportunity, and a product that treats her as one does not
  // deserve the traffic. The safety route stays free at every tier, forever,
  // and this rule sits above the score, the ceiling and everything else.
  if (tier === "T2" || tier === "T3") return { show: false, reason: "safety_tier" };

  if (breakdown.aiReplies < MIN_AI_REPLIES) return { show: false, reason: "too_early" };

  // Wait one turn. She gets the answer to this, and the wall meets her on
  // the next thing she types.
  if (isRawDisclosure(lastUserMessage)) return { show: false, reason: "raw_disclosure" };

  if (breakdown.userMessages >= MAX_FREE_USER_MESSAGES) return { show: true, reason: "ceiling" };
  if (breakdown.score >= PAYWALL_THRESHOLD) return { show: true, reason: "score" };

  return { show: false, reason: "below_threshold" };
}
