/* ==========================================================================
   T-02C: THEME ENGINE
   git commit -m "feat(js): dark mode engine"
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "theme"; // contract-mandated key name — do not rename
  const root = document.documentElement;

  /**
   * Applies a theme by setting data-theme on <html>.
   * All actual repainting is handled by CSS variables in tokens.css —
   * this function never touches colors directly.
   */
  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme"); // dark is the default (no attribute)
    }
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      // localStorage can throw in private-browsing / disabled-storage
      // contexts — fail safe to system preference instead of crashing.
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      /* silently ignore — theme still applies for this session */
    }
  }

  function systemPrefersLight() {
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  }

  /**
   * Resolve the theme to show on first paint:
   * 1. explicit user choice in localStorage wins
   * 2. otherwise fall back to the OS-level preference
   * 3. otherwise default to dark
   */
  function resolveInitialTheme() {
    const stored = getStoredTheme();
    if (stored === "light" || stored === "dark") return stored;
    return systemPrefersLight() ? "light" : "dark";
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function updateToggleButton(button, theme) {
    const isLight = theme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    button.querySelector(".theme-toggle__icon").textContent = isLight ? "\u2600" : "\u263D";
    button.querySelector(".theme-toggle__label").textContent = isLight ? "Light" : "Dark";
  }

  function initThemeEngine() {
    // Apply as early as possible (called from an inline <script> in <head>
    // in production to avoid a flash of the wrong theme; here it runs on
    // DOMContentLoaded since everything is deferred together).
    applyTheme(resolveInitialTheme());

    const toggleButton = document.querySelector("[data-theme-toggle]");
    if (!toggleButton) return;

    updateToggleButton(toggleButton, currentTheme());

    toggleButton.addEventListener("click", function () {
      const next = currentTheme() === "light" ? "dark" : "light";
      applyTheme(next);
      storeTheme(next);
      updateToggleButton(toggleButton, next);
    });

    // Keep in sync if the user changes OS theme AND has never made an
    // explicit choice on this site.
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (e) {
      if (getStoredTheme()) return; // explicit choice always wins
      applyTheme(e.matches ? "light" : "dark");
      updateToggleButton(toggleButton, currentTheme());
    });
  }

  document.addEventListener("DOMContentLoaded", initThemeEngine);
})();
