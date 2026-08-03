# Premium Weekly $4.99 — два тарифа на пейволле

## Что получится

На пейволле остаётся ровно две карточки: **Single Report $1.99** (без изменений) и **Premium Weekly $4.99/неделя** с бейджем MOST POPULAR, без пробного периода — списание сразу, продление каждую неделю, отмена в любой момент. Monthly и Yearly исчезают из UI, но их код, Stripe-цены и активные подписки остаются рабочими.

## Stripe

- Новый recurring Price: 4.99 USD, интервал `week`, тот же продукт, что у текущих премиум-планов, `lookup_key: vibecheck_weekly`, без trial. Создаётся в test; в live уезжает при следующей публикации.
- Существующие `vibecheck_monthly`, `vibecheck_monthly_trial_fee`, `vibecheck_yearly` не трогаются и не архивируются.

## Код

**src/lib/vibecheck.functions.ts**
- `PlanEnum` → `z.enum(["single", "monthly", "yearly", "weekly"])`.
- В `createCheckoutSession`: ветка `weekly` → lookup `vibecheck_weekly`.
- `isSubscription` уже `plan !== "single"`, значит weekly автоматически subscription mode — правок не требует.
- Trial-логика (`trial_period_days: 3`, второй line item `vibecheck_monthly_trial_fee`) уже условна по `plan === "monthly"`, поэтому weekly её не получает — правок не требует.

**src/lib/vibecheck-chat.server.ts**
- `chatLimitForPlan`: добавить `weekly` к безлимитной ветке рядом с monthly/yearly.

**src/components/ReportChat.tsx**
- `isUnlimitedPlan` (строка 197) сравнивает план со строками "monthly"/"yearly" — добавить `weekly`, иначе купивший Weekly увидит лимит 10 вопросов. Это пункт 13 из задания.

**src/routes/paywall.$id.tsx**
- Тип `Plan` дополняется `"weekly"`.
- В массив `TIERS` добавляется объект `weekly` ($4.99, badge MOST POPULAR, highlight, CTA «Get Unlimited - $4.99», текст про безлимит/списание сразу/еженедельное продление/отмену в любой момент). Объекты `monthly` и `yearly` остаются в файле, но помечаются флагом и не рендерятся (фильтр перед `.map`), включая блок сравнения `$9.99/mo` у yearly.

**src/routes/account.tsx**
- Строка 180: подпись плана становится трёхветочной — `weekly` → «Premium Weekly», yearly → «Premium Yearly», иначе «Premium Monthly».

**src/routes/api/public/payments/webhook.ts**
- `markAnalysisPaid`: расширить приведение типа плана на `"weekly"`.
- `upsertSubscription`: тип `plan` расширить на `"weekly"`; колонка в БД — обычный `text`, отдельная миграция не нужна (перед правкой проверю, нет ли CHECK-ограничения на `subscriptions.plan`; если есть — добавлю миграцию, разрешающую `weekly`, не убирая старые значения).
- Статусы и активация доступа плана не различают — weekly активируется тем же путём, что monthly.

## Проверка

Прогон обоих сценариев в браузере до страницы Stripe Checkout: Single — $1.99 разово; Weekly — $4.99 сразу с пометкой еженедельного продления и без trial. Плюс визуальная проверка, что на пейволле ровно две карточки и MOST POPULAR на Weekly.

## Чего не делаю

Не меняю Single, entitlement, магические ссылки, автологин, вёрстку и копирайт вне перечисленного; ничего не удаляю и не рефакторю.
