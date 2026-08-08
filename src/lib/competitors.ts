// Data for the /vs/$slug comparison pages.
//
// One page per competitor, driven from this array - adding the next one is
// a block of copy here, not a new route file. The pages exist to catch
// "<competitor> alternative" searches, which are the highest-intent
// queries in the category: someone typing that has already decided the
// other product isn't working for them.
//
// Every page includes an honest "when they're the better pick" section.
// That isn't politeness - a comparison page that claims total victory
// reads as marketing and converts badly, and Google has spent years
// getting better at demoting exactly that. Conceding the cases we
// genuinely lose is what makes the rest of the page believable.
//
// Rule for this file: only claims that can be checked. Their pricing and
// features change without warning, so nothing here states a price, and
// every characterisation is about product CATEGORY rather than quality.

export type Competitor = {
  slug: string;
  name: string;
  // One line under the H1 - what they are, stated fairly.
  summary: string;
  // The core positioning difference, in one sentence.
  difference: string;
  rows: Array<{ feature: string; us: string; them: string }>;
  // Cases where they genuinely are the better choice.
  betterForThem: string[];
  // Cases where this product is the better choice.
  betterForUs: string[];
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "rizz",
    name: "Rizz",
    summary:
      "Rizz is a reply generator. You show it a conversation and it writes you something smooth to send next.",
    difference:
      "Rizz helps you answer the message. VibeCheck tells you whether the conversation is worth answering.",
    rows: [
      {
        feature: "What you get",
        us: "A read on the dynamic: interest level, red flags, where this is heading",
        them: "Suggested replies to send next",
      },
      {
        feature: "The question it answers",
        us: "What is actually going on here?",
        them: "What do I say back?",
      },
      {
        feature: "Works without screenshots",
        us: "Yes - a short AI chat is enough for a full read",
        them: "No - it needs the conversation to reply to",
      },
      {
        feature: "Tells you when to walk away",
        us: "Yes, including when the honest answer is unwelcome",
        them: "Not its job - it optimises for continuing the conversation",
      },
      {
        feature: "Ready-to-send replies",
        us: "Two, written to match the read - warm or pulled back",
        them: "Yes, this is the core feature",
      },
      {
        feature: "Where it runs",
        us: "Browser, nothing to install",
        them: "Mobile app",
      },
    ],
    betterForThem: [
      "You already know where you stand and just want something better to send.",
      "You want help with openers on dating apps, at volume.",
      "You'd rather have a keyboard that lives on your phone than a one-off read.",
    ],
    betterForUs: [
      "You're not sure whether to keep investing in this person at all.",
      "You want the pattern named - breadcrumbing, avoidant, one-sided - not a smoother next line.",
      "You want an answer even when you can't or don't want to upload screenshots.",
      "You'd rather be told the uncomfortable thing than be helped to keep going.",
    ],
  },
];

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
