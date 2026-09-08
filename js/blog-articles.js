/* =========================================================
   BLOG ARTICLES (Supabase)

   Runs only on blogs.html. Fetches published articles from
   Supabase and generates .article-card.blog-card elements
   matching the site's existing hand-written card markup, so
   the category filter / live search in js/main.js (which
   just queries .blog-card and reads data-category/data-title)
   keeps working unmodified against them.

   Inserted cards go before the "coming soon" filler cards so
   those always stay last. Any error/empty result degrades
   silently to today's static state (1 real article + 2
   filler cards) — no user-facing error needed.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const grid =
        document.querySelector(".blog-articles-grid");

    if (!grid || typeof supabaseClient === "undefined") {
        return;
    }


    const categoryLabels = {
        gardening: "Gardening",
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


    function buildCard(article) {

        const categoryLabel =
            categoryLabels[article.category] || article.category;

        const detailUrl =
            "articles/view.html?slug=" + encodeURIComponent(article.slug);

        const card = document.createElement("article");

        card.className = "article-card blog-card";
        card.dataset.category = article.category;
        card.dataset.title = (article.title || "").toLowerCase();

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


    supabaseClient
        .from("articles")
        .select("slug,title,excerpt,category,cover_image_url,cover_image_alt,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .then(({ data, error }) => {

            if (error || !data || data.length === 0) {

                if (error) {
                    console.warn("Could not load articles from Supabase:", error.message);
                }

                return;

            }

            const soonCard =
                grid.querySelector(".article-card-soon");

            data.forEach((article) => {

                const card = buildCard(article);

                if (soonCard) {
                    grid.insertBefore(card, soonCard);
                } else {
                    grid.appendChild(card);
                }

            });

        })
        .catch((error) => {

            console.warn("Could not load articles from Supabase:", error);

        })
        .finally(() => {

            document.dispatchEvent(new CustomEvent("blog:cards-loaded"));

        });

});
