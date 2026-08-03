// Shared definitions for the intake quiz that now sits in front of the
// upload step.
//
// Why the quiz exists at all: the old flow asked for the hardest thing
// first - upload screenshots of a private conversation - at the moment of
// lowest investment. 83% of everyone who reached /upload left without ever
// picking a file. The quiz front-loads six easy taps instead, so by the
// time screenshots are mentioned the user has already invested ~30 seconds
// and six answers. It also makes a screenshot-free report possible at all,
// which is the only real escape from TikTok's in-app browser blocking the
// file picker outright.
//
// The answers are ALSO real analytical signal - who initiates and how fast
// they reply are exactly the ratios the report wants - so this isn't
// engagement theater, it feeds the prompt.

export type QuizAnswers = {
  situation: string;
  relationship: string;
  duration: string;
  whoTextsFirst: string;
  replySpeed: string;
  frustration?: string;
  // Optional, collected on the screenshot step rather than as its own
  // question so it costs no extra step. Worth having: a report that says
  // "Jake replies in bursts" lands far harder than "they reply in bursts",
  // and it's also what makes a history list of several reports readable
  // instead of three rows all titled "Chief Logistics Officer".
  theirName?: string;
};

// Escape hatch on question 1. Without it, anyone whose situation isn't one
// of the four listed hits a dead end on the very first tap - and the four
// options, while they cover the common cases (ghosting, hot/cold, no
// plans, unreadable), miss plenty: a fight, someone else in the picture,
// outright manipulation. Extending the list to 7-8 options would just
// trade a coverage problem for a choice-paralysis problem on the most
// important screen on the site, so instead this one option opens a free
// text field on /quiz and overwrites `situation` with whatever she types.
// It doubles as free VOC research: the answers here are a direct list of
// the pains the fixed options are missing.
export const SITUATION_OTHER = "Something else";

export type QuizStep = {
  key: keyof QuizAnswers;
  question: string;
  // Free-text steps have no options and are skippable.
  options?: string[];
  placeholder?: string;
  optional?: boolean;
};

// Step 1 lives inline in the landing hero rather than behind a "start"
// button - tapping a concrete answer reads as answering a question, while
// tapping "Start" reads as committing to a process. With 73% of visitors
// leaving inside 10 seconds, removing that one moment of commitment is
// worth more than any copy change on the button itself.
// "He", not "they". Singular "they" is perfectly normal English for this
// audience, so it wasn't wrong - but it was answering the wrong question.
// Search demand is overwhelmingly gendered ("does HE like me", "why did HE
// stop texting"), which means an ad matching that query and then landing
// someone on a quiz asking about "them" breaks message match at the exact
// moment of arrival. It also reads a shade more clinical, which is the
// wrong register for a product about how someone feels at 1am.
//
// The cost - people whose person isn't a "he" - is largely covered by the
// optional name field on the screenshot step: once a name is given, the
// report uses it instead of any pronoun at all.
export const QUIZ_STEP_ONE: QuizStep = {
  key: "situation",
  question: "What's going on with him?",
  options: [
    "He went quiet on me",
    "Hot and cold",
    "He never makes plans",
    "I can't read him",
    SITUATION_OTHER,
  ],
};

// Shown on /quiz only when SITUATION_OTHER was picked, replacing the
// canned answer with her own words. Not part of the step count - it
// substitutes for question 1 rather than adding to it.
export const SITUATION_DETAIL_STEP: QuizStep = {
  key: "situation",
  question: "Tell me what's going on",
  placeholder: "One line is enough - what's actually bothering you?",
};

export const QUIZ_STEPS_REST: QuizStep[] = [
  {
    key: "relationship",
    question: "Who is he to you?",
    options: ["A crush", "Talking stage", "We're dating", "My ex"],
  },
  {
    key: "duration",
    question: "How long has this been going on?",
    options: ["Less than a week", "1-4 weeks", "1-6 months", "Over 6 months"],
  },
  {
    key: "whoTextsFirst",
    question: "Who texts first?",
    options: ["Almost always me", "Pretty even", "Usually him"],
  },
  {
    key: "replySpeed",
    question: "How fast does he reply?",
    options: ["Within minutes", "A few hours", "Sometimes a full day", "Never know what to expect"],
  },
  {
    key: "frustration",
    question: "What bugs you most right now?",
    placeholder: "Optional - one line, in your own words",
    optional: true,
  },
];

export const TOTAL_QUIZ_STEPS = 1 + QUIZ_STEPS_REST.length;

const DRAFT_KEY = "vc_quiz_draft";

// Answers are kept in localStorage rather than in a DB column on purpose.
// Persisting them server-side would mean a migration plus a hand-patch of
// the generated Supabase types (AGENTS.md note 4) for data we only need
// long enough to build one prompt. The tradeoff: a preliminary report
// opened on a different device can't be upgraded with screenshots there.
// That's acceptable - the upgrade path targets the same person on the same
// phone, minutes later.
export function saveQuizDraft(answers: Partial<QuizAnswers>): void {
  if (typeof window === "undefined") return;
  try {
    const merged = { ...readQuizDraft(), ...answers };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(merged));
  } catch {
    // Private mode / storage disabled. The quiz still works in-memory for
    // this session; only cross-page persistence is lost, so failing here
    // must never be fatal.
  }
}

export function readQuizDraft(): Partial<QuizAnswers> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<QuizAnswers>) : {};
  } catch {
    return {};
  }
}

export function clearQuizDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

// Kept per-analysis so "add screenshots and sharpen this" can re-send the
// original answers alongside the images, instead of forcing the user back
// through the quiz a second time.
export function rememberQuizForAnalysis(id: string, answers: QuizAnswers): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`vc_quiz_${id}`, JSON.stringify(answers));
  } catch {
    // ignore
  }
}

export function readQuizForAnalysis(id: string): QuizAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`vc_quiz_${id}`);
    return raw ? (JSON.parse(raw) as QuizAnswers) : null;
  } catch {
    return null;
  }
}

// A run is only valid once every non-optional step has an answer. Guards
// against someone deep-linking to a later step or to the screenshot screen
// with a half-filled draft.
export function isQuizComplete(a: Partial<QuizAnswers>): a is QuizAnswers {
  return Boolean(a.situation && a.relationship && a.duration && a.whoTextsFirst && a.replySpeed);
}
