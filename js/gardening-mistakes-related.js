/* =========================================================
   RELATED ARTICLES for the static articles/gardening-mistakes.html
   reference page (Supabase)

   This page predates the Supabase-backed article system, so it
   isn't a row in the `articles` table and has no slug to exclude —
   it just shows real published articles, preferring the gardening
   category, same as the "You Might Also Like" section on the
   dynamic articles/view.html template (see js/article-view.js).
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const section =
        document.querySelector("#related-articles-section");

    const grid =
        document.querySelector("#related-articles-grid");

    if (!section || !grid || typeof supabaseClient === "undefined") {
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

    const currentCategory = "gardening";


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


    const fields =
        "slug,title,excerpt,category,cover_image_url,cover_image_alt,published_at";

    supabaseClient
        .from("articles")
        .select(fields)
        .eq("published", true)
        .eq("category", currentCategory)
        .then(({ data: sameCategory, error: sameCategoryError }) => {

            if (sameCategoryError) {
                console.warn("Could not load related articles:", sameCategoryError.message);
            }

            const picked = shuffle(sameCategory || []).slice(0, 3);

            if (picked.length >= 3) {
                return picked;
            }

            return supabaseClient
                .from("articles")
                .select(fields)
                .eq("published", true)
                .neq("category", currentCategory)
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
                grid.appendChild(buildCard(article));
            });

            section.hidden = false;

        })
        .catch((error) => {

            console.warn("Could not load related articles:", error);

        });

});
