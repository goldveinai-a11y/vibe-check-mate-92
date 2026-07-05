## VibeCheck — финальный план

Mobile-first веб-приложение. Юзер грузит 3–5 скринов переписки → Claude Sonnet 4.5 (Anthropic API напрямую) возвращает строгий JSON → `/results/:id` показывает free-превью → paywall с 3 тарифами → после оплаты полный отчёт на `/report/:id`. Доступ по UUID-ссылке, без обязательной регистрации. Email опционально на success-экране для восстановления доступа.

## Что делаем по-другому, чем советует Gemini (важно)

Gemini предложил Supabase Edge Functions. **Мы их не используем** — наш стек TanStack Start, у него есть свой серверный runtime (`createServerFn` + server routes). Это официальный best practice для этого шаблона: быстрее, типобезопасно, без отдельного деплоя. Supabase остаётся для DB/Storage/Auth. Framer Motion для wow-переходов — ок, беру.

## Тарифы (3, ровно как на референсе Bubble)

| Tier | Что платит юзер | Что дальше | Stripe |
|---|---|---|---|
| **Single Report** | $4.99 one-time | Разовый полный отчёт по этому чату, без подписки, без будущего доступа | Checkout `mode: payment` |
| **Premium Monthly** (MOST POPULAR) | $4.99 сразу | Этот отчёт открывается сразу + **бесплатный 3-дневный триал** (весь продукт: unlimited chat uploads). Через 3 дня автосписание **$9.99/мес**, cancel anytime | Checkout `mode: subscription` с `trial_period_days: 3` + `add_invoice_items` на $4.99 (одноразовый item за отчёт при старте) |
| **Premium Yearly** | $49.99/год ($4.17/mo billed annually) | Полный доступ на 12 месяцев, best value | Checkout `mode: subscription`, годовая цена |

Все три открывают текущий `/report/:id` мгновенно после checkout. Monthly/Yearly дополнительно ставят `subscription_active=true` для `owner_anon_id` → unlimited новые анализы.

## Дизайн / шрифты

Раз "не знаю" — беру **Instrument Serif** (заголовки, цены — по референсу Bubble) + **Inter** (body). Если после первого экрана захочешь другое — легко поменяем через один токен в `styles.css`.

Палитра: cream `#FFF8F5` фон, primary pink `#F4A6B8`, deep purple accent, text `#1A1A1A`, green бейдж `$4.17/mo billed annually`. Rounded-3xl карточки, pill-кнопки, эмодзи-иконки в розовых кружках. "Premium Monthly" — активный розовый бордер + бейдж MOST POPULAR. Всё через `@theme` в `src/styles.css`. Разработка на mobile viewport.

## Роуты (TanStack Start)

```
src/routes/
  __root.tsx              — шрифты, глобальные meta
  index.tsx               — landing
  upload.tsx              — dropzone 3–5 скринов
  analyzing.$id.tsx       — loader-экран с polling
  results.$id.tsx         — free-превью (scores + 1 green + 1 red)
  paywall.$id.tsx         — 3 тарифа
  report.$id.tsx          — полный отчёт (gated)
  success.tsx / cancel.tsx
  api/public/stripe-webhook.ts
```

## Backend (Lovable Cloud = Supabase под капотом)

**Таблицы:**
- `analyses`: `id uuid pk`, `created_at`, `status` (`pending|processing|ready|failed`), `report_json jsonb`, `preview_json jsonb`, `paid boolean default false`, `plan text` (`single|monthly|yearly` nullable), `stripe_session_id`, `stripe_subscription_id nullable`, `email nullable`, `owner_anon_id text`
- `subscriptions`: `id`, `owner_anon_id`, `email`, `plan`, `status` (`trialing|active|canceled|past_due`), `current_period_end`, `stripe_subscription_id`

Публичные `TO anon` SELECT/INSERT политики на `analyses` (доступ по знанию UUID). `report_json` отдаётся только когда `paid=true` ИЛИ у `owner_anon_id` активная подписка — проверка в server function, не через голую RLS.

**Storage bucket** `screenshots` (private), auto-purge 24ч.

**Server functions (`createServerFn`):**
- `getUploadUrl()` — signed upload URL в bucket
- `createAnalysis({ imagePaths[], ownerAnonId })` — INSERT + вызов Claude, возвращает `{ id }`
- `getAnalysisPreview({ id })` — публичный, только scores + 1 green + 1 red
- `getAnalysisFull({ id, ownerAnonId })` — полный `report_json`, gated
- `createCheckoutSession({ id, plan })` — соответствующий Stripe mode

**Server routes:**
- `POST /api/public/stripe-webhook` — verified signature, обрабатывает `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

## Claude Sonnet 4.5

Прямой POST `https://api.anthropic.com/v1/messages`, model `claude-sonnet-4-5`. Картинки как base64 `image` content blocks. System prompt = tone-of-voice (Gen Z/Millennials 20–40 US/UK, brutally honest smart-friend, modern internet-speak, verbatim quotes) + полная JSON schema (interest_score, emotional_investment_score, response_consistency, flirting_signals, toxicity_score, conversation_health, hardcore_analytics, psychological_analysis, green_flags[], red_flags[], future_outlook). Zod-валидация ответа, 1 retry при parse-error.

**Секреты:** `ANTHROPIC_API_KEY` (запрошу через `add_secret`). Stripe — через `enable_stripe_payments` (встроенный, без своего аккаунта).

## Экраны

1. **Landing** — сериф-хедер, CTA, соц-пруф
2. **Upload** — dropzone 3–5, previews, "auto-delete in 24h", CTA "Reveal the Vibe 🔮"
3. **Analyzing** — Framer Motion пульсация + rotating статусы
4. **Results (free)** — 6 score-баров, 1 green + 1 red с цитатой, blurred блок, CTA "Unlock Full Report"
5. **Paywall** — секция "What's inside your full report" + 3 тарифные карточки, Monthly выделена
6. **Report** — все секции схемы с Framer Motion stagger-появлением
7. **Success** — редирект `/report/:id` + опциональный email для восстановления доступа

## Порядок работ

1. `supabase--enable` → migration: `analyses`, `subscriptions`, bucket, RLS/grants
2. `add_secret ANTHROPIC_API_KEY`
3. `enable_stripe_payments` → 3 продукта в Stripe (Single one-time / Monthly с 3d trial + $4.99 upfront / Yearly)
4. Design tokens в `styles.css` + шрифты через `<link>` в `__root.tsx`
5. Landing + Upload
6. Server fns: upload, createAnalysis (Claude), preview/full getters
7. Analyzing + Results с Framer Motion
8. Paywall + Stripe Checkout + webhook
9. Report с полной схемой и анимациями
10. E2E проверка Playwright на mobile viewport

Стартую сразу как подтвердишь.
