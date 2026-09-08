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


    const categoryLabels = {
        gardening: "Gardening",
        lawn: "Lawn Care",
        landscaping: "Landscaping",
        "outdoor-living": "Outdoor Living",
        bbq: "BBQ & Grilling",
        diy: "DIY"
    };


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

            if (bodyEl) {

                const rawHtml = data.content_html || "";

                bodyEl.innerHTML =
                    (typeof DOMPurify !== "undefined")
                        ? DOMPurify.sanitize(rawHtml)
                        : rawHtml;

            }

        })
        .catch(() => {

            showNotFound();

        });

});
