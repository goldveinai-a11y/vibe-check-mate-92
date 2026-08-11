// The quiz funnel proper.
//
// The six-question version was an intake wearing a quiz costume: enough to
// build a prompt, nowhere near enough to make anyone feel diagnosed. This
// is the web-to-paywall structure the category actually runs on — sixteen
// questions, three educational beats, an archetype, and the offer attached
// to the archetype rather than bolted on after it.
//
// Sequencing follows the commitment ladder: the first three questions take
// under ten seconds and ask nothing personal. The questions that reveal how
// bad it has got, and the two that qualify intent, sit at the end — after
// sixty seconds of investment, people answer them honestly instead of
// leaving.

export type Choice = { value: string; label: string; weight?: Partial<Record<Archetype, number>> };

export type FunnelQuestion = {
  id: string;
  question: string;
  subtitle?: string;
  choices: Choice[];
  multi?: boolean;
};

export type Interstitial = {
  id: string;
  after: string;
  eyebrow: string;
  headline: string;
  body: string;
};

export type Archetype =
  | "erased"
  | "schedule"
  | "oneway"
  | "careful"
  | "loop";

export const ARCHETYPES: Record<Archetype, {
  name: string;
  tagline: string;
  mechanism: string;
  cost: string;
  prediction: string;
}> = {
  erased: {
    name: "The Erased Conflict",
    tagline: "Nothing you raise survives the night.",
    mechanism:
      "You bring something up, the subject moves from what he did to how you said it, and by morning it never happened. The argument is not lost — it is replaced.",
    cost:
      "The list of things you are willing to raise is getting shorter, and you are the only person who can see that list.",
    prediction:
      "In the next 10 days you will drop something rather than raise it. Notice which one.",
  },
  schedule: {
    name: "Warmth On A Schedule",
    tagline: "He is not cold. He is warm at times that have nothing to do with you.",
    mechanism:
      "Closeness goes up, then he withdraws — not after a fight, after a good night. That timing is the signal. It makes the good parts feel earned and the quiet feel like your fault.",
    cost:
      "You have started managing your own enthusiasm downward so it does not scare anything off.",
    prediction:
      "In the next 10 days the withdrawal will follow the closest moment, within about 72 hours of it.",
  },
  oneway: {
    name: "The One-Way Thread",
    tagline: "You are running this relationship, and he is attending it.",
    mechanism:
      "You open it, you repair it, you carry it. Effort that is never missed is never learned — he has no reason to start, because nothing has ever gone wrong when he did not.",
    cost:
      "You cannot tell whether he wants this, because he has never had to show you.",
    prediction:
      "If you stop restarting it, the gap runs longer than you expect. That gap is the answer.",
  },
  careful: {
    name: "The Careful Room",
    tagline: "You run a model of his mood before you open your mouth.",
    mechanism:
      "This is not a communication problem. You are choosing words for safety, not for kindness — and the exhausting part is not the arguments, it is the work you do so there are none.",
    cost:
      "The rules are doing the work. Whether they stay still or keep moving decides what you are actually in.",
    prediction:
      "In the next 10 days you will rehearse a message before sending it. Count how many you draft and never send.",
  },
  loop: {
    name: "The Checking Loop",
    tagline: "The question is not whether he is wrong. It is why the answer never sticks.",
    mechanism:
      "You get reassurance, it holds for an hour, then the doubt is back needing more. That pattern is about the checking, not about him — and more evidence makes it worse, not better.",
    cost:
      "Every answer you collect buys less time than the one before it.",
    prediction:
      "In the next 10 days you will re-read the same messages looking for something new in them.",
  },
};

