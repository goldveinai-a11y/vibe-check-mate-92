
## Ответ на вопрос

**Нет, сейчас в коде НЕ твой промт.** Я ранее собрал упрощённую версию (Gen Z tone, verbatim quotes, JSON). Она рабочая, но заметно проще, чем то, что ты сейчас скинул: у тебя добавлены `reciprocity_score`, `emotional_warmth`, числовой `conversation_health` (0–100 вместо enum), блок `hardcore_analytics` со **статистикой + временнóй динамикой**, `gottman_patterns`, и более жёсткие требования к тону. Это заметно **более продающий** продукт.

**Схема report_json тоже отличается** — если просто подменить промт, парсинг сломается. Нужно синхронно обновить Zod-схему, preview, и обе страницы отображения (results + report).

## Что предлагаю

### 1. Принять твой промт и схему целиком (без ослаблений)

Обновить `src/lib/vibecheck.server.ts`:
- `SYSTEM_PROMPT` = твой текст дословно (Critical Instruction + Tone of Voice + Audience & Culture Fit + JSON schema)
- Оставить `temperature: 0` для стабильности скоринга
- Модель: `claude-sonnet-4-5` (уже используется). Опция апгрейда — `claude-opus-4-5` для «wow»-качества, но в 5× дороже и медленнее. По умолчанию оставлю Sonnet 4.5, если ты не скажешь иначе.

### 2. Обновить Zod-схему `ReportSchema`

Новая форма (совпадает с твоей 1-в-1):
```
scores: {
  interest_score, reciprocity_score, emotional_warmth,
  response_consistency, flirting_signals, toxicity_score,
  conversation_health   // теперь number 0–100
}
hardcore_analytics: { initiative_stat, engagement_stat, timeline_changes, communication_style }
psychological_analysis: { attachment_style_prediction, gottman_patterns }
green_flags[], red_flags[], future_outlook
```

Плюс валидатор, требующий **минимум 2 green_flags и 2 red_flags** и что все строки на английском.

### 3. Пересобрать `buildPreview`

Что уходит в бесплатное превью (продающее, но не спойлерит):
- Все 7 scores (для крутого dashboard-грид с барами)
- `hardcore_analytics.initiative_stat` (один хук со статистикой — «out of 15 messages, 12 came from you»)
- 1 green_flag (title + quote) полностью
- 1 red_flag только `title`, quote/explanation блюрятся
- Verdict-заголовок (вычисляется из scores как сейчас)

Что уходит **только в платный отчёт**: остальные 3 hardcore_analytics, psychological_analysis, все остальные green/red flags целиком, future_outlook.

### 4. Переверстать `/results/$id` под новую схему
Продающее превью с 7-барным score board, hero-verdict, один statистический хук, тизер флагов. Заменит нынешнюю верстку (её я уже поднял, но она под старую схему — придётся синхронизировать).

### 5. Переверстать `/report/$id` под новую схему
Полный отчёт: hero verdict, статистика с иконками (4 блока hardcore_analytics), psychological analysis (2 карточки: attachment style + Gottman patterns), все green flags, все red flags, future_outlook как финальный «verdict card». Тон и подача — как ты описал (продающая, живая).

### 6. Сгенерить и показать тебе живой пример полного отчёта

**Как:** пойти на `/upload`, загрузить набор тестовых скриншотов реального чата (я могу либо сгенерить синтетические скрины через imagegen, либо ты кинешь свои реальные — так лучше, потому что real conversation → real report). Дам ID, ты откроешь `/report/{id}` (я временно разблокирую его, миную paywall для теста, потом уберу заглушку).

**Что тебе даст:** увидишь фактический тон Claude, качество статистики, насколько «wow» получается. Если промт нужно докрутить (усилить хамство/юмор, добавить конкретики) — правим итеративно.

## Что НЕ трогаю
- Оплата, webhook, RLS, дизайн-система, схема Supabase (report_json — jsonb, форма ему безразлична)
- Компонент VibeCheckout и стрип-интеграция

## Вопрос к тебе перед реализацией
1. **Тестовые скрины для sample report:** ты кинешь 2–5 реальных скринов чата, или сгенерить синтетические? Реальные → правдивее ощущение продукта.
2. **Модель:** остаёмся на `claude-sonnet-4-5` или пробуем `claude-opus-4-5` для сравнения качества? (Opus заметно дороже — ~$15/M input vs $3/M).
