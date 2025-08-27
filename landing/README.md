eprime.md Landing
==================

Высококонверсионный лендинг для eprime.md с интерактивным квиз‑калькулятором.

Быстрый старт
--------------
1. Откройте `index.html` в браузере (локально или через статический хостинг).
2. Измените идентификаторы аналитики в `index.html` (GA4, Яндекс.Метрика, Meta Pixel).
3. Подключите реальный обработчик заявок в `assets/js/app.js` (замените `fakeNetwork`).

Структура
---------
- `index.html` — разметка всех секций и формы
- `assets/css/styles.css` — стили, адаптив, дизайн‑система
- `assets/js/app.js` — логика квиза, валидация форм, трекинг событий
- `assets/img/*` — изображения (добавьте свои, оптимизируйте)

Разделы
-------
- Hero, Проблема, Решение (УТП)
- Квиз‑калькулятор (4 шага) с расчётом экономии, энергии, окупаемости
- Кейсы, Процесс, FAQ
- Префутер с формой и CTA

Интеграция CRM / Почты
----------------------
Замените функцию `fakeNetwork` на реальный POST запрос в CRM/Webhook:

```js
async function submitLead(payload) {
  const res = await fetch('https://your-crm-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Network');
}
```

Аналитика
---------
- GA4: задайте `GA_MEASUREMENT_ID` в `index.html`
- Яндекс.Метрика: задайте `YM_ID`
- Meta Pixel: задайте `FB_PIXEL_ID`

События отправляются через `trackEvent(name, params)`.

Оптимизация
-----------
- Замените заглушки изображений в `assets/img/` на реальные фотографии/рендеры
- Сожмите изображения (WebP/AVIF), используйте `loading="lazy"`
- Проверьте CLS/LCP через PageSpeed Insights

Деплой
------
Статический хостинг (Netlify, Vercel, S3, nginx). Достаточно загрузить содержимое папки `landing/`.

