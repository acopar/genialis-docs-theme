// sphinx_nefertiti/static/js/account-ui.js
(function () {
  // Suggested cookie name (matches your earlier naming)
  const COOKIE_NAME = "docsUser";

  function getCookie(name) {
    const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : null;
  }

  function safeText(s) {
    // Safe for UI display; never use innerHTML
    return String(s ?? "").trim().slice(0, 80);
  }

  function setVisible(el, visible) {
    if (!el) return;
    el.style.display = visible ? "" : "none";
  }

  function parseDocsUserCookie(raw) {
    if (!raw) return null;

    // We'll try JSON first, then base64url JSON, then fallback to raw string.
    // Try JSON directly
    try {
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : null;
    } catch (_) {}

    // Try Base64URL JSON
    try {
      const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
      const pad = "=".repeat((4 - (b64.length % 4)) % 4);
      const jsonStr = atob(b64 + pad);
      const obj = JSON.parse(jsonStr);
      return obj && typeof obj === "object" ? obj : null;
    } catch (_) {}

    // Fallback: treat as a display string
    return { display: raw };
  }

  function initAccountUi() {
    const signinBtn = document.getElementById("snftt-signin-btn");
    const accountDd = document.getElementById("snftt-account-dropdown");
    const accountLabel = document.getElementById("snftt-account-label");

    const raw = getCookie(COOKIE_NAME);
    const docsUser = parseDocsUserCookie(raw);

    const display = safeText(docsUser && docsUser.display);

    if (display) {
      // Logged in (UI)
      if (accountLabel) accountLabel.textContent = display;
      setVisible(signinBtn, false);
      setVisible(accountDd, true);
    } else {
      // Logged out (UI)
      if (accountLabel) accountLabel.textContent = "Account";
      setVisible(signinBtn, true);
      setVisible(accountDd, false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccountUi);
  } else {
    initAccountUi();
  }
})();
