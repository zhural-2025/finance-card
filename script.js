// === Настройка формы ===
// Заменить на URL своего Cloudflare Worker (см. worker/telegram-webhook.js и README.md).
const WEBHOOK_URL = "https://your-worker.example.workers.dev";

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
            "X-Site-Token": "REPLACE_WITH_SITE_TOKEN", // должно совпадать с SITE_TOKEN в Worker
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