# Visual restoration of VibeCheck (Bubble → Lovable)

Goal: rebuild all Bubble pages 1:1 in look, copy, fonts, colors, and layout. Keep every existing backend piece (Claude, Supabase, Stripe, webhooks, server functions) untouched. Fully responsive (mobile-first, 320px → 1920+).

## Pages (matches Bubble App Manager)

Bubble Web Pages: index, upload, analyzing, results, paywall, full-report, reset_pw, 404
Bubble Web Reusables: header

Lovable route mapping:

1. `/` — index (landing)
2. `/upload` — upload
3. `/analyzing/$id` — analyzing (loading / progress state between upload and results) — **new route to add**
4. `/results/$id` — results (free preview)
5. `/paywall/$id` — paywall (pricing tiers)
6. `/report/$id` — full-report (unlocked paid report)
7. `/reset-password` — reset_pw (password reset) — **new route to add**
8. `/checkout/return` — Stripe return (kept, styled to match)
9. 404 not-found (root `notFoundComponent`)
10. Error boundary (`defaultErrorComponent`)

Shared: `SiteHeader` component (mirrors Bubble "header" reusable) + shared footer if present.

## Design system

- Cream `#FBF7F2` bg, pink primary `#EFA4B8`, lavender accent `#E7DEFB`, success green.
- Fonts via `<link>` in `__root.tsx`: "DM Serif Display" (headers) + "DM Sans" (body).
- Tokens in `src/styles.css` under `@theme inline`, no hardcoded colors in components.

## Responsive rules

- Breakpoints: `sm 640 / md 768 / lg 1024 / xl 1280`.
- Container: `max-w-[420px]` mobile → `max-w-6xl` desktop.
- Header: hamburger `Sheet` on mobile, inline nav on `md+`.
- Rows with text + widget: `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0`.
- Tap targets ≥44px. Paywall: 1-col mobile, 2-col `lg+`.

## Per-page structure

- **Landing (`/`)**: purple pill → serif "Is it a match…" → pink CTA pill → lock privacy line → "How VibeCheck works" (3 cards) → "The Science of Every Conversation" (5 emoji cards) → Privacy block → final CTA.
- **Upload (`/upload`)**: purple "Step 2 of 3" → serif title → dashed drop-zone → previews → privacy block → "Analyze the vibe" CTA (wired to existing upload logic; navigates to `/analyzing/$id`).
- **Analyzing (`/analyzing/$id`)**: centered card with animated progress / status text ("Reading the vibe…"), auto-redirects to `/results/$id` when analysis completes (polls existing server fn).
- **Results (`/results/$id`)**: green "Analysis Complete" → vibe circle card → "Unlock the Full Story" 4 locked cards → "Unlock Full Report" CTA → `/paywall/$id`.
- **Paywall (`/paywall/$id`)**: 2-col — left 4 feature cards, right 3 tiers (Single $4.99, Premium Monthly $4.99 "MOST POPULAR", Premium Yearly $49.99 "billed annually"). Uses existing `VibeCheckout`.
- **Full report (`/report/$id`)**: unlocked report — same visual language as results, all sections revealed.
- **Reset password (`/reset-password`)**: cream card with serif heading, email field, pink submit button — wired to existing Supabase auth reset flow.
- **Checkout return (`/checkout/return`)**: logo + spinner + "Finalizing your report…".
- **404 / Error**: cream shell, serif heading, pink CTA back to `/`.

## Files touched (frontend only)

- `src/styles.css`
- `src/routes/__root.tsx` (fonts, meta, header, `notFoundComponent`)
- `src/router.tsx` (`defaultErrorComponent` if missing)
- `src/components/SiteHeader.tsx` (new)
- `src/routes/index.tsx`
- `src/routes/upload.tsx`
- `src/routes/analyzing.$id.tsx` (new)
- `src/routes/results.$id.tsx`
- `src/routes/paywall.$id.tsx`
- `src/routes/report.$id.tsx`
- `src/routes/reset-password.tsx` (new)
- `src/routes/checkout.return.tsx`

## Untouched (backend/logic)

- `src/lib/vibecheck.functions.ts`, `vibecheck.server.ts`, `vibecheck-schema.ts`
- `src/lib/stripe.ts`, `stripe.server.ts`, `anon-id.ts`
- `src/components/VibeCheckout.tsx`, `PaymentTestModeBanner.tsx`
- `src/routes/api/public/payments/webhook.ts`
- Supabase integration files, `.env`

## Verification

Playwright screenshots of every page at 375 / 768 / 1280 widths, compared against the Bubble originals.
