## Проблема

Сейчас у нас Stripe **Embedded Checkout** (форма встроена в iframe на `/paywall/$id`). На нём показывается только поле карты — Apple Pay / Google Pay / Link / Amazon Pay в этом режиме не появляются в превью-домене, потому что для встроенного iframe нужна верификация домена Apple и других wallet'ов. Это и есть причина «страшного» вида и низкой конверсии.

## Решение

Не тянуть Payment Links (они статичные и теряют нашу метадату — `analysisId`, `email`, `refCode`, `ownerAnonId` — от которой зависит вебхук, разблокировка отчёта и Wingman-рефералы).

Вместо этого переключить наш существующий `createCheckoutSession` с **Embedded** на **Hosted Stripe Checkout** — это та же самая страница, что открывается по Payment Link на твоём скриншоте (с Apple Pay, Google Pay, Link, Amazon Pay, промокодом и т.д.), но с сохранением всей нашей логики и метадаты.

Поток становится: пользователь жмёт тариф → редирект на `checkout.stripe.com/...` → после оплаты Stripe возвращает на наш `/checkout/return?...` → вебхук уже отрабатывает как сейчас.

## Что меняется

**Backend — `src/lib/vibecheck.functions.ts` (`createCheckoutSession`)**
- Убрать `ui_mode: "embedded_page"` и `return_url` (embedded-специфичный).
- Добавить `success_url` (наш `/checkout/return?...&session_id={CHECKOUT_SESSION_ID}`) и `cancel_url` (обратно на `/paywall/$id`).
- Явно включить wallets: `payment_method_types: ["card", "link"]` + `automatic_payment_methods: { enabled: true }` (Apple/Google Pay появляются автоматически по браузеру/устройству).
- Разрешить промокод: `allow_promotion_codes: true` (пригодится для Wingman-скидки в будущем).
- Возвращать `{ url: session.url }` вместо `{ clientSecret }`.
- Метадата (`analysisId`, `plan`, `email`, `refCode`, `ownerAnonId`) — как есть, ничего не трогаем.

**Frontend — `src/routes/paywall.$id.tsx`**
- Убрать состояние `selected` и блок с `<VibeCheckout .../>`.
- По клику на тариф (после валидации email): вызвать `createCheckoutSession` и сделать `window.location.href = result.url`.
- Показать лёгкий loading-state на выбранной карточке пока идёт запрос.

**Удалить (больше не нужны)**
- `src/components/VibeCheckout.tsx`
- Импорты `@stripe/react-stripe-js` / `getStripe` / `EmbeddedCheckoutProvider` на этой странице. Пакеты `@stripe/stripe-js` и `@stripe/react-stripe-js` из `package.json` не трогаем на этом шаге (могут использоваться где-то ещё; удалим отдельно, если подтвердится).

**Не трогаем**
- `src/routes/api/public/payments/webhook.ts` — вся логика (`markAnalysisPaid`, `upsertSubscription`, Wingman `redemption_count`) продолжает работать: та же метадата, тот же `checkout.session.completed`.
- `src/routes/checkout.return.tsx` — Stripe так же подставит `{CHECKOUT_SESSION_ID}` в `success_url`.
- `src/lib/stripe.server.ts`, `stripe.ts`, тарифы, prices, компонент `PaymentTestModeBanner`.

## Что получим

Ровно та страница чекаута, что у тебя на скриншоте: Apple Pay, Google Pay, Link, Amazon Pay, карты, поле промокода, локализация (RU/USD), 3-day free trial для monthly — всё «из коробки» Stripe. Нашей логике разблокировки отчёта и рефералам от этого ничего не будет.

## Известный компромисс

Пользователь на 2–3 секунды уходит с нашего домена на `checkout.stripe.com` и возвращается обратно — стандартный трейд-офф за нативные wallet'ы. Конверсия от появления Apple/Google Pay это с большим запасом перекрывает.