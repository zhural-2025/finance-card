# Сайт-визитка «Автоматизация бизнес-процессов»

Статичный сайт (чистый HTML + CSS + JS, без сборки). Секции: hero · польза · доверие · форма · контакты.

## Локальный предпросмотр
Открыть `index.html` в браузере двойным кликом — работает сразу, без зависимостей.

## Что нужно заполнить перед публикацией
В коде оставлены плейсхолдеры — найди и замени:

| Где | Что | Заменить на |
|-----|-----|-------------|
| `index.html` | `https://t.me/CHANGE_ME`, `mailto:CHANGE_ME@example.com` | реальные Telegram и email |
| `index.html` | hero/польза/доверие тексты | при необходимости — финальные формулировки |
| `script.js` | `WEBHOOK_URL` | URL задеплоенного Cloudflare Worker |
| `script.js` | `"X-Site-Token": "REPLACE_WITH_SITE_TOKEN"` | то же значение, что в `SITE_TOKEN` Worker |
| `assets/photo.jpg` (опц.) | аватар | если хочешь фото вместо инициалов «ПИ» — добавить файл и поправить `index.html` |
| `assets/og-image.svg` | превью соцсетей | можно заменить на `og-image.png` (обновить путь в `<meta og:image>`) |

## Форма → Telegram
1. Создать бота: `@BotFather` → `/newbot` → получить `BOT_TOKEN`.
2. Узнать `CHAT_ID`: написать боту, открыть `https://api.telegram.org/bot<TOKEN>/getUpdates`, взять `chat.id` (или через `@userinfobot`).
3. Задать переменные окружения Worker:
   ```
   wrangler secret put BOT_TOKEN
   wrangler secret put CHAT_ID
   wrangler secret put SITE_TOKEN
   ```
4. Деплой Worker:
   ```
   cd worker
   npx wrangler deploy telegram-webhook.js --name visitka-form --compatibility-date 2024-01-01
   ```
   (или через дашборд Cloudflare)
5. Полученный URL прописать в `script.js` → `WEBHOOK_URL`.
   Тот же `SITE_TOKEN` указать в `script.js` (заголовок `X-Site-Token`).

### Защита
- `X-Site-Token`: Worker отбрасывает запросы без верного секрета (403).
- Honeypot `_gotcha`: скрытое поле — боты заполняют, люди нет; такие заявки тихо отбрасываются.

## Деплой сайта (GitHub Pages)
Workflow лежит в корне репо `ai-learning`: `.github/workflows/deploy.yml`.
При push в `master`/`main`, затрагивающем `finance-card/**`, GitHub Actions публикует папку `finance-card/` на Pages.

Настройка в GitHub (репо `ai-learning`): **Settings → Pages → Source = GitHub Actions**.
URL после деплоя: `https://<user>.github.io/ai-learning`.

## Проверка
- Локально: открыть `index.html` — 5 секций, навигация-якоря работают, верстка адаптивна (DevTools mobile).
- Форма: временно поставить в `WEBHOOK_URL` адрес с webhook.site — убедиться, что JSON уходит, honeypot-запрос игнорируется, статус «отправлено» показывается.
- Worker: `curl -X POST <URL> -H "X-Site-Token: <SECRET>" -H "Content-Type: application/json" -d '{"name":"Тест","contact":"@t","message":"проверка"}'` → сообщение приходит в Telegram; без токена → 403; с `_gotcha` → `{"ok":true}` без сообщения.