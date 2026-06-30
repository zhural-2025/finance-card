// === Настройка формы ===
// Публичный URL Yandex Cloud Function (заявки уходят сюда -> пересылка в Telegram).
const WEBHOOK_URL = "https://functions.yandexcloud.net/d4e2ttu9d8vr6312htq8";

// Общий секрет. Тот же, что в переменной окружения SITE_TOKEN функции.
const SITE_TOKEN = "0fcc104708a7dcc580fd25eb0ff46d4c1f98665002e05a66";

document.addEventListener("DOMContentLoaded", () => {
  // Год в подвале
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Форма заявки
  const form = document.getElementById("lead-form");
  const status = document.getElementById("form-status");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "Отправляю…";

      const data = Object.fromEntries(new FormData(form).entries());

      // Honeypot: заполнено -> молча считаем успехом (ботов отбрасываем)
      if (data._gotcha && data._gotcha.trim() !== "") {
        status.className = "form-status ok";
        status.textContent = "Готово! Свяжусь с вами скоро.";
        form.reset();
        return;
      }

      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Site-Token": SITE_TOKEN,
          },
          body: JSON.stringify({
            type: "visitka",
            name: (data.name || "").trim(),
            contact: (data.contact || "").trim(),
            message: (data.message || "").trim(),
          }),
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        status.className = "form-status ok";
        status.textContent = "Готово! Заявка ушла, свяжусь с вами скоро.";
        form.reset();
      } catch (err) {
        status.className = "form-status err";
        status.textContent =
          "Не удалось отправить. Напишите напрямую в Telegram или на почту — контакты ниже.";
      }
    });
  }
});