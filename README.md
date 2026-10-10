# Backyard with Ben

Static site (plain HTML/CSS/JS) deployed on Vercel. Dark mode only. Articles live in
Supabase and load at `articles/view.html?slug=...` (those URLs are unchanged).

Pages: `/`, `/tools`, `/shop`, `/guides`, `/about`, `/disclosure`. They are **generated** by
`scripts/build.mjs` from `data/*.json`. The generated HTML is committed, so Vercel needs no build step (the script is deliberately named `generate`, not `build`, so Vercel does not try to run it; `.vercelignore` keeps source-only files out of the deploy).

```bash
npm run generate                 # regenerate pages + sitemap, then commit the result
python3 -m http.server 8000   # preview at http://localhost:8000
```

Never edit the generated files by hand. Edit the data, the templates in `scripts/build.mjs`,
or `css/workshop.css` (design tokens at the top).

## Adding or changing products

`data/products.json` is the single source of truth for every product card (`/tools`, `/shop`, the Home rows and
the article product blocks). `_meta` is notes only and is never rendered.

* **Add a product:** copy an existing entry in `products`, give it a new unique `id`, and fill in `asin`, `name`,
  `section` (`tools` or `shop`), `category`, `badge`, `whyWePickIt` and `url`. Keep `?tag=backyardwithb-20` at the
  end of the `url` (a direct `https://www.amazon.com/dp/ASIN?tag=backyardwithb-20` link, no shorteners).
* **Categories** (use an existing id, cards show in JSON order):
  * Tools: `power-tools`, `sanding-finishing`, `hand-tools-measuring`, `clamps-joinery`, `safety-gear`, `starter-kit`
  * Shop: `planters`, `raised-beds`, `lighting`, `fire-pits`, `furniture`, `decor`
  * Titles, order and icons come from `data/catalog.json`. A category with no products shows "Coming soon" cards.
* **Home rows:** `collections.homeEssentials` ("Our essentials") and `collections.shopTeaser` ("Shop the look") are
  lists of product ids.
* **Article blocks:** in `data/article-seo.json`, an article can have
  `"products": [{ "title": "Tools for this guide", "ids": ["..."] }, { "title": "Don't want to build it?", "ids": ["..."] }]`.
  Leave it out when no product clearly fits the topic.
* **Type label + icon** in the card's media area come from `data/product-types.json` (`"id": { "type": "Cordless drill", "icon": "p-drill" }`).
  Icons are in `data/product-icons.mjs`. A new product without an entry falls back to the category icon (the build prints a warning).
* The whole card is clickable: it still has one link (the button), stretched over the card with CSS.
* `badge`: `Top pick`, `Budget pick`, `Upgrade pick`, `Best for beginners` or `null`.
* **Images:** `imageSource` is `"icon"` for now (the card shows the category icon). To switch a product to the
  official Amazon image later (Product Advertising API), set `"imageSource": "amazon-api"` and add
  `"image": "https://m.media-amazon.com/images/I/..."`. Any other host is ignored and the icon is shown.

**Rules:**
* **No prices**, price ranges or "deal" claims anywhere. The button only says "Check price on Amazon".
* **No edited or AI-generated product images.** Only the official Amazon API image, or the icon.
* **No first-hand claims** in `whyWePickIt`: only verifiable reasons (rating, review count, specs, value, fit for
  our guides). Nobody behind the site tests products and Emma is an AI-generated host.
* Product links are rendered with `target="_blank"` and `rel="sponsored nofollow noopener noreferrer"` by
  `productCard()` in `scripts/build.mjs`. Don't hand-write product links anywhere else.
* With analytics consent, a click on a product button sends a Vercel Analytics `product_click` event
  (`product_id`, `category`, `section`), see `js/site.js`.

Run `npm run generate` afterwards (it also writes `data/product-cards.json` for the article blocks).

## Guides

Articles are published with `scripts/publish-article.mjs` (see `scripts/README.md`). `/guides` builds a sticky
tab bar and one section per category from the published articles (categories without articles are hidden,
uncategorised ones go to "More guides"). Category titles and order come from `guideCategories` in `data/catalog.json`.

Redirects (`vercel.json`): `/projects`, `/projects/*`, `blogs.html` -> `/guides`; `about.html` -> `/about`;
`affiliate-disclosure.html` -> `/disclosure`; `index.html` -> `/`.

## Article SEO

Articles are rendered in the browser from Supabase. Per-article SEO lives in `data/article-seo.json`
(keyed by slug): `seoTitle`, `metaDescription`, `h1`, `lead`, `imageAlt`, `related` (3 slugs), `replace`
(text fixes), `products` (the "Tools for this guide" blocks, see above). Edit that file, no database access needed.
`js/article-view.js` also builds Article, BreadcrumbList and FAQPage schema. `articles/gardening-mistakes.html`
is an alias that shows the same guide as `gardening-mistakes-time-money-blooms` (canonical points to that one).

## Cookies, newsletter, logo

* `js/consent.js` is the cookie banner. Optional scripts are written as `<script type="text/plain" data-consent="analytics|marketing" ...>`
  and only run after consent (Vercel Analytics is wired this way in `scripts/build.mjs`). Add a Facebook Pixel as a `marketing` script.
* The newsletter is one component (`newsletterHtml()` in `scripts/build.mjs`, `js/newsletter.js`), used on every page.
* The navbar logo is made from `assets/images/backyardwithbenLOGOaNAZEV.png` (untouched) with `scripts/make-logo.mjs`
  (needs `npm i --no-save sharp`; colors come from the CSS tokens).

## AI content

Emma is an AI-generated host, not a real person. Every image of her has an "AI-generated" label and an alt text starting with "AI-generated image of Emma, the Backyard with Ben host, …". Guide cover images are AI-generated too and get the same label and an "AI-generated image:" alt prefix (done in `js/guides.js` and `js/article-view.js`). Article schema uses the organization "Backyard with Ben" as author.

## Images

`assets/images/uvodwoman.png` (home hero) and `profilewoman.png` (About) are the owner's originals.
The site serves responsive WebP copies (`uvodwoman-640/960/1280/1672.webp`, `profilewoman-320/480/640/960.webp`),
made with `cwebp -q 78 -resize <width> 0 <file>.png -o <file>-<width>.webp`.

## Still to do before going live

* Products and affiliate links.
