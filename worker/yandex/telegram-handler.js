// Yandex Cloud Function: приём заявок с сайта-визитки -> пересылка в Telegram.
//
// Runtime: Node.js 18+ (глобальный fetch).
// Переменные окружения (задаются в консоли Yandex Cloud Function):
//   BOT_TOKEN  — токен бота от @BotFather
//   CHAT_ID    — id чата, куда приходят заявки
//   SITE_TOKEN — общий секрет; тот же в X-Site-Token в script.js
//
// Публичный URL: включить "Публичный вызов" в настройках функции ->
// https://functions.yandexcloud.net/<function-id>

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Site-Token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

module.exports.handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return resp(405, { ok: false, error: "method-not-allowed" });
  }

  // Проверка секрета (заголовки в YCF могут быть в любом регистре)
  const headers = lowerKeys(event.headers || {});
  const siteToken = headers["x-site-token"];
  if (!process.env.SITE_TOKEN || siteToken !== process.env.SITE_TOKEN) {
    return resp(403, { ok: false, error: "forbidden" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resp(400, { ok: false, error: "bad-json" });
  }

  // Honeypot: бот заполнил скрытое поле -> тихий "успех" без отправки
  if (body._gotcha && String(body._gotcha).trim() !== "") {
    return resp(200, { ok: true });
  }

  const name = clean(body.name);
  const contact = clean(body.contact);
  const message = clean(body.message);

  if (!name || !contact || !message) {
    return resp(400, { ok: false, error: "missing-fields" });
  }

  const text =
    "📩 Новая заявка с сайта-визитки\n" +
    `Имя: ${name}\n` +
    `Контакт: ${contact}\n` +
    `Задача: ${message}`;

  try {
    const tg = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.CHAT_ID, text }),
      }
    );
    if (!tg.ok) {
      return resp(502, { ok: false, error: "telegram-error", status: tg.status });
    }
    return resp(200, { ok: true });
  } catch (e) {
    return resp(502, { ok: false, error: "telegram-exception" });
  }
};

function clean(v) {
  return String(v ?? "").trim().slice(0, 2000);
}

function lowerKeys(obj) {
  const out = {};
  for (const k of Object.keys(obj)) out[k.toLowerCase()] = obj[k];
  return out;
}

function resp(status, obj) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(obj) };
}