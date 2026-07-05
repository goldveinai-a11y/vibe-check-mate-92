## Цель
Доделать оплату целиком через managed Stripe от Lovable. Никаких ручных действий в Stripe Dashboard от вас не требуется — я создаю продукты, настраиваю Checkout, вебхуки уже подключены. Налоги: только `automatic_tax` (+0.5%), налоги подаёте сами. Ваш платный триал $4.99 → $9.99/мес реализуется штатным механизмом Stripe.

## Шаг 1. Создать 4 сущности в managed Stripe (`payments--batch_create_product`)

| product_id | price_id | Сумма | Тип | tax_code |
|---|---|---|---|---|
| `single_report` | `single_report_onetime` | $4.99 | one-time | `txcd_10000000` |
| `premium_monthly` | `premium_monthly` | $9.99 / month | recurring | `txcd_10000000` |
| `premium_monthly` | `premium_monthly_trial_fee` | $4.99 | one-time (upfront для trial) | `txcd_10000000` |
| `premium_yearly` | `premium_yearly` | $49.99 / year | recurring | `txcd_10000000` |

quantity_min/max = 1 везде.

## Шаг 2. Обновить `createCheckoutSession` в `src/lib/vibecheck.functions.ts`

Один server function, три ветки по `priceId`:

```ts
// single_report_onetime → mode: "payment", один line item
// premium_yearly → mode: "subscription", один line item, automatic_tax
// premium_monthly → mode: "subscription", line_items: [{price: premium_monthly}],
//   subscription_data: {
//     trial_period_days: 3,
//     metadata: { userId, vibecheck_id },
//     add_invoice_items: [{ price: premium_monthly_trial_fee }]  // ← списывает $4.99 сразу
//   }
```

Общее для всех:
- `ui_mode: "embedded_page"` (инлайн, без редиректа)
- `return_url: <origin>/checkout/return?session_id={CHECKOUT_SESSION_ID}&vibecheck_id=<id>`
- `automatic_tax: { enabled: true }` — вы платите +0.5%, налоги подаёте сами
- `customer_email` (если авторизован) + `metadata: { vibecheck_id, anon_id, tier }`
- try/catch с `getStripeErrorMessage` → возвращаем `{ error }`, клиент бросает `new Error(result.error)`
- Разрешение priceId через `stripe.prices.list({ lookup_keys: [priceId] })`
- Для one-time — `payment_intent_data.description = product.name` (чтобы в дашборде Lovable Payments показывалось нормальное имя)

## Шаг 3. Обновить `paywall.$id.tsx`

3 кнопки открывают `VibeCheckout` с разным `priceId`:
- Single Report → `single_report_onetime`
- Premium Monthly (Trial) → `premium_monthly` (тексты кнопки: "Start 3-day trial for $4.99, then $9.99/month")
- Premium Yearly → `premium_yearly`

Копия и вёрстка — как в восстановленном 2-column layout. Не меняю ничего визуально, только `priceId` в onClick.

## Шаг 4. Вебхук `src/routes/api/public/payments/webhook.ts`

Проверяю что уже обрабатывается (код есть):
- `checkout.session.completed` → для `mode: "payment"` (single report) → апдейт `vibechecks.is_paid = true`, `tier = 'single'` по `vibecheck_id` из metadata
- `customer.subscription.created` → для monthly/yearly → апсерт в `subscriptions`, апдейт `vibechecks.is_paid = true`, `tier = 'monthly'|'yearly'`
- `customer.subscription.updated` → синк статуса (trialing/active/past_due/canceled)
- `customer.subscription.deleted` → status = canceled
- `invoice.payment_failed` → лог, никаких блокировок (Stripe сам ретраит)

Если каких-то обработчиков нет — дописываю. Signing secret (`PAYMENTS_SANDBOX_WEBHOOK_SECRET`) уже настроен.

## Шаг 5. `PaymentTestModeBanner`

Проверить что рендерится в `__root.tsx` над контентом на всех страницах — в preview показывает "Test mode".

## Шаг 6. E2E проверка через Playwright

Прогон каждого из 3 сценариев в preview:

1. **Single Report ($4.99)**: `/` → `/upload` → загрузка → `/analyzing/$id` → `/results/$id` → `/paywall/$id` → Single → карта `4242 4242 4242 4242` 12/34 123 → `/checkout/return` → `/report/$id` разблокирован
2. **Monthly (trial $4.99 → $9.99)**: те же шаги → выбор Monthly → на checkout проверить что показывается "Total today: $4.99" + "Then $9.99/month starting <date+3>" → оплата → `/report/$id` разблокирован → в Supabase `subscriptions.status = 'trialing'`, `current_period_end` через 3 дня
3. **Yearly ($49.99)**: те же шаги → Yearly → $49.99 сразу → `/report/$id` разблокирован

На каждом шаге — скриншот. Проверка вебхука через Supabase read: `vibechecks.is_paid`, `subscriptions.*`.

## Шаг 7. Дашборд Stripe в Lovable

Проверить `<presentation-open-payments>` — там видно 3 продукта, тестовые транзакции появляются после E2E.

## Что не трогаем
- Весь визуал (лендинг, upload, results, paywall, report, checkout return, header, 404) — восстановлен ранее
- `src/lib/stripe.server.ts`, `src/components/VibeCheckout.tsx` (уже сделан правильно)
- Supabase-схема (таблицы `vibechecks`, `subscriptions`), RLS, миграции
- Ваши личные продукты в вашем Stripe sandbox (не трогаем и не используем)

## Go-live (когда решите публиковать)
При `publish` Lovable сам:
1. Пересоздаёт те же 4 сущности в live Stripe
2. Регистрирует live-вебхук на `?env=live`
3. Переключает `VITE_PAYMENTS_CLIENT_TOKEN` на `pk_live_*`

От вас — 0 действий в Stripe Dashboard.

## Риски / что важно знать
- **Триал как "оплаченный триал"**: $4.99 списывается сразу и **не возвращается** при отмене в первые 3 дня. Это стандартное поведение Stripe и то, чего вы хотели.
- **automatic_tax + чек-аут** покажет пользователю строку налога на основе адреса, если Stripe знает юрисдикцию. Для чисто-цифровых продуктов $4.99 налог часто $0, но в некоторых штатах/странах — нет.
- **Триал считается по первому платному счёту**: `current_period_end` в вебхуке `customer.subscription.created` будет = момент оформления + 3 дня. Логика разблокировки в `webhook.ts` должна разблокировать `report` в статусе `trialing`, а не ждать `active` — проверю и починю если что.
