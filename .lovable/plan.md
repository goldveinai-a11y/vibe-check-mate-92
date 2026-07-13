## Диагноз

- Go-live Stripe завершён полностью (все 5 шагов `completed`, live account `acct_1TshxZDlgBVIakEa`).
- `.env.production` уже содержит `pk_live_...` (Lovable записал его после `provision_live_keys`).
- Но опубликованный деплой на `vibecheckapp.app` был собран РАНЬШЕ — в его JS-бандле зашит старый `pk_test_...` из тогдашнего `.env.production`. `PaymentTestModeBanner` видит `pk_test_` префикс → рисует оранжевую плашку.
- Preview (`id-preview--…lovable.app`) всегда билдится в dev-режиме с `.env.development` (там `pk_test_...`), поэтому там плашка останется по дизайну — и это правильно, чекаут в превью реально тестовый.

## Действие

1. Нажать **Publish → Update** (или я запущу `preview_ui--publish`), чтобы пересобрать production с текущим `.env.production`.
2. После деплоя открыть `https://vibecheckapp.app/paywall/<id>` — плашка "Test mode" должна исчезнуть, а `pk_live_...` начнёт грузить настоящий Stripe.
3. Проверить, что кнопка чекаута ведёт на реальную оплату (не тестовые карты). Если по ошибке провести живую транзакцию — вернуть через Stripe Dashboard.

## Что НЕ трогаем

- Код `PaymentTestModeBanner.tsx` — логика правильная, плашка нужна на превью.
- `.env.development` — остаётся с `pk_test_...`, иначе разработка станет проводить живые платежи.
- Ценообразование, продукт, чекаут-функции — не меняются.
