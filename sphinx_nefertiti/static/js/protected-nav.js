(function () {
  const AUTH_COOKIES = ["docsUser"];
  const PERMS_COOKIE = "docsPerms";

  function hasCookie(name) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|;\\s*)" + esc + "=").test(document.cookie);
  }

  function getCookie(name) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = document.cookie.match(new RegExp("(^|;\\s*)" + esc + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : null;
  }

  function isLoggedIn() {
    return AUTH_COOKIES.some(hasCookie);
  }

  // base64url decode -> string (best effort)
  function b64urlDecodeToString(s) {
    try {
      if (!s) return null;
      s = s.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      // atob expects latin1; docsPerms is ASCII JSON so OK
      return atob(s);
    } catch (e) {
      return null;
    }
  }

  // Parse docsPerms cookie -> {v, domain, perms[]} or null
  function readPermsCookie() {
    const raw = getCookie(PERMS_COOKIE);
    if (!raw) return null;

    const decoded = b64urlDecodeToString(raw);
    if (!decoded) return null;

    try {
      const obj = JSON.parse(decoded);
      if (!obj || !Array.isArray(obj.perms)) return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  // Make a CSS-safe class slug for a perm value
  // "perm:docs:gpm" -> "perm-docs-gpm"
  function permToClassSlug(perm) {
    return String(perm || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Decide if a protected <li> should show:
  // - if logged out: never
  // - if logged in: requires the permission in data-protected-perm (preferred) or data-protected
  function canSee(li, permSet, isLoggedIn) {
    if (!isLoggedIn) return false;

    const required =
      li.getAttribute("data-protected") ||
      "";

    const req = String(required).trim();
    if (!req) return false;

    return permSet.has(req);
  }

  function apply() {
    const root = document.documentElement;
    // 1) Logged-in class
    root.classList.toggle("docs-logged-in", isLoggedIn());

    const pc = readPermsCookie();
    const permSet = new Set(
      pc && Array.isArray(pc.perms) ? pc.perms.map((x) => String(x || "").trim()) : []
    );

    const raw = getCookie(PERMS_COOKIE);
    const decodedStr = raw ? b64urlDecodeToString(raw) : null;

    // Toggle protected nav entries (sidebar + in-page contents)
    const items = document.querySelectorAll(
      'nav.toc li[data-protected], .toctree-wrapper li[data-protected]'
    );

    items.forEach((li, idx) => {
      const required = (li.getAttribute("data-protected") || "").trim();
      const allowed = isLoggedIn() && required && permSet.has(required);
      li.classList.toggle("docs-allowed", !!allowed);
    });
  }

  // Run early enough; also re-run after full load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
  window.addEventListener("load", apply);
})();
