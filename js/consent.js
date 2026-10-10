/* =========================================================
   COOKIE CONSENT (GDPR)

   Nothing non-essential runs before the visitor chooses.
   Optional scripts are written in the page as:
       <script type="text/plain" data-consent="analytics" data-src="...">
   (or inline code inside the tag) and are only turned into real
   scripts here, after consent. Categories: analytics, marketing.
   To add e.g. a Facebook Pixel, add a tag with data-consent="marketing".

   The choice is stored in a first-party cookie (wb_consent, 180 days).
========================================================= */
(function () {
    "use strict";

    var KEY = "wb_consent", DAYS = 180, VERSION = 1;
    var loaded = { analytics: false, marketing: false };
    var state = read();
    var box = null, lastFocus = null;

    function read() {
        try {
            var m = document.cookie.match(new RegExp("(?:^|; )" + KEY + "=([^;]*)"));
            if (!m) return null;
            var v = JSON.parse(decodeURIComponent(m[1]));
            return v && v.v === VERSION ? v : null;
        } catch (e) { return null; }
    }
    function write(c) {
        var s = KEY + "=" + encodeURIComponent(JSON.stringify(c)) + "; max-age=" + (DAYS * 86400) + "; path=/; SameSite=Lax";
        if (location.protocol === "https:") s += "; Secure";
        document.cookie = s;
    }

    function activate(cat) {
        if (loaded[cat]) return;
        loaded[cat] = true;
        document.querySelectorAll('script[type="text/plain"][data-consent="' + cat + '"]').forEach(function (old) {
            var s = document.createElement("script");
            if (old.getAttribute("data-src")) { s.src = old.getAttribute("data-src"); s.defer = true; }
            else s.text = old.text;
            document.head.appendChild(s);
        });
    }
    function applyState() {
        if (state && state.a) activate("analytics");
        if (state && state.m) activate("marketing");
    }

    function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

    function build() {
        box = el("div", "wb-cookie");
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-labelledby", "wb-cookie-title");
        box.setAttribute("aria-describedby", "wb-cookie-desc");
        box.hidden = true;
        box.innerHTML =
            '<div class="wb-cookie__head">' +
            '<span class="wb-cookie__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 109 9 4 4 0 01-4-4 4 4 0 01-4-4 1 1 0 00-1-1z"/><path d="M8.5 11.5h.01M12 16h.01M15.5 13h.01M9 15.5h.01"/></svg></span>' +
            '<div><h2 id="wb-cookie-title" tabindex="-1">Cookies</h2>' +
            '<p id="wb-cookie-desc">We use cookies to keep the site running and, with your OK, to see what’s useful. Details in our <a href="/privacy.html#cookies">privacy policy</a>.</p></div></div>' +
            '<div class="wb-cookie__panel" id="wb-cookie-panel" hidden>' +
            toggle("necessary", "Necessary", "Keeps the site working and remembers this choice. Always on.", true, true) +
            toggle("analytics", "Analytics", "Privacy-friendly stats that show which pages are useful.", false, false) +
            toggle("marketing", "Marketing", "Not used today. Would only load with your OK.", false, false) +
            '<button type="button" class="wb-btn wb-btn--sm" data-act="save">Save my choices</button></div>' +
            '<div class="wb-cookie__actions">' +
            '<button type="button" class="wb-btn" data-act="accept">Accept all</button>' +
            '<button type="button" class="wb-btn wb-btn--primary" data-act="reject">Reject all</button>' +
            '<button type="button" class="wb-btn wb-btn--ghost wb-btn--settings" data-act="settings" aria-expanded="false" aria-controls="wb-cookie-panel">Settings</button></div>';
        document.body.appendChild(box);

        box.addEventListener("click", function (e) {
            var b = e.target.closest("button[data-act]");
            if (!b) return;
            var act = b.getAttribute("data-act");
            if (act === "accept") save(true, true);
            else if (act === "reject") save(false, false);
            else if (act === "save") save(box.querySelector("#wb-c-analytics").checked, box.querySelector("#wb-c-marketing").checked);
            else if (act === "settings") togglePanel();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape" || box.hidden) return;
            var panel = box.querySelector("#wb-cookie-panel");
            if (!panel.hidden) { togglePanel(false); box.querySelector('[data-act="settings"]').focus(); }
            else if (state) hide();
        });
    }
    function toggle(id, title, text, on, locked) {
        return '<div class="wb-toggle"><label for="wb-c-' + id + '"><span><strong>' + title + '</strong><small>' + text + '</small></span>' +
            '<input type="checkbox" id="wb-c-' + id + '"' + (on ? " checked" : "") + (locked ? " disabled" : "") + "></label></div>";
    }
    function togglePanel(force) {
        var panel = box.querySelector("#wb-cookie-panel"), btn = box.querySelector('[data-act="settings"]');
        var open = typeof force === "boolean" ? force : panel.hidden;
        panel.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) box.querySelector("#wb-c-analytics").focus();
    }
    function show(fromUser) {
        if (!box) build();
        box.querySelector("#wb-c-analytics").checked = !!(state && state.a);
        box.querySelector("#wb-c-marketing").checked = !!(state && state.m);
        box.hidden = false;
        document.body.classList.add("wb-cookie-open");
        if (fromUser) {
            lastFocus = document.activeElement;
            togglePanel(true);
        } else togglePanel(false);
    }
    function hide() {
        if (!box) return;
        box.hidden = true;
        document.body.classList.remove("wb-cookie-open");
        if (lastFocus && lastFocus.focus) { lastFocus.focus(); lastFocus = null; }
    }
    function save(a, m) {
        var hadOptional = loaded.analytics || loaded.marketing;
        var revoked = (loaded.analytics && !a) || (loaded.marketing && !m);
        state = { v: VERSION, a: a ? 1 : 0, m: m ? 1 : 0, t: Date.now() };
        write(state);
        applyState();
        hide();
        if (hadOptional && revoked) location.reload();   /* already-loaded third-party code cannot be unloaded */
    }

    window.wbConsent = { open: function () { show(true); }, get: function () { return state; } };

    document.addEventListener("click", function (e) {
        var t = e.target.closest && e.target.closest("[data-cookie-settings]");
        if (t) { e.preventDefault(); show(true); }
    });

    applyState();
    function init() { if (!state) show(false); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
