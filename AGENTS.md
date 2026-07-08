<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project notes for agents (persistent — read before making changes)

### Voice & copy rules

1. **One fact, one formulation.** Recurring facts (e.g. "screenshots are never
   stored") get exactly one canonical phrasing, owned by whichever surface is
   closest to the user's decision point — footer for the legal/reflection
   framing, upload/paywall/report surfaces for privacy-at-the-moment-of-upload.
   Before writing new copy that repeats an existing fact, grep the codebase
   for the existing phrasing first. Don't add a new variant — reuse or trim.

2. **"Receipts" is the house slang** for screenshots / evidence / no-storage
   claims. Already used in `AnalyzingOverlay` quips, `ShareCard` footer,
   red/green flag copy (`results.$id.tsx`), and the paywall privacy line. New
   copy touching "screenshots not stored" should reach for "receipts" by
   default rather than "AI-generated" / "encrypted" / "processed" corporate
   synonyms — those are reserved for `SiteFooter.tsx`'s literal disclaimer,
   where legal precision matters more than tone.

### Engineering gotchas

3. **Referral/incentive mechanics without a live payment-processor API
   session** (no way to call Stripe's API directly from this environment) →
   ship a give-only V1: the referred friend gets the discount via one shared,
   manually-created coupon code. Explicitly scope OUT auto-generated
   per-referrer reward codes as V2 — don't half-build the reward-back loop
   just because the DB schema makes it look easy. It needs live Stripe API
   access to safely generate and track unique codes per referrer.

4. **New Supabase table ≠ automatically usable from the app**, even after the
   SQL migration is applied. `src/integrations/supabase/types.ts` must be
   manually patched with a matching `Row`/`Insert`/`Update`/`Relationships`
   block (mirror an existing table's shape, e.g. `report_checkins`) or every
   function touching the new table throws confusing `SelectQueryError` /
   `argument of type 'x' is not assignable to parameter of type ...` TS
   errors that look like a schema bug rather than a missing type stub.
