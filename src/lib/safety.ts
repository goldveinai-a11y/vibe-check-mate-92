// Deterministic safety signals, computed in code before the model sees the turn.
//
// The intake prompt already handles safety thoughtfully, but every one of
// those judgements is made by Haiku at temperature 0.6. A model can be
// argued out of a judgement; a regex cannot. This file is not a replacement
// for the prompt — it is the backstop for the cases where being wrong is
// expensive enough that we should not leave it to inference alone.

const MINOR_PATTERNS: RegExp[] = [
  /\b(i'?m|i am|im)\s*(only\s*)?1[0-7]\b/i,
  /\b1[0-7]\s*(years?\s*old|yrs?\s*old|y\/?o)\b/i,
  /\b(high\s*school|highschool|middle\s*school|secondary\s*school)\b/i,
  /\b(freshman|sophomore|junior|senior)\s*year\b/i,
  /\b(year|grade)\s*(8|9|10|11|12)\b/i,
  /\bmy\s*(teacher|homeroom|principal|form\s*tutor|school\s*counsell?or)\b/i,
  /\b(mom|mum|dad|parents?)\s*(won'?t let me|doesn'?t let me|grounded me|took my phone)\b/i,
  /\bmy\s*curfew\b/i,
  /\bschool\s*(dance|prom|bus|lunch|holidays)\b/i,
];

// Phrases that trip the patterns above without being the user's own age.
// Checked first: an adult handled as a minor is its own kind of failure.
const NOT_A_MINOR: RegExp[] = [
  /\b(he|she|they|my (son|daughter|sister|brother|cousin|niece|nephew|student))\s+(is|was)\s*1[0-7]\b/i,
  /\bback in (high\s*school|school)\b/i,
  /\bwhen i was (in )?(high\s*school|1[0-7])\b/i,
  /\b(i teach|i'?m a teacher|my students?|my kids?|my child)\b/i,
  /\b(since|after|before) (high\s*school|university|college)\b/i,
];

export function detectMinor(text: string): boolean {
  if (!text) return false;
  if (NOT_A_MINOR.some((r) => r.test(text))) return false;
  return MINOR_PATTERNS.some((r) => r.test(text));
}

// Sticky. Once there is reason to think she is under 18, nothing later in
// the transcript un-flags it — otherwise the flag is only as reliable as
// the last thing she happened to type.
export function minorFlagFor(previousTurns: string[], current: string): boolean {
  return [...previousTurns, current].some(detectMinor);
}

export const MINOR_INSTRUCTION = `

## She may be under 18 — this section overrides everything above

Something in this conversation suggests she is a minor. Assume she is, and do not ask her to confirm it.

- Keep every reply age-appropriate. No sexual content of any kind. If she describes sexual pressure, say plainly that pressure is not consent, and route her onward — do not analyse it, do not ask for detail.
- Do not lower the safety bar because she is young. Raise it: reach safetyConcern sooner than you otherwise would, not later.
- Point her toward one adult she trusts — a parent, a teacher, a school counsellor, an older sibling, a coach. Do not choose for her and do not tell her to report anything.
- The right resource for this age group is loveisrespect: 1.866.331.9474, or text LOVEIS to 22522. Free, confidential, and built for teenagers specifically. Use it in place of a generic helpline.
- Never suggest that controlling, frightening or possessive behaviour is normal "at your age" or "when you're young". It is the same behaviour it would be at thirty.
- Everything else in this prompt still applies. She came for a straight answer, and being sixteen does not make her owed a softer one — it makes her owed a safer one.
`;

export type Tier = "T0" | "T1" | "T2" | "T3";

const T1_PATTERNS: RegExp[] = [
  /\bwalk(ing)? on eggshells\b/i,
  /\bon eggshells\b/i,
  /\btiptoe(ing)? around\b/i,
  /\b(afraid|scared|nervous) to (disagree|say|bring (it|that) up|ask|tell him|speak up)\b/i,
  /\bi just go along\b/i,
  /\b(it'?s )?easier (to agree|not to say|not to bring)/i,
  /\bhe'?ll lose it\b/i,
  /\bsets? him off\b/i,
  /\bhis temper\b/i,
  /\bi apolog(ise|ize) (for everything|even when|when i haven'?t)/i,
  /\bnever know (which|what) (version|mood|him)/i,
  /\bbrace (myself|for)\b/i,
  /\bcareful how i (say|word|phrase)/i,
];

const T2_PATTERNS: RegExp[] = [
  /\b(checks?|goes? through|reads?|looks? through) my (phone|messages|dms|texts)\b/i,
  /\b(wants?|demands?|has) (all )?my passwords?\b/i,
  /\btracks? (me|my location)\b/i,
  /\b(has to|needs to) know where i am\b/i,
  /\bwon'?t let me (see|go|work|have|leave)\b/i,
  /\bdoesn'?t let me\b/i,
  /\b(hates|doesn'?t like) my (friends|family)\b/i,
  // Isolation as it is actually typed. The explicit forms above missed the
  // common one: she writes it as his reaction to her leaving the house, not
  // as a rule he states out loud.
  /\b(gets?|got) (really |so )?(mad|angry|upset|annoyed|weird) (when|if) i (see|hang out|go out|meet|spend time)/i,
  /\bdoesn'?t (want|like) me (to see|seeing|to hang|hanging|to go|going)/i,
  /\bmakes? me feel (guilty|bad) (about|for) (seeing|going|spending)/i,
  /\bcut me off from\b/i,
  /\bi stopped (seeing|going|talking to)\b/i,
  /\bcontrols? (the|our|my) money\b/i,
  /\bgives? me an allowance\b/i,
  /\bthreaten(s|ed)? to (post|share|send|leak)\b/i,
  /\bthreaten(s|ed)? to (hurt|kill) himself\b/i,
  /\bsays? he'?ll (hurt|kill) himself\b/i,
  /\bif i leave he'?ll\b/i,
];

const T3_PATTERNS: RegExp[] = [
  /\b(hit|hits|slapped|punched|kicked|shoved|pushed) me\b/i,
  /\b(choked|strangled) me\b/i,
  /\bhands? around my (neck|throat)\b/i,
  /\bthrew (something|it) at me\b/i,
  /\bthreaten(s|ed)? to (kill|hurt) me\b/i,
  /\b(scared|afraid|terrified) (he'?ll|he will|of him) hurt/i,
  /\bi'?m (not safe|in danger)\b/i,
  /\b(forced|pressured) me (in)?to (sex|sleep|send)/i,
  /\braped\b/i,
  /\b(kill myself|end it all|hurt myself|self.?harm)\b/i,
];

// Figures of speech that trip T3 without meaning it. This list is the ONLY
// thing that may make the model ask whether a disclosure was literal. It
// used to be a conditional paragraph inside the T3 instruction, and the
// model applied it to "he pushed me once but he was drunk" — asking a woman
// who has just said she was pushed whether she meant it literally reads as
// disbelief at the moment it costs most. The judgement now lives in code:
// no match here, no question.
const IDIOMS: RegExp[] = [
  /\bhe'?d kill me if\b/i,
  /\bi'?m dying\b/i,
  /\bkilled it\b/i,
  /\bshoot me\b/i,
  /\bdead to me\b/i,
];

const RANK: Record<Tier, number> = { T0: 0, T1: 1, T2: 2, T3: 3 };

export function detectTier(text: string): Tier {
  if (!text) return "T0";
  if (T3_PATTERNS.some((r) => r.test(text))) return "T3";
  if (T2_PATTERNS.some((r) => r.test(text))) return "T2";
  if (T1_PATTERNS.some((r) => r.test(text))) return "T1";
  return "T0";
}

export function looksIdiomatic(text: string): boolean {
  return IDIOMS.some((r) => r.test(text));
}

// Appended by the caller ONLY when looksIdiomatic() returns true.
export const T3_IDIOM_NOTE = `

Note: the phrase that raised this may be a figure of speech rather than a description of something that happened. Ask once, plainly — "I want to make sure I read that right — has that actually happened, or is it a turn of phrase?" — and route on her answer.
`;

// Sticky, for the same reason the minor flag is: the tier describes the
// relationship, not the sentence. Once she has said he checks her phone, a
// later turn about brunch does not put us back on T0.
export function sessionTier(previousTurns: string[], current: string): Tier {
  return [...previousTurns, current].reduce<Tier>((acc, t) => {
    const next = detectTier(t);
    return RANK[next] > RANK[acc] ? next : acc;
  }, "T0");
}

export const TIER_INSTRUCTIONS: Record<Tier, string> = {
  T0: "",

  T1: `

## Detected: a fear dynamic — this changes your next reply

She has described organising her own behaviour around avoiding his reaction. Treat it as a safety-of-expression problem, not a communication problem, and say so.

- Do NOT alarm her, do NOT mention abuse or helplines, do NOT tell her to leave. Nothing here should read as an intervention. Change the branch, not the temperature.
- Do NOT set safetyConcern for this alone. A fear dynamic is a reason to go deeper, not a reason to stop.
- The question that matters most is whether the rules are STABLE or MOVING. A predictable temper and rules that shift are different situations, and the second is the more serious one. Ask it, and tell her why you asked.
- Ask what he actually DOES when she gets it wrong. Behaviour, not mood.
- Do not name anything she is doing to maintain the dynamic. Adapting to a volatile person is a rational response, not a flaw, and saying otherwise here is both cruel and wrong.
`,

  T2: `

## Detected: markers of coercive control — name it once, without drama

Monitoring, isolation, control of money and threats are not separate quirks; they are one documented pattern. Say that plainly in one short paragraph. Do NOT say "you are being abused" — you do not have the whole picture and that sentence ends the conversation.

Then offer the route exactly once and let her choose: "There are people whose whole job is this specific situation — free, confidential, any hour. Want the number, or want to keep going first?"

- Do NOT set safetyConcern unless she also describes harm, a threat of harm, or fear for her own safety. This tier means keep going carefully. If you invite her to keep talking while the interface tells her you are finished, you have contradicted yourself on screen.
- NEVER advise leaving, staying, confronting, or issuing an ultimatum. Leaving is the most dangerous period and safety planning needs a trained advocate, not a chat product.
- Do NOT suggest collecting evidence, screenshotting or recording unless she raises it. If the device is monitored, that creates risk.
- If she mentioned him checking her phone, add one line: use a private window and clear this afterwards.
- Do not name anything she is doing to maintain the dynamic, for the rest of this conversation.
`,

  T3: `

## Detected: harm or a threat of it — stop the intake

Set safetyConcern=true and stop. No more questions, no analysis, no scores, no read.

Say you believe her, in one sentence, before anything else. Say this is past what a conversation-reader is for. Give her a helpline for her country — loveisrespect (1.866.331.9474, or text LOVEIS to 22522) in the US, the National Domestic Abuse Helpline (0808 2000 247) in the UK, Women's Aid (1800 341 900) in Ireland. Offer to stay and keep talking.

- Do NOT ask whether it really happened, whether she is sure, or whether she meant it literally. She told you. Treat it as true. If the wording is genuinely ambiguous, a separate note will be appended below telling you to check — and only then.
- Do NOT minimise it, and do NOT accept her minimising it for you. "Only once", "he was drunk", "he didn't mean it" are the most common framings and none of them change what you do here.
- Do NOT ask for detail about what happened. Do NOT ask why she stays. Do NOT tell her to leave or to stay. Do NOT make any prediction.
`,
};

const BANNED: Array<{ rule: string; re: RegExp }> = [
  { rule: "hedging (usually means / can be a sign)", re: /\b(usually means|often means|typically means|can be a sign|tends to mean|it might be that)\b/i },
  { rule: "empty sympathy", re: /\b(that sounds (really |so )?(hard|tough|difficult|painful)|i hear you|that must be exhausting)\b/i },
  { rule: "diagnosing him", re: /\bhe('s| is) (a )?(narcissist|sociopath|avoidant|toxic person|abuser)\b/i },
  { rule: "telling her what to do about the relationship", re: /\byou should (leave|break up|dump|end it)\b/i },
  { rule: "manipulation advice", re: /\b(go silent|ignore him so|make him (jealous|chase|miss you)|post a story)\b/i },
];

export function validateReply(reply: string): { ok: boolean; broken: string[] } {
  const broken = BANNED.filter((b) => b.re.test(reply)).map((b) => b.rule);
  return { ok: broken.length === 0, broken };
}

export function retryInstruction(broken: string[]): string {
  return `

## Your previous reply broke these rules and was discarded

` + broken.map((b) => "- " + b).join("\n") + `

Write the reply again. Same situation, same question if it was a good one, but without the violation. Do not apologise for the previous attempt or refer to it; she never saw it.
`;
}
