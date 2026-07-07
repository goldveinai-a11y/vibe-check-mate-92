# Превью-отчёт: буст конверсии в покупку и шер

Цель: увеличить CR в оплату + виральный шер, ничего не ломая в схеме/промпте/оплате.

## Что делаем

### 1. Share-кнопки на трёх карточках
- Добавить компактную иконку-кнопку «Share to Stories» (`Share2`) в правый нижний угол:
  - карточки **verdict** (Mutual Crush и т.д.) — сейчас там только текст
  - карточки **Pop-Culture Match** (Nick & Jess)
  - оставить существующую на Vibe Award
- Все три жмут один и тот же `exportShareCard(shareRef.current)` — экспортит одну общую 9:16 карту (в ней и так есть award + couple + score + verdict). Один хендлер, три триггера.

### 2. Interest Score → градиентный donut с анимацией
- Заменить плоский розовый круг на SVG-donut:
  - внешнее кольцо: `conic-gradient` / SVG stroke от `--pink` к `--purple`
  - анимация заливки от 0 до `interest_score`% через `framer-motion` (`strokeDashoffset`)
  - в центре число + подпись «их интерес к вам» (уточняет двусмысленность без правок схемы)
- Без разделения You/Her — это потребовало бы правок промпта и Zod и сломало бы старые отчёты.

### 3. Sticky CTA снизу (мобайл)
- Компонент `StickyUnlockBar`: фикс-плашка `fixed bottom-0` с `Unlock Full Report` + цена.
- Триггер появления: `IntersectionObserver` на hero-блоке verdict (появляется, когда hero ушёл из вьюпорта).
- Скрывается, когда виден финальный CTA внизу (тот же observer на нижнем блоке).
- Только `sm:hidden` — на desktop лишний шум.
- Плавное `translate-y` + `opacity` через Tailwind transition.

### 4. Живой счётчик разблокированных отчётов
- Новый server function `getUnlockedCount` в `src/lib/vibecheck.functions.ts`: публичный `createServerFn`, читает `count(*) from analyses where paid=true` через server publishable client (уже есть anon SELECT-политика на таблице).
- В превью над финальным CTA: «12,847 отчётов разблокировано • обнови через 30с» — небольшая социалка, но без фейка.
- Кэш через TanStack Query, `staleTime: 60_000`. Первый рендер — через loader `ensureQueryData` (параллельно с превью).

### 5. Peek-эффект на locked-карточках (`LockedCard`)
- На `onPointerDown` (или tap) карточка на 400ms снимает `blur-sm` и показывает намёк-плейсхолдер («3 signals detected…»), потом возвращает блюр.
- Реализация: local `useState` + `setTimeout`, класс `blur-sm` условно.
- Плюс лёгкий `hover:scale-[1.02]` для десктопа.

## Что НЕ трогаем

- `vibecheck-schema.ts`, `vibecheck.server.ts` (промпт/Zod) — 0 правок
- `report.$id.tsx` (полный отчёт) — вне scope
- Оплата, вебхуки, Stripe, RLS
- `ShareCard.tsx` — используем как есть

## Файлы

- **Edit** `src/routes/results.$id.tsx` — share-кнопки на 2 карточки, donut, sticky bar mount, live counter, loader обновить
- **New** `src/components/InterestDonut.tsx` — SVG-donut с градиентом и анимацией
- **New** `src/components/StickyUnlockBar.tsx` — фикс-плашка + observer-логика
- **Edit** `src/lib/vibecheck.functions.ts` — `getUnlockedCount` server fn
- Обновить `LockedCard` внутри `results.$id.tsx` (peek)

## Технические детали

- Donut: SVG 200×200, `<circle r=90 stroke="url(#grad)" stroke-dasharray=565 stroke-dashoffset={565*(1-p/100)}>` + `<motion.circle>` для анимации.
- Sticky bar `z-40`, safe-area `pb-[env(safe-area-inset-bottom)]`, высота ~64px, не перекрывает финальный CTA (observer выключает).
- Counter fetch: server publishable client (не admin — избежать JWT-issue), `head: true, count: 'exact'`.

## Открытые вопросы (можно решить в процессе)
- Точная цена/anchor в sticky bar — беру текущую из `paywall.$id.tsx`, если там нет — «Unlock Full Report» без цены.
- Формулировка счётчика — «12,847 people unlocked their receipts» либо аналог; финал в имплементации.
