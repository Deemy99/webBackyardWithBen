# Backyard with Ben

Static site (plain HTML/CSS/JS) on Vercel. Dark mode only. **Vercel builds it**: the build command
`npm run build` runs `scripts/build.mjs`, which reads `data/*.json` and every published article from
Supabase and writes the whole site to `dist/` (not committed). Every page, including each guide, is
complete HTML without JavaScript.

| URL | Made from |
| --- | --- |
| `/`, `/tools`, `/shop`, `/about`, `/disclosure`, `/contact`, `/privacy`, `/terms`, `/404.html` | `scripts/build.mjs` + `data/*.json` |
| `/guides` (all guides by category), `/guides/<slug>` (one page per article) | Supabase `articles` table (published rows) |
| `/checklists/beginner-tool-checklist`, `/checklists/lawn-care-calendar` | `CHECKLISTS` in `scripts/build.mjs` |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt` | generated on every build |

```bash
npm install
npm run build                      # writes dist/
npm run preview                    # build + serve dist/ at http://localhost:3000
ARTICLES_JSON=rows.json npm run build   # offline build from a JSON export of the articles table
```

The build **fails** if Supabase returns 0 published articles, so an empty guides section is never deployed.
Never edit `dist/`. Edit the data, the templates in `scripts/build.mjs`, or `css/workshop.css` (design tokens at the top).

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

Push the change: Vercel rebuilds the site (`npm run build` locally to check it first).

## Guides

Articles live in Supabase (source of truth) and are published with `scripts/publish-article.mjs`, edited
with `scripts/update-articles.mjs` (both local-only, see `scripts/README.md`). `/guides` has a sticky tab bar
and one section per category (empty categories hidden, unknown ones under "More guides"). Category titles,
icons and order come from `guideCategories` in `data/catalog.json`.

**Database fields used:** `title` (H1 and card title), `excerpt` (lead under the H1 and card text),
`meta_description`, `cover_image_url`, `cover_image_alt` (without the "AI-generated image of" prefix, the build
adds it), `content_html` (sanitized at build time with `sanitize-html`), `published_at`, `updated_at`
(shown as "Updated …" and used for the sitemap `lastmod`).

**`data/article-seo.json`** (keyed by slug) only holds what the table has no column for: `seoTitle` (the
`<title>` tag, 50–60 characters), `primaryKeyword` (notes), `related` (3 slugs for "Keep going") and
`products` (the "Tools for this guide" blocks, see above).

**Article HTML** uses these classes: `article-quick-answer` (h2 "Quick answer" + p), `article-intro`,
`article-takeaways`, `article-section` + `article-number`, `article-tip` (`<strong>Pro tip</strong>`),
`article-conclusion`, `article-faq` with `article-faq-item` (`<h3>` question + `<p>` answer: this becomes
FAQPage schema), `article-tags`. Tables are fine (`<thead>`, `<th scope="col">`).

**Cover images:** run `node scripts/make-article-images.mjs` (needs sharp, see the file) to make
`/assets/images/articles/<slug>-640/960/1280/1672.webp` + `<slug>-og.jpg` from the current cover, then set
`cover_image_url` to `/assets/images/articles/<slug>-1280.webp`. The build adds the `srcset` and uses the
`-og.jpg` as the share image. Original files are kept so old image URLs keep working. To redo a slug's images,
delete its `<slug>-*` files first.

**Redirects** (`vercel.json`): old `/articles/view.html?slug=X` URLs get a clean **301** to `/guides/X` from
`api/legacy-article.js` (a `vercel.json` redirect would keep the `?slug=` query); `/articles/view.html` -> `/guides`;
`/articles/gardening-mistakes.html` -> `/guides/gardening-mistakes-time-money-blooms`; `/projects`, `blogs.html`
-> `/guides`; `about.html` -> `/about`; `affiliate-disclosure.html` -> `/disclosure`; `index.html` -> `/`.
`trailingSlash: false` redirects `/guides/x/` to `/guides/x`. Unknown `/guides/<slug>` returns a real 404.

## SEO and AI search

* Every page: unique title + meta description, self-canonical, OG/Twitter tags, one H1.
* JSON-LD: Organization + WebSite (Home), BreadcrumbList (inner pages), ItemList of product names and links
  (`/tools`, `/shop`; no Product/Review markup: we don't sell or review the products), CollectionPage (`/guides`),
  Article + BreadcrumbList + FAQPage (guides).
* `robots.txt` allows everyone and names the search/AI crawlers explicitly (`CRAWLERS` in `scripts/build.mjs`).
* Organization `sameAs`: `ORG_LD` in `scripts/build.mjs`. Add real profiles (Pinterest, …) there once they exist.
* See `AI-VISIBILITY-REPORT.md` and `OFF-PAGE-SEO-PLAN.md`.

## Owner steps (do these yourself)

### 1. Auto-rebuild when an article changes (Vercel Deploy Hook + Supabase webhook)

1. **Vercel:** open the project → **Settings** → **Git** → **Deploy Hooks**. Name: `supabase-articles`,
   branch: `main` → **Create Hook**. Copy the URL (`https://api.vercel.com/v1/integrations/deploy/...`).
   Treat it like a password: anyone with it can trigger deploys. Don't put it in the repo.
