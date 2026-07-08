## Проблема
Превью не собирается: build падает из-за отсутствующего файла `src/components/ReportChat.tsx`. Он импортируется в `src/routes/report.$id.tsx` (строка 13), но никогда не был создан. TypeScript: `TS2307: Cannot find module '@/components/ReportChat'`. Статический превью → «Preview has not been built yet».

Бэкенд для чата уже готов: `getChatMessages` и `sendChatMessage` в `src/lib/vibecheck.functions.ts`, промпт/лимиты в `src/lib/vibecheck-chat.server.ts`, таблица `report_chat_messages` (миграция 20260709090000). Не хватает только UI-компонента.

## Что делаем

**Создать `src/components/ReportChat.tsx`** — компонент чата по отчёту, вызывается в `report.$id.tsx` как `<ReportChat analysisId={id} ownerAnonId={ownerAnonId} />`.

Функционал:
- `useQuery` → `getChatMessages({ data: { id, ownerAnonId } })` — грузит историю + `limit` + `locked`.
- Если `locked` — просто ничего не рендерим (страница отчёта уже видна только при оплате, но подстрахуемся).
- Список сообщений в стиле бренда (bubble для user справа розовый, для assistant слева карточка на cream/purple-soft, шрифт как в остальном отчёте).
- Инпут снизу + кнопка Send (Lucide `Send`), enter = отправить, `maxLength=400`, disabled когда `sending` или `remaining === 0`.
- Мутация: `sendChatMessage` → оптимистично добавляем user-turn, показываем «typing…» индикатор, по ответу добавляем assistant-turn и обновляем `remaining`. При `error === "limit_reached"` — показать спокойную плашку «you've used all N questions for this report». При `error === "locked"` — плашка «unlock to chat». Прочие ошибки — тост-строка ниже инпута.
- Счётчик «X of N questions left» справа сверху карточки.
- 2-3 предложенных стартовых вопроса-чипа (client-side константы: «why is my interest score X?», «what should I do next?», «are the red flags dealbreakers?») — кликом подставляются в инпут; показываем только когда история пустая.
- Заголовок блока: `Ask the report` + иконка `MessageCircle`, короткий подзаголовок «Follow-up questions, grounded in your data».

Технически:
- `useMutation` от `@tanstack/react-query`, invalidate `["chat", id]` после успеха ИЛИ ручной setQueryData для мгновенного апдейта.
- Ключ `queryOptions(["chat", id, ownerAnonId], () => getChatMessages(...))`.
- Auto-scroll к последнему сообщению через `ref` + `useEffect`.
- Тон копий — как весь остальной отчёт (лёгкий, разговорный, не корпоративный).

**Ничего больше не трогаем**: схема, промпты, серверные функции, платёж, старые отчёты, остальной визуал `report.$id.tsx`.

## Файлы
- new `src/components/ReportChat.tsx`

## Проверка
- `bunx tsgo --noEmit` должен пройти без TS2307.
- Статический превью соберётся, `/report/$id` рендерит блок чата под остальным контентом отчёта.
