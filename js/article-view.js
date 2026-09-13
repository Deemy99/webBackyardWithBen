/* =========================================================
   ARTICLE VIEW (Supabase)

   Runs only on articles/view.html. Reads ?slug= from the URL,
   fetches that article from Supabase and populates the page's
   title/meta/JSON-LD and body content. Shows a "not found"
   state on any missing/unpublished slug or fetch error.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const contentEl =
        document.querySelector("#article-content");

    const notFoundEl =
        document.querySelector("#article-not-found");

    function showNotFound() {

        if (contentEl) {
            contentEl.hidden = true;
        }

        if (notFoundEl) {
            notFoundEl.hidden = false;
        }

    }

    const slug =
        new URLSearchParams(window.location.search).get("slug");

    if (!slug || typeof supabaseClient === "undefined") {
        showNotFound();
        return;
    }

    /* Set canonical/og:url synchronously from the URL's own slug,
       before the Supabase fetch resolves — so a renderer that reads
       these before the async data arrives still sees the correct
       per-article URL instead of the slug-less placeholder. */
    const earlyPageUrl =
        "https://www.backyardwithben.com/articles/view.html?slug=" +
        encodeURIComponent(slug);

    setMeta("#page-canonical", earlyPageUrl);
    setMeta("#og-url", earlyPageUrl);


    const categoryLabels = {
        gardening: "Gardening",
        "plants-trees": "Plants & Trees",
        lawn: "Lawn Care",
        landscaping: "Landscaping",
        "outdoor-living": "Outdoor Living",
        bbq: "BBQ & Grilling",
        diy: "DIY"
    };


    function escapeHtml(value) {

        const div = document.createElement("div");

        div.textContent = value == null ? "" : String(value);

        return div.innerHTML;

    }


    function shuffle(array) {

        const result = array.slice();

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;

    }


    function buildRelatedCard(article) {

        const categoryLabel =
            categoryLabels[article.category] || article.category;

        const detailUrl =
            "view.html?slug=" + encodeURIComponent(article.slug);

        const card = document.createElement("article");

        card.className = "article-card blog-card";

        const safeTitle = escapeHtml(article.title);
        const safeExcerpt = escapeHtml(article.excerpt);
        const safeAlt = escapeHtml(article.cover_image_alt || article.title);
        const safeImageUrl = escapeHtml(article.cover_image_url);

        card.innerHTML = `
            <a href="${detailUrl}" class="article-image">
                <img
                    src="${safeImageUrl}"
                    alt="${safeAlt}"
                    loading="lazy"
                >
                <span class="article-category">${categoryLabel}</span>
            </a>
            <div class="article-content">
                <span class="article-date">${formatDate(article.published_at)}</span>
                <h3><a href="${detailUrl}">${safeTitle}</a></h3>
                <p>${safeExcerpt}</p>
                <a href="${detailUrl}" class="read-more">Read Article →</a>
            </div>
        `;

        return card;

    }


    function loadRelatedArticles(category, currentSlug) {

        const section = document.querySelector("#related-articles-section");
        const grid = document.querySelector("#related-articles-grid");

        if (!section || !grid) {
            return;
        }

        const fields =
            "slug,title,excerpt,category,cover_image_url,cover_image_alt,published_at";

        supabaseClient
            .from("articles")
            .select(fields)
            .eq("published", true)
            .eq("category", category)
            .neq("slug", currentSlug)
            .then(({ data: sameCategory, error: sameCategoryError }) => {

                if (sameCategoryError) {
                    console.warn("Could not load related articles:", sameCategoryError.message);
                }

                let picked = shuffle(sameCategory || []).slice(0, 3);

                if (picked.length >= 3) {
                    return picked;
                }

                return supabaseClient
                    .from("articles")
                    .select(fields)
                    .eq("published", true)
                    .neq("slug", currentSlug)
                    .neq("category", category)
                    .then(({ data: otherCategory, error: otherCategoryError }) => {

                        if (otherCategoryError) {
                            console.warn("Could not load related articles:", otherCategoryError.message);
                        }

                        const filler =
                            shuffle(otherCategory || []).slice(0, 3 - picked.length);

                        return picked.concat(filler);

                    });

            })
            .then((related) => {

                if (!related || related.length === 0) {
                    return;
                }

                related.forEach((article) => {
                    grid.appendChild(buildRelatedCard(article));
                });

                section.hidden = false;

            })
            .catch((error) => {

                console.warn("Could not load related articles:", error);

            });

    }


    function formatDate(isoString) {

        const date = new Date(isoString);

        if (isNaN(date)) {
            return "";
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    }


    function estimateReadTime(html) {

        const text = (html || "").replace(/<[^>]+>/g, " ");
        const words = text.trim().split(/\s+/).filter(Boolean).length;

        return Math.max(1, Math.round(words / 200));

    }


    function setMeta(selector, value) {

        const el = document.querySelector(selector);

        if (!el) {
            return;
        }

        if (el.tagName === "META") {
            el.setAttribute("content", value);
        } else if (el.tagName === "LINK") {
            el.setAttribute("href", value);
        } else {
            el.textContent = value;
        }

    }


    supabaseClient
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle()
        .then(({ data, error }) => {

            if (error || !data) {
                showNotFound();
                return;
            }

            const categoryLabel =
                categoryLabels[data.category] || data.category;

            const pageUrl =
                "https://www.backyardwithben.com/articles/view.html?slug=" +
                encodeURIComponent(data.slug);

            const description =
                data.meta_description || data.excerpt || "";


            /* Title + meta + OG/Twitter + canonical */

            document.title = data.title + " | Backyard with Ben";

            setMeta("#page-description", description);
            setMeta("#page-canonical", pageUrl);
            setMeta("#og-title", data.title);
            setMeta("#og-description", description);
            setMeta("#og-url", pageUrl);
            setMeta("#twitter-title", data.title);
            setMeta("#twitter-description", description);

            if (data.cover_image_url) {
                setMeta("#og-image", data.cover_image_url);
                setMeta("#twitter-image", data.cover_image_url);
            }


            /* JSON-LD */

            const articleJsonLd = document.querySelector("#article-jsonld");

            if (articleJsonLd) {

                articleJsonLd.textContent = JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: data.title,
                    description: description,
                    image: data.cover_image_url,
                    author: {
                        "@type": "Organization",
                        name: "Backyard with Ben"
                    },
                    publisher: {
                        "@type": "Organization",
                        name: "Backyard with Ben",
                        logo: {
                            "@type": "ImageObject",
                            url: "https://www.backyardwithben.com/assets/images/backyardwithbenprofil.jpg"
                        }
                    },
                    datePublished: data.published_at,
                    mainEntityOfPage: pageUrl
                });

            }

            const breadcrumbJsonLd = document.querySelector("#breadcrumb-jsonld");

            if (breadcrumbJsonLd) {

                breadcrumbJsonLd.textContent = JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.backyardwithben.com/" },
                        { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.backyardwithben.com/blogs.html" },
                        { "@type": "ListItem", position: 3, name: categoryLabel }
                    ]
                });

            }


            /* Visible content */

            const breadcrumbCategory = document.querySelector("#article-breadcrumb-category");
            const categoryBadge = document.querySelector("#article-category-badge");
            const titleEl = document.querySelector("#article-title");
            const leadEl = document.querySelector("#article-lead");
            const dateEl = document.querySelector("#article-date");
            const heroImg = document.querySelector("#article-hero-img");
            const bodyEl = document.querySelector("#article-body-content");

            if (breadcrumbCategory) breadcrumbCategory.textContent = categoryLabel;
            if (categoryBadge) categoryBadge.textContent = categoryLabel;
            if (titleEl) titleEl.textContent = data.title;
            if (leadEl) leadEl.textContent = data.excerpt || "";

            if (dateEl) {

                const readTime =
                    data.read_time_minutes || estimateReadTime(data.content_html);

                dateEl.textContent =
                    formatDate(data.published_at) + " · " + readTime + " min read";

            }

            if (heroImg && data.cover_image_url) {
                heroImg.src = data.cover_image_url;
                heroImg.alt = data.cover_image_alt || data.title;
            }

            const shareFacebookLink = document.querySelector("#article-share-facebook");

            if (shareFacebookLink) {
                shareFacebookLink.href =
                    "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl);
            }

            if (bodyEl) {

                const rawHtml = data.content_html || "";

                bodyEl.innerHTML =
                    (typeof DOMPurify !== "undefined")
                        ? DOMPurify.sanitize(rawHtml)
                        : rawHtml;

            }

            loadRelatedArticles(data.category, data.slug);

        })
        .catch(() => {

            showNotFound();

        });

});
