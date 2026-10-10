/* =========================================================
   BACKYARD WITH BEN — site UI behaviour
   Mobile menu, Newsletter button, sticky category tab bar
   (Tools, Shop, Guides) with a sliding indicator, scroll
   reveal and the hero parallax. All motion is transform /
   opacity only and is skipped with prefers-reduced-motion.
========================================================= */
(function () {
    "use strict";

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- mobile menu ---- */
    function setMenu(header, open) {
        var btn = header.querySelector(".wb-menu-btn");
        if (!btn) return;
        header.setAttribute("data-open", open ? "true" : "false");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    function closeMenus() { document.querySelectorAll(".wb-header").forEach(function (h) { setMenu(h, false); }); }
    document.querySelectorAll(".wb-header").forEach(function (header) {
        var btn = header.querySelector(".wb-menu-btn");
        if (btn) btn.addEventListener("click", function () { setMenu(header, header.getAttribute("data-open") !== "true"); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenus(); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 900) closeMenus(); });

    /* ---- Newsletter button: smooth scroll to #newsletter, focus the email field ---- */
    document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest('a[href="#newsletter"]');
        if (!a) return;
        var target = document.getElementById("newsletter");
        if (!target) return;
        e.preventDefault();
        closeMenus();
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        if (history.replaceState) history.replaceState(null, "", "#newsletter");
        var field = target.querySelector('input[type="email"]');
        setTimeout(function () { if (field) field.focus({ preventScroll: true }); }, reduce ? 0 : 650);
    });

    /* ---- sticky tab bar: active tab + sliding indicator ----
       Shared by Ben's Tools, Shop the Look (static tabs) and Guides (built after load). */
    function initTabs(nav) {
        if (!nav || nav.__wbTabs) return;
        var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
        var items = links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute("href").slice(1)) }; })
            .filter(function (i) { return i.el; });
        if (!items.length) return;
        nav.__wbTabs = true;
        var list = nav.querySelector("ul");
        var ind = document.createElement("span");
        ind.className = "wb-tabs__ind"; ind.setAttribute("aria-hidden", "true");
        list.appendChild(ind);
        var header = document.querySelector(".wb-header");
        var current = null, queued = false;

        function place(a) {
            if (!a) { ind.style.opacity = "0"; return; }
            /* transform-only: the bar is 100px wide and scaled to the tab width */
            ind.style.transform = "translateX(" + a.offsetLeft + "px) scaleX(" + (a.offsetWidth / 100) + ")";
            ind.style.opacity = "1";
        }
        function offset() { return (header ? header.offsetHeight : 72) + nav.offsetHeight + 24; }
        function update(force) {
            queued = false;
            var y = offset(), active = null;
            items.forEach(function (it) { if (it.el.getBoundingClientRect().top <= y) active = it; });
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = items[items.length - 1];
            if (active === current && force !== true) return;
            current = active;
            links.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
            if (active) {
                active.a.classList.add("is-active");
                active.a.setAttribute("aria-current", "true");
                var left = active.a.offsetLeft - 16;
                list.scrollTo({ left: left, behavior: reduce ? "auto" : "smooth" });
            }
            place(active && active.a);
        }
        function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
        window.addEventListener("scroll", queue, { passive: true });
        window.addEventListener("resize", function () { update(true); });
        links.forEach(function (a) { a.addEventListener("click", function () { place(a); }); });
        update(true);
    }
    window.wbInitTabs = initTabs;
    document.querySelectorAll(".wb-tabs:not([hidden])").forEach(initTabs);

    /* ---- scroll reveal ----
       Content is visible by default; the hidden start state only applies
       once this script has added .wb-reveal-on to <html>. */
    var REVEAL = ".wb-section-head, .wb-tile, .wb-card, .wb-prod, .wb-slot, .wb-cat__title, .wb-news, .wb-about-strip > *, .wb-box, .wb-contact > *, .wb-keep__head, .wb-legal, .wb-prose > h2";
    var io = null;
    if (!reduce && "IntersectionObserver" in window) {
        document.documentElement.classList.add("wb-reveal-on");
        var alive = false;
        io = new IntersectionObserver(function (entries) {
            alive = true;
            entries.forEach(function (en) {
                if (en.isIntersecting) { done(en.target); io.unobserve(en.target); }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
        /* safety net: if the observer never reports (odd embeds, old engines), show everything */
        setTimeout(function () {
            if (alive) return;
            io.disconnect(); io = null;
            document.documentElement.classList.remove("wb-reveal-on");
        }, 1500);
    }
    /* after the entrance, hand the element back to its own hover styles */
    function done(n) {
        n.classList.add("is-in");
        var wait = 650 + (parseInt(n.style.getPropertyValue("--wb-stagger"), 10) || 0);
        setTimeout(function () { n.removeAttribute("data-reveal"); n.classList.remove("is-in"); n.style.removeProperty("--wb-stagger"); }, wait);
    }
    function reveal(root) {
        if (!io) return;
        var seen = new Map();
        (root || document).querySelectorAll(REVEAL).forEach(function (n) {
            if (n.__wbr) return;
            n.__wbr = true;
            var i = seen.get(n.parentNode) || 0;
            seen.set(n.parentNode, i + 1);
            n.setAttribute("data-reveal", "");
            n.style.setProperty("--wb-stagger", (Math.min(i, 5) * 70) + "ms");
            io.observe(n);
        });
    }
    window.wbReveal = reveal;
    reveal(document);

    /* ---- hero parallax (photo drifts slower than the page) ---- */
    var media = document.querySelector("[data-parallax]");
    if (media && !reduce) {
        var ticking = false;
        window.addEventListener("scroll", function () {
            if (ticking) return; ticking = true;
            requestAnimationFrame(function () {
                ticking = false;
                var y = window.scrollY;
                if (y < window.innerHeight * 1.2) media.style.transform = "translate3d(0," + (y * 0.18).toFixed(1) + "px,0)";
            });
        }, { passive: true });
    }

    /* ---- outbound product clicks -> Vercel Analytics custom event.
       window.va only exists after the visitor accepted analytics
       cookies (js/consent.js), so nothing is sent without consent. ---- */
    document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a[data-product-id]");
        if (!a || typeof window.va !== "function") return;
        window.va("event", { name: "product_click", data: { product_id: a.dataset.productId, category: a.dataset.category, section: a.dataset.section } });
    });
})();