// Sixteen questions. The first three are the cheap ones.
export const FUNNEL_QUESTIONS: FunnelQuestion[] = [
  {
    id: "situation",
    question: "What's going on with him?",
    choices: [
      { value: "apologising", label: "I end up apologising every time", weight: { erased: 3 } },
      { value: "hotcold", label: "Hot and cold, constantly", weight: { schedule: 3 } },
      { value: "eggshells", label: "I walk on eggshells around him", weight: { careful: 3 } },
      { value: "quiet", label: "He went quiet on me", weight: { oneway: 2, schedule: 1 } },
      { value: "cantstop", label: "I can't stop analysing it", weight: { loop: 3 } },
    ],
  },
  {
    id: "who",
    question: "Who is he to you?",
    choices: [
      { value: "crush", label: "A crush" },
      { value: "talking", label: "Talking stage" },
      { value: "dating", label: "We're dating" },
      { value: "partner", label: "Long-term partner" },
      { value: "ex", label: "My ex" },
    ],
  },
  {
    id: "duration",
    question: "How long has it felt like this?",
    choices: [
      { value: "weeks", label: "A few weeks" },
      { value: "months", label: "A few months" },
      { value: "year", label: "About a year" },
      { value: "years", label: "Years" },
    ],
  },
  {
    id: "raise",
    question: "When you bring something up, how does it usually end?",
    subtitle: "The last three times, not the best time.",
    choices: [
      { value: "sorry", label: "With me apologising", weight: { erased: 3 } },
      { value: "gone", label: "He shuts down and it's dropped", weight: { careful: 2, oneway: 1 } },
      { value: "reversed", label: "Somehow it becomes about my reaction", weight: { erased: 3 } },
      { value: "fine", label: "We actually sort it out", weight: { loop: 2 } },
    ],
  },
  {
    id: "initiates",
    question: "Who starts the conversation?",
    choices: [
      { value: "me", label: "Almost always me", weight: { oneway: 3 } },
      { value: "even", label: "Pretty even" },
      { value: "him", label: "Usually him", weight: { schedule: 1 } },
    ],
  },
  {
    id: "speed",
    question: "How fast does he reply?",
    choices: [
      { value: "minutes", label: "Within minutes" },
      { value: "hours", label: "A few hours" },
      { value: "day", label: "Sometimes a full day", weight: { oneway: 1 } },
      { value: "unknown", label: "Never know what to expect", weight: { schedule: 3 } },
    ],
  },
  {
    id: "repair",
    question: "After a bad exchange, who speaks first?",
    subtitle: "Count the last five.",
    choices: [
      { value: "always-me", label: "Me, every time", weight: { oneway: 3, erased: 1 } },
      { value: "mostly-me", label: "Mostly me", weight: { oneway: 2 } },
      { value: "shared", label: "It varies" },
      { value: "him", label: "Usually him" },
    ],
  },
  {
    id: "unsaid",
    question: "Is there anything you've stopped bringing up?",
    choices: [
      { value: "list", label: "There's a whole list", weight: { careful: 3, erased: 2 } },
      { value: "one", label: "One or two things", weight: { careful: 1 } },
      { value: "no", label: "No, I say what I think" },
    ],
  },
  {
    id: "return",
    question: "When he comes back after going quiet, what happens?",
    choices: [
      { value: "nothing", label: "Acts like nothing happened", weight: { erased: 2, schedule: 2 } },
      { value: "warm", label: "He's suddenly very warm", weight: { schedule: 3 } },
      { value: "acknowledges", label: "He acknowledges the gap" },
      { value: "na", label: "He doesn't go quiet" },
    ],
  },
  {
    id: "after",
    question: "The hour after you talk to him, how do you usually feel?",
    choices: [
      { value: "settled", label: "Settled" },
      { value: "relieved", label: "Relieved it went okay", weight: { careful: 3 } },
      { value: "spinning", label: "Re-reading it in my head", weight: { loop: 3 } },
      { value: "flat", label: "Flat, like something's missing", weight: { oneway: 2 } },
    ],
  },
  {
    id: "others",
    question: "Has anyone close to you said something about him?",
    subtitle: "Not what you told them. What they said unprompted.",
    choices: [
      { value: "several", label: "More than one person has", weight: { careful: 2, erased: 2 } },
      { value: "one", label: "One person, once", weight: { careful: 1 } },
      { value: "nobody", label: "Nobody has" },
      { value: "hide", label: "I don't tell them much any more", weight: { careful: 3 } },
    ],
  },
  {
    id: "quiet-thought",
    question: "He goes quiet for a few hours. First thought?",
    choices: [
      { value: "busy", label: "He's busy" },
      { value: "wrong", label: "What did I do", weight: { careful: 3, loop: 1 } },
      { value: "again", label: "Here we go again", weight: { schedule: 2 } },
      { value: "check", label: "I go and check something", weight: { loop: 3 } },
    ],
  },
  {
    id: "checking",
    question: "How often do you check his last seen, or re-read old messages?",
    choices: [
      { value: "never", label: "Basically never" },
      { value: "sometimes", label: "Sometimes" },
      { value: "daily", label: "Most days", weight: { loop: 2 } },
      { value: "cant", label: "More than I want to admit", weight: { loop: 3 } },
    ],
  },
  {
    id: "stop",
    question: "If you stopped texting first for two weeks, what happens?",
    subtitle: "Your honest guess.",
    choices: [
      { value: "reaches", label: "He'd reach out" },
      { value: "eventually", label: "Eventually, maybe", weight: { oneway: 1 } },
      { value: "silence", label: "Nothing. Silence.", weight: { oneway: 3 } },
      { value: "scared", label: "I'm not willing to find out", weight: { careful: 2, loop: 2 } },
    ],
  },
  {
    id: "howlong",
    question: "How long have you been trying to work this out?",
    choices: [
      { value: "days", label: "Days" },
      { value: "weeks", label: "Weeks" },
      { value: "months", label: "Months" },
      { value: "longer", label: "Longer than I'd like to say" },
    ],
  },
  {
    id: "ifknew",
    question: "If you knew for certain what this is, what would you do?",
    choices: [
      { value: "act", label: "Act on it this week" },
      { value: "talk", label: "Finally have the conversation" },
      { value: "stop", label: "Stop torturing myself either way" },
      { value: "unsure", label: "Honestly, I don't know yet" },
    ],
  },
];

