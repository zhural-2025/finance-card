// Cloudflare Worker: приём заявок с сайта-визитки -> пересылка в Telegram-чат.
//
// Переменные окружения Worker (wrangler secret put NAME):
//   BOT_TOKEN   — токен бота от @BotFather
//   CHAT_ID     — id чата, куда приходят заявки (узнать через @userinfobot)
//   SITE_TOKEN  — общий секрет; тот же в X-Site-Token в script.js
//
// Локальный запуск/деплой: см. README.md (wrangler).

const API = "https://api.telegram.org";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return json({ ok: false, error: "method-not-allowed" }, 405);
    }

    // Проверка секрета
    const siteToken = request.headers.get("X-Site-Token");
    if (!env.SITE_TOKEN || siteToken !== env.SITE_TOKEN) {
      return json({ ok: false, error: "forbidden" }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "bad-json" }, 400);
    }

    // Honeypot: бот заполнил скрытое поле -> тихий "успех" без отправки
    if (body && body._gotcha && String(body._gotcha).trim() !== "") {
      return json({ ok: true });
    }

    const name = clean(body?.name);
    const contact = clean(body?.contact);
    const message = clean(body?.message);

    if (!name || !contact || !message) {
      return json({ ok: false, error: "missing-fields" }, 400);
    }

    const text =
      "📩 Новая заявка с сайта-визитки\n" +
      `Имя: ${name}\n` +
      `Контакт: ${contact}\n` +
      `Задача: ${message}`;

    try {
      const tg = await fetch(`${API}/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
      });
      if (!tg.ok) {
        return json({ ok: false, error: "telegram-error", status: tg.status }, 502);
      }
      return json({ ok: true });
    } catch (e) {
      return json({ ok: false, error: "telegram-exception" }, 502);
    }
  },
};

function clean(v) {
  return String(v ?? "").trim().slice(0, 2000);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}