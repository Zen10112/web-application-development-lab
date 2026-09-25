/* Contact form: client-side validation + state handling.
   Kept separate from theme.js — one concern per file. */

(function () {
  "use strict";

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const status = form.querySelector(".form-status");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const message = form.elements.message.value.trim();

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || !email || !message) {
        setStatus("Please fill in every field.", "error");
        return;
      }
      if (!emailPattern.test(email)) {
        setStatus("That email address doesn't look valid.", "error");
        form.elements.email.focus();
        return;
      }

      // No backend in this exercise — simulate a successful submit and
      // reset local state.
      setStatus("Thanks " + name + " — your message is on its way.", "success");
      form.reset();
    });

    function setStatus(text, state) {
      status.textContent = text;
      status.setAttribute("data-state", state);
    }
  }

  document.addEventListener("DOMContentLoaded", initContactForm);
})();