// Three beats where the quiz gives something back instead of only taking.
export const INTERSTITIALS: Interstitial[] = [
  {
    id: "int1",
    after: "duration",
    eyebrow: "One thing before we go on",
    headline: "Most people bring this in as a communication problem.",
    body:
      "It usually isn't one. Communication problems get better when both people try. What you are describing tends not to — and that difference is what the next few questions are for.",
  },
  {
    id: "int2",
    after: "unsaid",
    eyebrow: "Halfway",
    headline: "The list of things you stopped saying is the real measure.",
    body:
      "Not the arguments. Arguments are visible and they end. The topics that quietly left the room are invisible, they do not come back on their own, and almost nobody counts them.",
  },
  {
    id: "int3",
    after: "stop",
    eyebrow: "Nearly there",
    headline: "Two questions left, and they're the ones that decide the read.",
    body:
      "How long this has been running, and what you would actually do with a straight answer. Both change what is worth telling you — a read for someone deciding this week is a different read from one for someone still gathering.",
  },
];

export function scoreArchetype(answers: Record<string, string>): Archetype {
  const totals: Record<Archetype, number> = { erased: 0, schedule: 0, oneway: 0, careful: 0, loop: 0 };
  for (const q of FUNNEL_QUESTIONS) {
    const picked = answers[q.id];
    const choice = q.choices.find((c) => c.value === picked);
    if (!choice?.weight) continue;
    for (const [k, v] of Object.entries(choice.weight)) {
      totals[k as Archetype] += v ?? 0;
    }
  }
  return (Object.keys(totals) as Archetype[]).reduce((a, b) => (totals[b] > totals[a] ? b : a), "oneway");
}

export function archetypeScores(answers: Record<string, string>) {
  const a = scoreArchetype(answers);
  const said = Object.keys(answers).length;
  const depth = Math.min(100, 40 + said * 3);
  return { archetype: a, confidence: depth };
}
