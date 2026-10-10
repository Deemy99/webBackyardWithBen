/* =========================================================
   NEWSLETTER component (.wb-news) — one script for every page.
   States: idle, loading, success, error (inline, no page jump).
   Stores the subscriber in Supabase; Supabase is loaded on
   demand so pages that don't need it stay light.
========================================================= */
(function () {
    "use strict";

    var forms = document.querySelectorAll(".wb-news form");
    if (!forms.length) return;

    var CHECK = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/></svg>';

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            s.src = src; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    }
    var sbPromise = null;
    function ready() {
        if (typeof supabaseClient !== "undefined") return Promise.resolve();
        if (!sbPromise) {
            sbPromise = loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js")
                .then(function () { return loadScript("/js/supabase-config.js"); });
        }
        return sbPromise;
    }
    function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    forms.forEach(function (form) {
        var email = form.querySelector('input[type="email"]');
        var consent = form.querySelector('input[type="checkbox"]');
        var btn = form.querySelector('button[type="submit"]');
        var label = btn.querySelector(".wb-btn__label");
        var status = form.querySelector(".wb-news__status");
        var idle = label.textContent;

        function say(state, html, plain) {
            form.setAttribute("data-state", state);
            if (plain) status.textContent = plain; else status.innerHTML = html || "";
        }
        email.addEventListener("input", function () { email.removeAttribute("aria-invalid"); });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var value = email.value.trim();
            if (!isValidEmail(value)) {
                email.setAttribute("aria-invalid", "true");
                say("error", "", "Please enter a valid email address.");
                email.focus(); return;
            }
            if (!consent.checked) {
                say("error", "", "Please tick the box so we know it's OK to email you.");
                consent.focus(); return;
            }
            email.removeAttribute("aria-invalid");
            form.style.minHeight = form.offsetHeight + "px";
            label.textContent = "Joining…";
            say("loading", "", "");

            function done(text) {
                email.value = ""; consent.checked = false;
                say("success", CHECK + "<span></span>");
                status.querySelector("span").textContent = text;
            }
            ready().then(function () {
                return supabaseClient.from("newsletter_subscribers").insert({ email: value, source: "inline" });
            }).then(function (res) {
                if (!res.error) {
                    done("You’re in! Watch your inbox.");
                    fetch("/api/send-welcome-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: value }) }).catch(function () {});
                } else if (res.error.code === "23505") {
                    done("You’re already on the list. Watch your inbox.");
                } else {
                    throw res.error;
                }
            }).catch(function () {
                say("error", "", "Something went wrong. Please try again in a moment.");
            }).then(function () {
                label.textContent = idle;
                form.style.minHeight = "";
            });
        });
    });
})();
