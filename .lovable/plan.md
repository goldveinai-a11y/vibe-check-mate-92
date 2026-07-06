# Viral Enrichment Plan

Turn VibeCheck from an "analytical report" into a screenshot-worthy meme machine. Every new block is designed to be either **quoted in a tweet**, **shown to a friend in DMs**, or **posted to IG Stories**.

## 1. New JSON schema fields (extend `ReportSchema`)

Add to `src/lib/vibecheck-schema.ts`:

```text
viral: {
  vibe_award: {
    title: string             // e.g. "Certified Breadcrumb Recipient"
    subtitle: string          // one witty line explaining the title
  }
  pop_culture_match: {
    couple: string            // e.g. "Ross & Rachel (post-break era)"
    source: string            // "Friends" | "Euphoria" | ...
    explanation: string       // 1–2 sentences why
  }
  their_type_in_3_words: [string, string, string]
  viral_keywords: [           // 3–5 items
    { word: string, type: "red_flag" | "green_flag" | "beige_flag",
      impact: string }        // short punchy line
  ]
  vibe_decay: {
    trajectory: "rising" | "steady" | "cooling" | "nose-diving"
    weekly_delta_pct: number  // e.g. -8 means -8% interest/week
    range: string             // e.g. "2–4 weeks"
    verdict: string           // one-liner, no exact-day promises
  }
}
```

Prompt updates (`vibecheck.server.ts`):
- Add a `VIRAL BLOCK` section demanding all above fields.
- Pop-culture references limited to a curated US/UK Gen Z + Millennial pool (Euphoria, Normal People, Fleabag, Bridgerton, Friends, SATC, After, Heartstopper, The Summer I Turned Pretty, Sally Rooney adaptations, You, White Lotus).
- Award title must be a *badge-style noun phrase*, not a sentence.
- Decay: forbid exact day counts. Require a range + weekly % + trajectory keyword.
- Keywords: must be verbatim tokens from screenshots; skip if <3 clean examples.

Update `buildPreview` to expose:
- `vibe_award` (full)
- `pop_culture_match` (full)
- `viral_keywords[0]` only, rest count teased ("+4 more words that killed the vibe")
- Keep existing score preview + one full green flag + blurred red flag
- Hide: `their_type_in_3_words`, `vibe_decay`, remaining keywords, all hardcore/psych blocks

## 2. Preview redesign (`src/routes/results.$id.tsx`)

New hero order (top → bottom), each a distinct visual card:

1. **Vibe Award badge** — big medal/ribbon graphic, serif title, one-line subtitle. This is the first thing the user sees.
2. **Pop-Culture Match card** — "You're giving: **Ross & Rachel (post-break)**" with a short blurb. Styled like a movie poster tag.
3. **7-metric scoreboard** (existing, keep).
4. **"The receipt"** — initiative_stat (existing).
5. **1 Viral Keyword card** — "The word that's killing you: **'ok'**" + impact line + "+4 more words locked in the full report".
6. **1 green flag full + 1 red flag blurred** (existing pattern).
7. Unlock CTA.

All new cards must be visually distinct (different bg tokens from `styles.css`: `bg-pink-soft`, `bg-mint-soft`, `bg-purple-soft`) and screenshot-ready — every card needs a small "VibeCheck" wordmark in a corner so screenshots stay branded.

## 3. Full report additions (`src/routes/report.$id.tsx`)

Insert BEFORE the existing "Compatibility Breakdown" section:

- **Their Type in 3 Words** — 3 large chip words, huge serif, centered. Very shareable.
- **Vibe Decay Trajectory** — animated arrow (trajectory icon), "-8% interest/week" big number, range "2–4 weeks until it fizzles" as subtitle, verdict as body.
- **Viral Keywords** — full list: each keyword as a chip with color (red/green/beige) + impact line.
- Keep existing sections (hardcore analytics, psych, flags, outlook) but move `pop_culture_match` and `vibe_award` also to the top of the paid report for consistency.

## 4. Shareable Story Card (9:16)

New component `src/components/ShareCard.tsx` + button "Share to Stories" on both preview and full report:
- Renders a 1080×1920 card in a hidden div using existing tokens: gradient bg, Vibe Award badge, overall score (average of the 7), Pop-Culture Match line, VibeCheck logo/URL.
- Uses `html-to-image` (or `dom-to-image-more`) to export PNG → triggers native share sheet on mobile (`navigator.share` with file), fallback download on desktop.
- Requires `bun add html-to-image`.

## 5. Non-goals (untouched this turn)

- Payment / Stripe / webhook logic
- Supabase schema (JSON blob absorbs all new fields, no migration needed)
- Analyzing overlay
- Auth, RLS

## Technical details

- All new fields optional in Zod at first (`.optional()`) so old analyses in DB don't 500. Preview/report UI guards with `report.viral?.…`.
- `buildPreview` re-derives from full report at read time (already the pattern), so re-runs on existing rows work.
- Model stays `claude-sonnet-4-5`, `temperature: 0`. Prompt gets ~600 extra tokens; well within limits.
- Story card export: lazy-load `html-to-image` only when Share is clicked to avoid bundle bloat.

## Deliverable order when built

1. Schema + prompt (backend truth first)
2. Preview UI
3. Full report UI
4. ShareCard component + button wiring
5. Manual test with a real re-run to verify JSON validates and renders

Approve to build, or tell me what to cut/add.
