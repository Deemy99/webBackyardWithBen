/* =========================================================
   GUIDES — loads published articles from Supabase.

   /guides      : sticky category tabs + one section per category
                  (same components as Ben's Tools). Categories with
                  no articles are hidden; articles without a known
                  category go into "More guides".
   Home page    : "Latest guides" cards (#home-guides).

   Article URLs stay articles/view.html?slug=...
========================================================= */
(function () {
    "use strict";

    var sections = document.getElementById("guide-sections");
    var home = document.getElementById("home-guides");
    if ((!sections && !home) || typeof supabaseClient === "undefined") return;

    var LABELS = { gardening: "Gardening", "plants-trees": "Plants & Trees", lawn: "Lawn Care", landscaping: "Landscaping", "outdoor-living": "Outdoor Living", bbq: "BBQ & Grilling", diy: "DIY Projects" };
    var ERROR = "Guides could not be loaded right now. Please try again later.";

    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    function icon(id) {
        var wrap = document.createElement("span");
        wrap.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#' + id + '"/></svg>';
        return wrap.firstChild;
    }

    function card(a, showCat) {
        var c = el("article", "wb-card");
        var thumb = el("div", "wb-card__thumb");
        if (a.cover_image_url) {
            var img = document.createElement("img");
            img.src = a.cover_image_url; img.alt = "AI-generated image: " + (a.cover_image_alt || a.title || ""); img.loading = "lazy"; img.decoding = "async"; img.width = 640; img.height = 400;
            thumb.appendChild(img);
            thumb.appendChild(el("span", "wb-ai-badge wb-ai-badge--card", "AI-generated"));
        }
        if (showCat && LABELS[a.category]) thumb.appendChild(el("span", "wb-card__cat", LABELS[a.category]));
        var body = el("div", "wb-card__body");
        var h = el("h3", "wb-card__title");
        var link = el("a", null, a.title);
        link.href = "/articles/view.html?slug=" + encodeURIComponent(a.slug);
        h.appendChild(link); body.appendChild(h);
        if (a.excerpt) body.appendChild(el("p", "wb-card__excerpt", a.excerpt));
        c.appendChild(thumb); c.appendChild(body);
        return c;
    }

    function renderHome(list) {
        var n = parseInt(home.getAttribute("data-limit"), 10) || 3;
        home.textContent = "";
        if (!list.length) { home.appendChild(el("p", "wb-guide-state", "New guides are on the way.")); return; }
        list.slice(0, n).forEach(function (a) { home.appendChild(card(a, true)); });
        if (window.wbReveal) window.wbReveal(home);
    }

    function renderGuides(list) {
        var cats = [];
        try { cats = JSON.parse(document.getElementById("guide-cats").textContent); } catch (e) {}
        var known = {}; cats.forEach(function (c) { known[c.id] = c; });
        var groups = {}, more = [];
        list.forEach(function (a) {
            if (a.category && known[a.category]) (groups[a.category] = groups[a.category] || []).push(a);
            else more.push(a);
        });
        var order = cats.filter(function (c) { return groups[c.id] && groups[c.id].length; })
            .map(function (c) { return { id: c.id, title: c.title, icon: c.icon || "i-leaf", items: groups[c.id] }; });
        if (more.length) order.push({ id: "more-guides", title: "More guides", icon: "i-leaf", items: more });

        sections.textContent = "";
        if (!order.length) { var w = el("div", "wb-container"); w.appendChild(el("p", "wb-guide-state", "New guides are on the way.")); sections.appendChild(w); return; }

        var nav = document.getElementById("guide-tabs"), ul = nav.querySelector("ul");
        ul.textContent = "";
        order.forEach(function (g) {
            var li = el("li"); var a = el("a", null, g.title); a.href = "#" + g.id; li.appendChild(a); ul.appendChild(li);

            var sec = el("section", "wb-cat"); sec.id = g.id; sec.setAttribute("aria-labelledby", g.id + "-h");
            var box = el("div", "wb-container");
            var title = el("div", "wb-cat__title"); title.appendChild(icon(g.icon));
            var h2 = el("h2", null, g.title); h2.id = g.id + "-h"; title.appendChild(h2);
            var grid = el("div", "wb-grid wb-grid--3 wb-grid--guides");
            g.items.forEach(function (a2) { grid.appendChild(card(a2, false)); });
            box.appendChild(title); box.appendChild(grid); sec.appendChild(box); sections.appendChild(sec);
        });
        nav.hidden = false;
        if (window.wbInitTabs) window.wbInitTabs(nav);
        if (window.wbReveal) window.wbReveal(sections);

        /* deep links: /guides#bbq or the old ?category=bbq */
        var want = location.hash.slice(1) || new URLSearchParams(location.search).get("category");
        var target = want && document.getElementById(want);
        if (target && target.classList.contains("wb-cat")) setTimeout(function () { target.scrollIntoView(); }, 50);
    }

    function fail() {
        var msg = el("p", "wb-guide-state", ERROR);
        if (home) { home.textContent = ""; home.appendChild(msg); }
        if (sections) { sections.textContent = ""; var w = el("div", "wb-container"); w.appendChild(msg); sections.appendChild(w); }
    }

    var q = supabaseClient.from("articles")
        .select("slug,title,excerpt,category,cover_image_url,cover_image_alt,published_at")
        .eq("published", true).order("published_at", { ascending: false });
    if (!sections && home) q = q.limit(parseInt(home.getAttribute("data-limit"), 10) || 3);

    q.then(function (res) {
        if (res.error || !res.data) return fail();
        if (home) renderHome(res.data);
        if (sections) renderGuides(res.data);
    }).catch(fail);
})();
