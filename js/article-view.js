/* =========================================================
   ARTICLE VIEW (Supabase)

   articles/view.html?slug=...  (and the legacy alias
   articles/gardening-mistakes.html) fetch the article from
   Supabase and fill in the page. SEO details per article
   (title tag, meta description, H1, lead, image alt, related
   guides) come from /data/article-seo.json when present.
   Also builds Article, BreadcrumbList and FAQPage JSON-LD.
========================================================= */
(function () {
    "use strict";

    var SITE = "https://www.backyardwithben.com";
    var ALIASES = { "/articles/gardening-mistakes.html": "gardening-mistakes-time-money-blooms" };
    var LABELS = { gardening: "Gardening", "plants-trees": "Plants & Trees", lawn: "Lawn Care", landscaping: "Landscaping", "outdoor-living": "Outdoor Living", bbq: "BBQ & Grilling", diy: "DIY Projects" };

    var content = document.getElementById("article-content");
    var notFound = document.getElementById("article-not-found");
    var slug = new URLSearchParams(location.search).get("slug") || ALIASES[location.pathname];

    function $(id) { return document.getElementById(id); }
    function setMeta(id, value) {
        var n = $(id); if (!n) return;
        if (n.tagName === "META") n.setAttribute("content", value);
        else if (n.tagName === "LINK") n.setAttribute("href", value);
    }
    function showNotFound() {
        if (content) content.hidden = true;
        if (notFound) notFound.hidden = false;
        var r = document.createElement("meta"); r.name = "robots"; r.content = "noindex, follow"; document.head.appendChild(r);
        document.title = "Guide not found | Backyard with Ben";
    }
    function jsonLd(obj) {
        var s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(obj); document.head.appendChild(s);
    }
    function fmtDate(iso) {
        var d = new Date(iso); if (isNaN(d)) return "";
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    /* all guide cover images are AI-generated: say so in the alt text */
    function aiAlt(t) { t = t || ""; return /^AI-generated/i.test(t) ? t : "AI-generated image: " + t; }
    function readTime(html) { return Math.max(1, Math.round((html || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length / 200)); }

    if (!slug || typeof supabaseClient === "undefined") { showNotFound(); return; }

    var pageUrl = SITE + "/articles/view.html?slug=" + encodeURIComponent(slug);
    setMeta("page-canonical", pageUrl);
    setMeta("og-url", pageUrl);

    var seoReq = fetch("/data/article-seo.json").then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    var artReq = supabaseClient.from("articles").select("*").eq("slug", slug).eq("published", true).maybeSingle();

    Promise.all([artReq, seoReq]).then(function (res) {
        var data = res[0].data, seo = (res[1] || {})[slug] || {};
        if (res[0].error || !data) { showNotFound(); return; }

        var cat = LABELS[data.category] || data.category;
        var title = seo.seoTitle || (data.title + " | Backyard with Ben");
        var h1 = seo.h1 || data.title;
        var desc = seo.metaDescription || data.meta_description || data.excerpt || "";
        var lead = seo.lead || data.excerpt || "";
        var img = data.cover_image_url || "";
        var alt = aiAlt(seo.imageAlt || data.cover_image_alt || data.title);

        /* head */
        document.title = title;
        setMeta("page-description", desc);
        setMeta("og-title", title.replace(/ \| Backyard with Ben$/, ""));
        setMeta("og-description", desc);
        setMeta("twitter-title", title.replace(/ \| Backyard with Ben$/, ""));
        setMeta("twitter-description", desc);
        if (img) {
            var abs = img.indexOf("http") === 0 ? img : SITE + img;
            setMeta("og-image", abs); setMeta("twitter-image", abs);
        }

        /* visible header */
        $("article-breadcrumb-category").textContent = cat;
        $("article-breadcrumb-category").href = "/guides#" + data.category;
        var pill = $("article-category-badge"); pill.textContent = cat; pill.href = "/guides#" + data.category;
        $("article-title").textContent = h1;
        $("article-lead").textContent = lead;
        $("article-date").textContent = fmtDate(data.published_at) + " · " + (data.read_time_minutes || readTime(data.content_html)) + " min read";
        var hero = $("article-hero-img");
        if (img) { hero.src = img; hero.alt = alt; } else hero.parentNode.hidden = true;

        /* body */
        var html = data.content_html || "";
        (seo.replace || []).forEach(function (p) { html = html.split(p[0]).join(p[1]); });
        var body = $("article-body-content");
        body.innerHTML = (typeof DOMPurify !== "undefined") ? DOMPurify.sanitize(html) : html;
        body.querySelectorAll(".article-tip strong").forEach(function (n) { if (/^Ben.s Tip$/i.test(n.textContent.trim())) n.textContent = "Pro tip"; });
        body.querySelectorAll(".article-tags a").forEach(function (a) {
            var m = (a.getAttribute("href") || "").match(/category=([a-z-]+)/);
            a.setAttribute("href", m ? "/guides#" + m[1] : "/guides");
        });

        /* FAQ schema from the article's own FAQ section */
        var faq = [];
        body.querySelectorAll(".article-faq-item").forEach(function (item) {
            var q = item.querySelector("h3"), a = item.querySelector("p");
            if (q && a) faq.push({ "@type": "Question", name: q.textContent.trim(), acceptedAnswer: { "@type": "Answer", text: a.textContent.trim() } });
        });
        if (faq.length) jsonLd({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq });
        jsonLd({
            "@context": "https://schema.org", "@type": "Article",
            headline: h1, description: desc, image: img ? [img.indexOf("http") === 0 ? img : SITE + img] : undefined,
            author: { "@type": "Organization", name: "Backyard with Ben", url: SITE + "/" },
            publisher: { "@type": "Organization", name: "Backyard with Ben", logo: { "@type": "ImageObject", url: SITE + "/assets/images/logo-dark-master.png" } },
            datePublished: data.published_at, dateModified: data.updated_at || data.published_at,
            mainEntityOfPage: pageUrl, articleSection: cat
        });
        jsonLd({
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
                { "@type": "ListItem", position: 2, name: "Guides", item: SITE + "/guides" },
                { "@type": "ListItem", position: 3, name: cat, item: SITE + "/guides#" + data.category },
                { "@type": "ListItem", position: 4, name: h1 }
            ]
        });

        /* extras */
        var fb = $("article-share-facebook");
        if (fb) fb.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl);
        if (seo.products && seo.products.length) loadProducts(seo.products);

        loadRelated(data, seo);
    }).catch(showNotFound);

    /* "Tools for this guide": groups of product ids from article-seo.json,
       card HTML pre-rendered by scripts/build.mjs into product-cards.json */
    function loadProducts(groups) {
        var box = $("article-tools"), wrap = $("article-tools-groups");
        if (!box || !wrap) return;
        fetch("/data/product-cards.json").then(function (r) { return r.ok ? r.json() : {}; }).then(function (cards) {
            groups.forEach(function (g, i) {
                var html = (g.ids || []).map(function (id) { return cards[id] || ""; }).join("");
                if (!html) return;
                var h = document.createElement("h2"); h.id = "gtools-h-" + i;
                h.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#' + (i === 0 && /^Tools/.test(g.title) ? "i-drill" : "i-pot") + '"/></svg> ';
                h.appendChild(document.createTextNode(g.title));
                var grid = document.createElement("div"); grid.className = "wb-prodgrid wb-prodgrid--guide"; grid.innerHTML = html;
                wrap.appendChild(h); wrap.appendChild(grid);
            });
            if (wrap.children.length) box.hidden = false;
        }).catch(function () {});
    }

    function card(a) {
        var c = document.createElement("article"); c.className = "wb-card";
        var thumb = document.createElement("div"); thumb.className = "wb-card__thumb";
        if (a.cover_image_url) {
            var i = document.createElement("img"); i.src = a.cover_image_url; i.alt = aiAlt(a.cover_image_alt || a.title || ""); i.loading = "lazy"; i.decoding = "async"; i.width = 640; i.height = 400; thumb.appendChild(i);
        }
        var ai = document.createElement("span"); ai.className = "wb-ai-badge wb-ai-badge--card"; ai.textContent = "AI-generated"; thumb.appendChild(ai);
        var span = document.createElement("span"); span.className = "wb-card__cat"; span.textContent = LABELS[a.category] || a.category; thumb.appendChild(span);
        var body = document.createElement("div"); body.className = "wb-card__body";
        var h = document.createElement("h3"); h.className = "wb-card__title";
        var l = document.createElement("a"); l.href = "/articles/view.html?slug=" + encodeURIComponent(a.slug); l.textContent = a.title; h.appendChild(l);
        var p = document.createElement("p"); p.className = "wb-card__excerpt"; p.textContent = a.excerpt || "";
        body.appendChild(h); body.appendChild(p); c.appendChild(thumb); c.appendChild(body);
        return c;
    }

    function loadRelated(data, seo) {
        var grid = $("related-articles-grid");
        if (!grid) return;
        var fields = "slug,title,excerpt,category,cover_image_url,cover_image_alt,published_at";
        var q = (seo.related && seo.related.length)
            ? supabaseClient.from("articles").select(fields).eq("published", true).in("slug", seo.related)
            : supabaseClient.from("articles").select(fields).eq("published", true).eq("category", data.category).neq("slug", data.slug).limit(3);
        q.then(function (r) {
            var list = (r.data || []);
            if (seo.related) list.sort(function (a, b) { return seo.related.indexOf(a.slug) - seo.related.indexOf(b.slug); });
            list.forEach(function (a) { grid.appendChild(card(a)); });
            if (window.wbReveal) window.wbReveal(grid);
        }).catch(function () {});
    }
})();
