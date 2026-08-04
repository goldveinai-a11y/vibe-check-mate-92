// Deterministic safety signals, computed in code before the model sees the turn.
//
// The intake prompt already handles safety thoughtfully, but every one of
// those judgements is made by Haiku at temperature 0.6. A model can be
// argued out of a judgement; a regex cannot. This file is not a replacement
// for the prompt — it is the backstop for the cases where being wrong is
// expensive enough that we should not leave it to inference alone.
//
// It currently covers exactly one case: the user is, or may be, under 18.
// That gap mattered most because the audience skews young, the landing page
// invites exactly the kind of disclosure a fifteen-year-old makes, and
// nothing anywhere in the product noticed.

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
// Checked first: a false positive here silently degrades the read for an
// adult, and an adult being handled as a minor is its own kind of failure.
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

// Appended to the intake system prompt when the flag is set. It overrides
// the rest of the prompt where they conflict.
export const MINOR_INSTRUCTION = `

## She may be under 18 — this section overrides everything above

Something in this conversation suggests she is a minor. Assume she is, and do not ask her to confirm it.

- Keep every reply age-appropriate. No sexual content of any kind. If she describes sexual pressure, say plainly that pressure is not consent, and route her onward — do not analyse it, do not ask for detail.
- Do not lower the safety bar because she is young. Raise it: reach safetyConcern sooner than you otherwise would, not later.
- Point her toward one adult she trusts — a parent, a teacher, a school counsellor, an older sibling, a coach. Do not choose for her and do not tell her to report anything.
- The right resource for this age group is loveisrespect: 1.866.331.9474, or text LOVEIS to 22522. Free, confidential, and built for teenagers specifically. Use it in place of a generic helpline.
- Never suggest that controlling, frightening or possessive behaviour is normal "at your age" or "when you're young". It is the same behaviour it would be at thirty.
- Everything else in this prompt still applies. She came for a straight answer and being sixteen does not make her owed a softer one — it makes her owed a safer one.
`;
