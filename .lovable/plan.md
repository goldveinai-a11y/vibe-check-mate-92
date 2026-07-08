## Цель
Усилить визуал полного отчёта (`/report/$id`) — убрать «стены текста» в платной части, добавить графики и микро-анимации без изменений схемы, промпта и старых отчётов.

## Что делаем

### 1. Sparkline в Vibe Decay
- В `VibeDecayCard` (файл `src/routes/report.$id.tsx`) добавляем декоративный SVG-sparkline на 8 точек.
- Точки синтезируются детерминированно из `trajectory` + `weekly_delta_pct` (например: rising = восходящая с шумом, nose-diving = крутая нисходящая). Стабильный seed от `range`, чтобы график не «дёргался» при ре-рендере.
- Градиентная заливка под линией (pink → transparent), сама линия — purple. Высота ~80px, во всю ширину карточки.
- Подписи слева/справа диапазона (`range`).

### 2. Радар-чарт в Compatibility Breakdown
- Новый компонент `src/components/CompatibilityRadar.tsx`: чистый SVG, 7 осей, polygon с заливкой `pink/purple` градиентом.
- Оси: Interest, Reciprocity, Warmth, Consistency, Flirting, Health, Non-toxicity (100 − toxicity_score).
- Подписи по вершинам, лёгкая сетка (3 концентрических 7-угольника).
- `framer-motion`: polygon анимируется от центра к финальной форме за 0.8s.
- Ниже радара оставляем компактный список тех же 7 метрик мелким шрифтом (сохраняем читаемость чисел), но без прогресс-баров — они дублировали радар.

### 3. Визуальное усиление Psych / Gottman / Verdict / Future Outlook
- В каждом из этих блоков (`report.$id.tsx`) первое предложение выносим в **pull-quote**: `font-serif`, крупный кегль, цветной акцент, тонкая вертикальная планка слева.
- Остальной текст — обычным весом ниже.
- Иконка блока увеличивается и получает мягкий цветной фон-«медальон» (уже частично сделано, приводим к единому стилю).
- Не плодим микрокарточки — усиливаем существующие.

### 4. Микро-анимации
- **Count-up** на числе внутри `InterestDonut` и на overall score (0 → N за 0.9s, `framer-motion` `useMotionValue` + `animate`).
- **Shimmer** на карточке Vibe Award: тонкий диагональный градиентный блик, проходящий раз в 6s (чистый CSS keyframe в `styles.css`).

## Что НЕ трогаем
- JSON-схема (`vibecheck-schema.ts`), промпт (`vibecheck.server.ts`), payload старых отчётов.
- Превью/платёж/шеринг-карточка.
- Мем-генератор, Lottie, You/Her split — отложено.

## Файлы
- edit `src/routes/report.$id.tsx` — sparkline в `VibeDecayCard`, замена баров на радар, pull-quotes в Psych/Gottman/Verdict/Future Outlook, shimmer на Vibe Award, count-up на overall score.
- new `src/components/CompatibilityRadar.tsx` — SVG-радар.
- edit `src/components/InterestDonut.tsx` — count-up числа.
- edit `src/styles.css` — `@keyframes shimmer` и утилита `.shimmer`.

## Технические детали
- Sparkline генератор: чистая функция `buildDecayPoints(trajectory, delta) → number[8]`, значения 0..1, path строится через `M x0 y0 L x1 y1 ...` + замыкающий path для gradient fill.
- Радар: полярные координаты `cx + r*cos(θ)`, `cy + r*sin(θ)`, θ = `-π/2 + i*2π/7`. Радиус метрики = `maxR * value/100`.
- Count-up: `const mv = useMotionValue(0); useEffect(() => animate(mv, target, {duration: 0.9})); mv.on("change", v => setDisplay(Math.round(v)))`.
- Всё SSR-safe, никаких `window` в рендере.