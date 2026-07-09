## Что случилось

В прошлом шаге я добавил в `stripe.checkout.sessions.create(...)` параметр `automatic_payment_methods: { enabled: true }`. Этот параметр валиден для **PaymentIntents**, но **не для Checkout Sessions** — Stripe API его отклоняет, поэтому серверная функция падает и кнопка на пейволле «ничего не делает» (ошибка возвращается в `checkoutError`, но визуально это выглядит как «мертвая» кнопка).

Возвращаемся ровно к тому состоянию, которое ты одобрил: hosted Stripe Checkout с Apple Pay / Link / Amazon Pay / картами / промокодом — без моих «улучшений».

## Изменение (одно, точечное)

**`src/lib/vibecheck.functions.ts`**
- Удалить строку `...({ automatic_payment_methods: { enabled: true } } as Stripe.Checkout.SessionCreateParams),` из `stripe.checkout.sessions.create({...})`.
- Удалить неиспользуемый `import type Stripe from "stripe"` (если после удаления он больше нигде не нужен в файле).

Всё остальное (success_url / cancel_url / metadata / subscription_data / trial / discounts / webhook) не трогаю.

## Про Google Pay

В Checkout Sessions **нет** программного флага, эквивалентного «включи Google Pay». Google Pay в hosted Checkout появляется автоматически, если:
1. Он включён в Stripe Dashboard → **Settings → Payment methods** для нужного аккаунта (sandbox/live), **и**
2. Браузер/устройство пользователя действительно поддерживает Google Pay (в Chrome нужна сохранённая карта в Google Pay в этом же Google-аккаунте).

Твоя ссылка `buy.stripe.com/test_...` работает, потому что Payment Link создан из того же аккаунта, где Google Pay включён — значит настройка на уровне Dashboard уже правильная. Скорее всего дело в п.2 (в Chrome, где ты тестируешь, нет привязанной карты в Google Pay именно для того Google-аккаунта). Проверить можно открыв ту же Payment Link ссылку в том же Chrome-профиле — если там Google Pay тоже не показывается, значит проблема на стороне браузера, а не в нашем коде.

**Никакого кода для «включить Google Pay» я больше писать не буду**, пока ты явно не подтвердишь, что хочешь дальше копать.

## После этого фикса

Кнопка снова редиректит на `checkout.stripe.com/...` — как было в том сообщении, которое ты одобрил.
