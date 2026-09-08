/* =========================================================
   HOMEPAGE LATEST ARTICLES (Supabase)

   Runs only on index.html. Fetches the 2 most recently
   published articles from Supabase and replaces the static
   "Latest From Ben" cards with real ones, so the homepage
   always reflects the newest published content instead of
   staying stuck on whichever article was hand-written into
   the HTML at launch.

   If fewer than 2 published articles exist, the remaining
   slot keeps the "more articles coming soon" filler card.
   Any error/empty result degrades silently to the existing
   static markup already in the page — no user-facing error
   needed.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const grid =
        document.querySelector(".articles-grid--pair");

    if (!grid || typeof supabaseClient === "undefined") {
        return;
    }


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

        card.className = "article-card";

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


    function buildSoonCard() {

        const card = document.createElement("article");

        card.className = "article-card article-card-soon";

        card.innerHTML = `
            <span class="article-card-soon-icon">🌿</span>
            <h3>More Articles Coming Soon</h3>
            <p>
                Ben is working on new gardening, landscaping and
                DIY guides. Check back soon or browse the blog
                for what's already live.
            </p>
            <a href="blogs.html" class="read-more">Browse the Blog →</a>
        `;

        return card;

    }


    supabaseClient
        .from("articles")
        .select("slug,title,excerpt,category,cover_image_url,cover_image_alt,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(2)
        .then(({ data, error }) => {

            if (error || !data || data.length === 0) {

                if (error) {
                    console.warn("Could not load latest articles from Supabase:", error.message);
                }

                return;

            }

            grid.innerHTML = "";

            data.forEach((article) => {
                grid.appendChild(buildCard(article));
            });

            if (data.length < 2) {
                grid.appendChild(buildSoonCard());
            }

        })
        .catch((error) => {

            console.warn("Could not load latest articles from Supabase:", error);

        });

});
