/* =========================================================
   GET /articles/view.html?slug=...   (rewritten here by vercel.json)

   Old client-rendered article URLs. Answers with a clean 301 to
   /guides/<slug> without the ?slug= query (a vercel.json redirect
   would keep the query string). Unknown slugs end on the real 404
   of /guides/<slug>.
========================================================= */
module.exports = function handler(req, res) {
    const slug = String((req.query && req.query.slug) || "").trim().toLowerCase();
    const location = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? `/guides/${slug}` : "/guides";
    res.setHeader("Location", location);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.statusCode = 301;
    res.end();
};