2. **Supabase:** open the project → **Database** → **Webhooks** (enable it if asked) → **Create a new hook**.
   * Name: `rebuild-site`
   * Table: `articles`
   * Events: tick **Insert**, **Update** and **Delete**
   * Type: **HTTP Request**, Method: **POST**, URL: the deploy hook URL from step 1
   * Leave headers/params empty → **Create webhook**.
3. Test: change one character of an article's excerpt in Supabase (Table editor) and save. In Vercel →
   **Deployments** a new deployment should start within seconds and be live in 1–2 minutes. Change it back
   (that triggers another deploy, which is fine).

Every edit triggers one build. When you edit many rows at once you'll see several deployments; Vercel
builds them one after another and the last one wins.

### 2. Google Search Console

1. Open https://search.google.com/search-console and pick the `backyardwithben.com` property.
2. **Sitemaps** → remove the old sitemap if it is listed with errors, then submit `sitemap.xml`
   (`https://www.backyardwithben.com/sitemap.xml`).
3. **URL Inspection**: paste 3–5 guide URLs (e.g. `https://www.backyardwithben.com/guides/raised-garden-bed`),
   click **Test live URL** to check the page is found and the full text is visible, then **Request indexing**.
4. **Indexing → Pages**: open the reasons ("Duplicate, Google chose different canonical", "Crawled – currently
   not indexed", "Soft 404" …) and click **Validate fix** on each one that was about the old `view.html` pages.
   Old `view.html?slug=` URLs will show up as "Page with redirect": that is expected.

### 3. Bing Webmaster Tools (also used by ChatGPT search and Copilot)

1. Open https://www.bing.com/webmasters and sign in.
2. Easiest: **Import from Google Search Console** (verifies the site and imports the sitemap in one go).
   Or **Add site** manually → choose **HTML Meta Tag** → copy only the `content` value of the
   `msvalidate.01` tag, paste it into `BING_VERIFY` in `scripts/build.mjs`, commit and push, then click **Verify**.
3. **Sitemaps** → submit `https://www.backyardwithben.com/sitemap.xml`.

## Cookies, newsletter, logo

* `js/consent.js` is the cookie banner. Optional scripts are written as `<script type="text/plain" data-consent="analytics|marketing" ...>`
  and only run after consent (Vercel Analytics is wired this way in `scripts/build.mjs`). Add a Facebook Pixel as a `marketing` script.
* The newsletter is one component (`newsletterHtml()` in `scripts/build.mjs`, `js/newsletter.js`), used on every page.
* The navbar logo is made from `assets/images/backyardwithbenLOGOaNAZEV.png` (untouched) with `scripts/make-logo.mjs`
  (needs `npm i --no-save sharp`; colors come from the CSS tokens).

## AI content

Emma is an AI-generated host, not a real person. Every image of her has an "AI-generated" label and an alt text starting with "AI-generated image of Emma, the Backyard with Ben host, …". Guide cover images are AI-generated too and get the same label and an "AI-generated image of …" alt prefix (added by `aiAlt()` in `scripts/build.mjs`). Article schema uses the organization "Backyard with Ben" as author.

## Images

`assets/images/uvodwoman.png` (home hero) and `profilewoman.png` (About) are the owner's originals.
The site serves responsive WebP copies (`uvodwoman-640/960/1280/1672.webp`, `profilewoman-320/480/640/960.webp`),
made with `cwebp -q 78 -resize <width> 0 <file>.png -o <file>-<width>.webp`.

Guide covers: see "Cover images" under Guides.
