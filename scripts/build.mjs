#!/usr/bin/env node
/* =========================================================
   scripts/build.mjs — static site build (Vercel build command)

   Reads data/*.json and every published article from Supabase
   (read-only, public key) and writes the whole site to dist/:

     index.html                    home (latest guides prerendered)
     tools/, shop/, about/, disclosure/
     guides/index.html             all guides, grouped by category
     guides/<slug>/index.html      one full page per article
     contact.html, privacy.html, terms.html, 404.html
     sitemap.xml, robots.txt, llms.txt, llms-full.txt
     + the static files (css, js, assets, ads.txt)

   Every page is complete without JavaScript. Fails (exit 1)
   when Supabase returns no articles, so an empty guides
   section is never deployed. Dark mode only.

   Run:  npm run build      (dist/ is not committed)
========================================================= */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sanitizeHtml from "sanitize-html";
import { PRODUCT_ICONS } from "../data/product-icons.mjs";
import { fetchPublishedArticles } from "./lib/articles.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE = "https://www.backyardwithben.com";
const FB_URL = "https://www.facebook.com/profile.php?id=61593709666852";
const LOGO = "/assets/images/backyardwithbenprofil.jpg";
const SITE_OG = "/assets/images/og-image.jpg";
const BRAND_DESC = "Backyard with Ben is a DIY and outdoor living site with top-rated tool picks, finished pieces to buy and practical guides on gardening, lawns, landscaping, grilling and backyard projects. Its host, Emma, is AI-generated.";

const ORG_LD = {
    "@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#organization",
    name: "Backyard with Ben", url: SITE + "/", description: BRAND_DESC,
    logo: { "@type": "ImageObject", url: SITE + "/assets/images/logo-dark-master.png" },
    email: "ben@backyardwithben.com", sameAs: [FB_URL]
};
/* author/publisher on Article schema (no person: the host is AI-generated) */
const ORG_REF = { "@type": "Organization", "@id": SITE + "/#organization", name: "Backyard with Ben", url: SITE + "/" };

const readJson = (f) => JSON.parse(readFileSync(join(ROOT, f), "utf-8"));
const productData = readJson("data/products.json");   /* { _meta, collections, products } */
const products = productData.products || [];
const collections = productData.collections || {};
const catalog = readJson("data/catalog.json");
const productById = new Map(products.map((p) => [p.id, p]));
const productTypes = readJson("data/product-types.json");   /* id -> { type, icon } */
for (const p of products) if (!productTypes[p.id]) console.warn(`! no type/icon for product "${p.id}" in data/product-types.json (category icon used)`);
const catIcon = new Map([...catalog.toolCategories, ...catalog.shopCategories].map((c) => [c.id, c.icon]));

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const write = (rel, content) => {
    const file = join(DIST, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
};

/* ---------------------------------------------------------
   ICONS (inline SVG sprite, stroke style, 24x24)
--------------------------------------------------------- */
const ICONS = {
    "i-arrow": '<path d="M4 12h15M13 6l6 6-6 6"/>',
    "i-menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "i-close": '<path d="M6 6l12 12M18 6L6 18"/>',
    "i-hammer": '<path d="M14 5l5 5-2 2-5-5z"/><path d="M13 8L4.5 16.5a1.8 1.8 0 002.5 2.5L15.5 10.5"/><path d="M10 4l4-1 6 6-1 4"/>',
    "i-facebook": '<path d="M14 8.5h2.5V5H14c-2.2 0-3.5 1.5-3.5 3.7V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9.2c0-.5.2-.7.7-.7z" fill="currentColor" stroke="none"/>',
    "i-drill": '<path d="M3 8h11a3 3 0 013 3v1H8l-1 6H4l1-6V8z"/><path d="M17 10h4M17 13h3"/>',
    "i-brush": '<path d="M4 20c0-3 2-4 3.5-4S10 17 10 18.5 8 21 4 20z"/><path d="M10 15l8.5-9a1.6 1.6 0 012.3 2.3L12 17"/>',
    "i-tape": '<rect x="3" y="7" width="18" height="10" rx="3"/><path d="M7 7v4m3-4v2m3-2v4m3-4v2"/>',
    "i-clamp": '<path d="M6 4h9v3H9v10h6v3H6z"/><path d="M15 12h5M17.5 9.5v5"/>',
    "i-shield": '<path d="M12 3l7.5 3v5.5c0 4.4-3 7.7-7.5 9.5-4.5-1.8-7.5-5.1-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    "i-pot": '<path d="M5 9h14l-1.5 10.5a1.5 1.5 0 01-1.5 1.3H8a1.5 1.5 0 01-1.5-1.3z"/><path d="M12 9V5m0 2c-1-2-3-2.5-4.5-2 .3 1.7 2 2.7 4.5 2zm0 0c1-2 3-2.5 4.5-2-.3 1.700-2 2.700-4.500 2z"/>',
    "i-bed": '<rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M3 13h18M7 9V6m5 3V5m5 4V6"/>',
    "i-lamp": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0012 3z"/>',
    "i-fire": '<path d="M12 21c-3.900 0-6.500-2.500-6.500-6 0-3 2-4.500 3-7 1.500 1 2 2 2 3.500 1.500-1 2.500-3.500 2-6.500 3.500 2 6 5.500 6 10 0 3.500-2.600 6-6.500 6z"/>',
    "i-chair": '<path d="M7 11V5a1.500 1.500 0 011.500-1.500h7A1.500 1.500 0 0117 5v6"/><path d="M5 11h14v4H5zM7 15l-1 5m12-5l1 5"/>',
    "i-leaf": '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c2-4 5-7 9-9"/>',
    "i-tool": '<path d="M14.500 6.500a4 4 0 005 5l-2 .5-7.600 7.600a2 2 0 01-2.800-2.800L14.700 9z"/><path d="M5 5l3 3M8 3L3 8"/>',
    "i-info": '<circle cx="12" cy="12" r="8.500"/><path d="M12 11v5m0-8v.01"/>',
    "i-tree": '<path d="M12 21v-6"/><path d="M12 15c-3.500 0-6-2.200-6-5 0-1.700.9-3 2.200-3.800C8.500 4.500 10 3 12 3s3.500 1.500 3.800 3.200C17.100 7 18 8.300 18 10c0 2.800-2.500 5-6 5z"/>',
    "i-grill": '<path d="M5 10h14a7 7 0 01-14 0z"/><path d="M8 17l-1.500 4M16 17l1.500 4M9 6c0-1 1-1 1-2m4 2c0-1 1-1 1-2"/>',
    "i-mail": '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
    "i-check": '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
    "i-share": '<path d="M12 15V4m0 0l-4 4m4-4l4 4"/><path d="M5 12v6.5A1.500 1.500 0 006.500 20h11a1.500 1.500 0 001.500-1.500V12"/>',
    "i-mower": '<path d="M4 15h13l2-7h2"/><circle cx="7" cy="18" r="2.500"/><circle cx="16" cy="18" r="2.500"/>',
    "i-sander": '<path d="M7 12V9.5A3.5 3.5 0 0110.5 6H15a3 3 0 013 3v3"/><path d="M15 6V4h-3"/><rect x="4" y="12" width="16" height="4" rx="1.5"/><path d="M5 19.5h14"/>',
    "i-square": '<path d="M4 4v16h16z"/><path d="M8.5 15.5h3.5V12z"/><path d="M4 8h2.5M4 12h2.5M4 16h2.5"/>',
    "i-goggles": '<path d="M3 10a2 2 0 012-2h14a2 2 0 012 2v3a3 3 0 01-3 3h-2.500L14 14h-4l-1.500 2H6a3 3 0 01-3-3z"/><path d="M3 11H1.500M21 11h1.500"/>',
    "i-toolbox": '<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M9 8V5.500A1.500 1.500 0 0110.500 4h3A1.500 1.500 0 0115 5.500V8"/><path d="M3 13h18M10 13v2h4v-2"/>',
    "i-bulb": '<path d="M2 4.500c5 3 15 3 20 0"/><path d="M12 7v1.500"/><path d="M10.500 8.500h3v2h-3z"/><path d="M12 10.500c-2 0-3.500 1.700-3.500 4S10 19.500 12 19.500s3.500-2.700 3.500-5-1.500-4-3.500-4z"/>',
    "i-chime": '<path d="M4 5h16M12 2.500V5M6 5v1.500M10 5v1.500M14 5v1.500M18 5v1.500"/><rect x="5" y="6.500" width="2" height="8" rx="1"/><rect x="9" y="6.500" width="2" height="11" rx="1"/><rect x="13" y="6.500" width="2" height="9.500" rx="1"/><rect x="17" y="6.500" width="2" height="6.500" rx="1"/>',
    ...PRODUCT_ICONS,
    "i-external": '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.500a1.500 1.500 0 01-1.500 1.500h-11A1.500 1.500 0 014 18.500v-11A1.500 1.500 0 015.500 6H10"/>'
};
const icon = (id, cls = "") => `<svg class="${id === "i-arrow" ? (cls + " wb-arrow").trim() : cls}" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#${id}"/></svg>`;
const spriteHtml = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(ICONS)
    .map(([id, d]) => `<symbol id="${id}" viewBox="0 0 24 24">${d}</symbol>`).join("")}</defs></svg>`;

/* ---------------------------------------------------------
   IMAGES (responsive WebP made from the owner's PNGs)
--------------------------------------------------------- */
const photo = ({ base, widths, sizes, alt, w, h, cls = "", priority = false }) => {
    const srcset = widths.map((x) => `/assets/images/${base}-${x}.webp ${x}w`).join(", ");
    const src = `/assets/images/${base}-${widths[Math.min(2, widths.length - 1)]}.webp`;
    return `<img${cls ? ` class="${cls}"` : ""} src="${src}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}" width="${w}" height="${h}" ${priority ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>`;
};
const HERO_WIDTHS = [640, 960, 1280, 1672];
const HOST_WIDTHS = [320, 480, 640, 960];
const HERO_ALT = "AI-generated image of Emma, the Backyard with Ben host, in a dark green cap holding a hammer beside a cedar raised bed in a sunny backyard garden";
const HOST_ALT = "AI-generated image of Emma, the Backyard with Ben host, smiling in a dark green Backyard with Ben cap in front of lavender and white hydrangeas";
const aiBadge = (cls = "") => `<span class="wb-ai-badge${cls ? " " + cls : ""}">AI-generated</span>`;

/* ---------------------------------------------------------
   SHARED CHROME
--------------------------------------------------------- */
const NAV = [
    ["/tools", "Ben's Tools"],
    ["/shop", "Shop the Look"],
    ["/guides", "Guides"],
    ["/about", "About"]
];

const LOGO_W = 157;   /* width of logo-dark-h48 (aspect 3.267) */
const brandLink = (h = 48) => `<a class="wb-brand" href="/" aria-label="Backyard with Ben, home"><picture><source type="image/webp" srcset="/assets/images/logo-dark-h${h === 48 ? "48" : "96"}.webp 1x, /assets/images/logo-dark-h${h === 48 ? "96" : "144"}.webp 2x"><img src="/assets/images/logo-dark-h${h === 48 ? "48" : "96"}.png" srcset="/assets/images/logo-dark-h${h === 48 ? "96" : "144"}.png 2x" width="${Math.round(h * 3.267)}" height="${h}" alt="Backyard with Ben"></picture></a>`;

const headerHtml = (current = "", extraClass = "") => {
    const link = (href, label) => `<a href="${href}"${current === href ? ' aria-current="page"' : ""}>${esc(label)}</a>`;
    return `<header class="${extraClass}wb-header" data-open="false">
    <div class="wb-container">
        <div class="wb-header__bar">
            ${brandLink(48)}
            <nav class="wb-nav" aria-label="Main navigation"><ul>${NAV.map(([h, l]) => `<li>${link(h, l)}</li>`).join("")}</ul></nav>
            <div class="wb-header__tools">
                <a class="wb-btn wb-header__cta" href="#newsletter">${icon("i-mail", "")}<span>Newsletter</span></a>
                <button class="wb-iconbtn wb-menu-btn" type="button" aria-expanded="false" aria-controls="wb-mobile-nav" aria-label="Open menu">${icon("i-menu", "wb-bars")}${icon("i-close", "wb-x")}</button>
            </div>
        </div>
        <nav class="wb-mobile-nav" id="wb-mobile-nav" aria-label="Mobile navigation">${NAV.map(([h, l]) => `<a href="${h}"${current === h ? ' aria-current="page"' : ""}>${esc(l)}${icon("i-arrow", "")}</a>`).join("")}<a class="wb-btn" href="#newsletter">Newsletter</a></nav>
    </div>
</header>`;
};

const DISCLOSURE_TEXT = "As an Amazon Associate we earn from qualifying purchases.";

const footerHtml = (extraClass = "") => `<footer class="${extraClass}wb-footer">
    <div class="wb-container">
        <div class="wb-footer__grid">
            <div>
                ${brandLink(64)}
                <p>Top-rated tool picks, finished pieces to buy and practical guides to make your outdoor space your own.</p>
                <a class="wb-btn wb-btn--ghost wb-btn--sm" href="${FB_URL}" target="_blank" rel="noopener" style="color:#e9e2cf!important">${icon("i-facebook", "")} Follow on Facebook</a>
            </div>
            <div>
                <h2>Explore</h2>
                <ul>${NAV.map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join("")}<li><a href="/contact.html">Contact</a></li></ul>
            </div>
            <div>
                <h2>Good to know</h2>
                <ul><li><a href="/disclosure">Affiliate disclosure</a></li><li><a href="/privacy.html">Privacy policy</a></li><li><a href="/terms.html">Terms of use</a></li><li><button type="button" data-cookie-settings>Cookie settings</button></li></ul>
            </div>
        </div>
        <p class="wb-footer__disclosure">${DISCLOSURE_TEXT} Links to products are affiliate links. Emma is an AI-generated host. Product picks are based on specs, ratings and verified reviews. <a href="/disclosure"><u>Read the full disclosure</u></a>.</p>
        <div class="wb-footer__bottom"><span>© ${new Date().getFullYear()} Backyard with Ben</span><a href="#main" class="wb-footer__top">Back to top ${icon("i-arrow", "wb-up")}</a></div>
    </div>
</footer>`;

const stickyToolsBtn = `<a class="wb-btn wb-sticky-tools" href="/tools">${icon("i-tool", "")} Ben's Tools</a>`;

const newsletterArt = () => `<svg viewBox="0 0 360 300" role="presentation" aria-hidden="true" focusable="false">
    <defs>
        <radialGradient id="nl-glow" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#e08a5b" stop-opacity=".38"/><stop offset="1" stop-color="#e08a5b" stop-opacity="0"/></radialGradient>
        <linearGradient id="nl-pot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eba37a"/><stop offset="1" stop-color="#b8552b"/></linearGradient>
    </defs>
    <circle cx="180" cy="160" r="150" fill="url(#nl-glow)"/>
    <!-- tape measure -->
    <g transform="translate(296 214)"><g class="wb-float wb-float--c">
        <rect x="-36" y="36" width="76" height="14" rx="2" fill="#f2c744" stroke="#3a2f10" stroke-width="1.5"/>
        <path d="M-28 36v7m10-7v4m10-4v7m10-7v4m10-4v7m10-7v4m10-4v7" stroke="#3a2f10" stroke-width="1.4"/>
        <rect x="-44" y="-38" width="82" height="76" rx="20" fill="#f2c744" stroke="#3a2f10" stroke-width="2"/>
        <circle cx="-3" cy="0" r="22" fill="#1b3a28" stroke="#3a2f10" stroke-width="2"/>
        <circle cx="-3" cy="0" r="8" fill="#a9c9a3"/>
        <rect x="-28" y="-30" width="50" height="9" rx="4" fill="#fff" opacity=".28"/>
    </g></g>
    <!-- hammer -->
    <g transform="translate(118 246) rotate(233)"><g class="wb-float wb-float--b">
        <rect x="0" y="-8" width="150" height="16" rx="7" fill="#d9c9a6"/>
        <rect x="0" y="-8" width="150" height="5" rx="2.5" fill="#fff" opacity=".25"/>
        <path d="M128 -26 h38 a8 8 0 0 1 8 8 v36 a8 8 0 0 1 -8 8 h-38 z" fill="#a39b86"/>
        <path d="M128 -26 h-24 q-14 8 -20 26 q6 18 20 26 h24 z" fill="#8d8571"/>
        <rect x="132" y="-26" width="8" height="52" fill="#fff" opacity=".18"/>
    </g></g>
    <!-- plant in pot -->
    <g class="wb-float">
        <path d="M180 178 C180 140 176 112 184 66" fill="none" stroke="#5f8f66" stroke-width="5" stroke-linecap="round"/>
        <path d="M183 122 C148 124 134 100 140 80 C170 80 186 100 183 122z" fill="#a9d3a2"/>
        <path d="M181 108 C214 108 230 86 224 66 C196 68 178 86 181 108z" fill="#7fb27f"/>
        <path d="M185 70 C168 60 168 38 182 24 C198 38 198 58 185 70z" fill="#a9d3a2"/>
        <path d="M181 150 C158 152 148 136 152 122 C172 122 184 134 181 150z" fill="#7fb27f"/>
        <path d="M120 176 h120 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 h-120 a6 6 0 0 1 -6 -6 v-14 a6 6 0 0 1 6 -6z" fill="#cf6f3e"/>
        <path d="M128 202 h104 l-10 70 a8 8 0 0 1 -8 7 h-68 a8 8 0 0 1 -8 -7z" fill="url(#nl-pot)"/>
        <path d="M150 210 l6 58" stroke="#fff" stroke-opacity=".22" stroke-width="5" stroke-linecap="round"/>
    </g>
</svg>`;

const newsletterHtml = (idp = "") => `<section class="wb-section" id="newsletter" aria-labelledby="${idp}news-h">
    <div class="wb-container">
        <div class="wb-news">
            <div class="wb-news__main">
                <span class="wb-eyebrow">Every week or so</span>
                <h2 id="${idp}news-h">Tool picks &amp; backyard tips</h2>
                <p class="wb-news__text">Top-rated tool picks, smart buying tips and practical backyard guides. Straight to your inbox. No spam.</p>
                <form class="wb-news__form" novalidate>
                    <div class="wb-news__row">
                        <div style="flex:1">
                            <label class="sr-only" for="${idp}news-email">Email address</label>
                            <input type="email" id="${idp}news-email" name="email" placeholder="Your email address" autocomplete="email" required>
                        </div>
                        <button class="wb-btn" type="submit"><span class="wb-btn__label">Send me the tips</span>${icon("i-mail", "")}</button>
                    </div>
                    <div class="wb-news__consent">
                        <input type="checkbox" id="${idp}news-consent" required>
                        <label for="${idp}news-consent">I agree to receive marketing emails from Backyard with Ben and can unsubscribe anytime.</label>
                    </div>
                    <p class="wb-news__fine">No spam. Unsubscribe anytime.</p>
                    <p class="wb-news__status" role="status" aria-live="polite"></p>
                </form>
            </div>
            <div class="wb-news__art">${newsletterArt()}</div>
        </div>
    </div>
</section>`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Source+Sans+3:wght@400;600;700&family=Zilla+Slab:wght@500;700&display=swap" rel="stylesheet">`;

/* Bing Webmaster Tools: paste the content value of the msvalidate.01 meta
   tag here (see README, "Bing Webmaster Tools"). Empty = no tag. */
const BING_VERIFY = "";

const ldScript = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

/* BreadcrumbList for inner pages: [[name, path], ...] after Home;
   the last item is the current page */
const breadcrumbLd = (items) => ({
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"], ...items].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + path }))
});

/* Full page shell. jsonLd: one schema object or an array of them */
function page({ title, description, path, ogImage = SITE_OG, ogType = "website", current = "", body, bodyClass = "", scripts = "", jsonLd = [], extraHead = "", robots = "" }) {
    const url = SITE + path;
    const img = ogImage.startsWith("http") ? ogImage : SITE + ogImage;
    const ld = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean).map(ldScript).join("\n    ");
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>${esc(title)}</title>
    <meta id="page-description" name="description" content="${esc(description)}">
    <link id="page-canonical" rel="canonical" href="${url}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Backyard with Ben">
    <meta id="og-title" property="og:title" content="${esc(title)}">
    <meta id="og-description" property="og:description" content="${esc(description)}">
    <meta id="og-url" property="og:url" content="${url}">
    <meta id="og-image" property="og:image" content="${img}">
    <meta name="twitter:card" content="summary_large_image">
    <meta id="twitter-title" name="twitter:title" content="${esc(title)}">
    <meta id="twitter-description" name="twitter:description" content="${esc(description)}">
    <meta id="twitter-image" name="twitter:image" content="${img}">
    <meta name="theme-color" content="#1b3a28">
    <link rel="icon" href="${LOGO}">
    <link rel="apple-touch-icon" href="${LOGO}">
    ${FONTS}
    <link rel="stylesheet" href="/css/workshop.css">
    ${ld}
    ${extraHead}
    ${robots ? `<meta name="robots" content="${robots}">` : ""}
    ${BING_VERIFY ? `<meta name="msvalidate.01" content="${esc(BING_VERIFY)}">` : ""}
    <!-- analytics only after consent (see js/consent.js) -->
    <script type="text/plain" data-consent="analytics">window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
    <script type="text/plain" data-consent="analytics" data-src="/_vercel/insights/script.js"></script>
</head>
<body class="wb ${bodyClass}">
${spriteHtml()}
<a class="wb-skip" href="#main">Skip to content</a>
${headerHtml(current)}
<main id="main">
${body}
</main>
${footerHtml()}
${scripts}
<script src="/js/consent.js" defer></script>
<script src="/js/site.js" defer></script>
</body>
</html>
`;
}

const newsletterScripts = `<script src="/js/newsletter.js" defer></script>`;

/* ---------------------------------------------------------
   COMPONENTS
--------------------------------------------------------- */
const disclosureNote = () => `<p class="wb-disclosure-note">${icon("i-info", "")}<span>${DISCLOSURE_TEXT} <a href="/disclosure">Disclosure</a></span></p>`;

const BADGES = { "Top pick": "", "Budget pick": " wb-badge--budget", "Upgrade pick": " wb-badge--upgrade", "Best for beginners": " wb-badge--beginner" };

/* Empty-state card ("Coming soon"). Not used while every category is
   full, kept for new categories. */
const emptySlot = ({ hint = "Top pick", ico = "i-tool" } = {}) => `<div class="wb-slot" data-product-slot>
    ${icon(ico, "")}
    <div><strong>${esc(hint)}</strong><br><em>Coming soon</em></div>
</div>`;

/* ProductCard, data from data/products.json (never edit url or text there).

   Media: ONLY the official Amazon image delivered through the Amazon API
   (imageSource "amazon-api", Amazon image host), otherwise the category
   icon. Never an AI-generated or "illustrative" image: the card must
   show the real product the buyer will receive. `whyWePickIt` holds
   verifiable reasons only (specs, ratings, review count, value, fit for
   our guides), never personal experience. No prices, ever.
   One link per card (the button); its ::after stretches over the whole
   card so the full card is clickable without nested links. Affiliate
   rel attributes required. Type label + icon: data/product-types.json. */
const AMAZON_IMG = /^https:\/\/(m\.media-amazon\.com|images-[a-z]+\.ssl-images-amazon\.com)\//;
function productCard(id) {
    const p = productById.get(id);
    if (!p) return emptySlot();
    const t = productTypes[p.id] || {};
    const ico = PRODUCT_ICONS[t.icon] ? t.icon : (catIcon.get(p.category) || "i-tool");
    const badge = p.badge && BADGES[p.badge] !== undefined ? `<span class="wb-badge${BADGES[p.badge]}">${esc(p.badge)}</span>` : "";
    const media = (p.imageSource || "icon") === "amazon-api" && AMAZON_IMG.test(p.image || "")
        ? `<div class="wb-prod__media wb-prod__media--photo"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="400" height="300"></div>`
        : `<div class="wb-prod__media">${icon(ico, "")}${t.type ? `<span class="wb-prod__type">${esc(t.type)}</span>` : ""}</div>`;
    return `<article class="wb-prod">${media}<div class="wb-prod__body">${badge}<h3 class="wb-prod__name">${esc(p.name)}</h3>${p.whyWePickIt ? `<p class="wb-prod__note"><span class="sr-only">Why we pick it: </span>${esc(p.whyWePickIt)}</p>` : ""}<a class="wb-btn wb-prod__cta" href="${esc(p.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="Check price for ${esc(p.name)} on Amazon (opens in a new tab)" data-product-id="${esc(p.id)}" data-category="${esc(p.category)}" data-section="${esc(p.section)}"><span class="wb-prod__cta-long">Check price on Amazon</span><span class="wb-prod__cta-short">Check price</span>${icon("i-external", "")}</a></div></article>`;
}

/* every product of one section + category, in JSON order; empty slots if none */
function categoryCards(section, cat) {
    const found = products.filter((p) => p.section === section && p.category === cat);
    return found.length ? found.map((p) => productCard(p.id)) : [0, 1, 2, 3].map(() => emptySlot({ ico: catIcon.get(cat) }));
}
/* ItemList of product names + links only: no Product/Review/AggregateRating,
   we neither sell nor review the products ourselves */
const productListLd = (section, name) => ({
    "@context": "https://schema.org", "@type": "ItemList", name,
    itemListElement: products.filter((p) => p.section === section)
        .map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: p.url }))
});
const collectionCards = (name) => (collections[name] || []).map(productCard);

const tile = (href, ico, title, text) => `<a class="wb-tile" href="${href}"><span class="wb-tile__icon">${icon(ico, "")}</span><span><h3>${title}</h3><p>${text}</p></span>${icon("i-arrow", "wb-tile__arrow")}</a>`;

const tabBar = (label, cats) => `<nav class="wb-tabs" aria-label="${esc(label)}"><ul>${cats.map((c) => `<li><a href="#${c.id}">${esc(c.title)}</a></li>`).join("")}</ul></nav>`;

const howWePick = (kind) => `<details class="wb-howpick">
    <summary>${icon("i-info", "")} How we pick ${kind}</summary>
    <ul>
        <li><strong>Ratings:</strong> usually 4.4★ or higher with a large number of verified customer reviews.</li>
        <li><strong>Specs and value:</strong> we compare specifications, build materials, warranty and price for what you get.</li>
        <li><strong>Fit for our guides:</strong> ${kind === "tools" ? "tools that suit the beginner and intermediate projects in our guides." : "pieces that suit the yards, patios and styles in our guides."}</li>
        <li><strong>Budget alternatives:</strong> where possible we add a cheaper option that still does the job.</li>
        <li><strong>We don't physically test products.</strong> Picks are based on specs, ratings and verified reviews. Emma, our host, is AI-generated.</li>
    </ul>
</details>`;

const tapeDivider = `<div class="wb-tape" role="presentation"></div>`;

/* ---------------------------------------------------------
   GUIDES (articles from Supabase, prerendered at build time)

   Supabase is the source of truth for the content (title = H1,
   excerpt = lead, meta_description, cover_image_alt,
   content_html). data/article-seo.json only adds what the
   database has no column for: seoTitle (<title> tag), related
   slugs and product blocks.
--------------------------------------------------------- */
let articles = [];                                   /* filled in RUN */
const articleSeo = readJson("data/article-seo.json");
const guideCats = catalog.guideCategories;
const catLabel = (id) => (guideCats.find((c) => c.id === id) || {}).title || "More guides";
const guideUrl = (slug) => `/guides/${slug}`;
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const isoDay = (iso) => new Date(iso).toISOString().slice(0, 10);
const textOf = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const decodeEntities = (s) => s.replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const wordCount = (html) => textOf(html).split(" ").filter(Boolean).length;

/* All guide cover images are AI-generated: the alt text says so (Round 5) */
const aiAlt = (t) => {
    t = String(t || "").trim();
    if (/^AI-generated/i.test(t)) return t;
    return "AI-generated image of " + (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
};

/* Covers: /assets/images/articles/<name>-1280.webp has siblings
   -640/-960/-1672.webp and <name>-og.jpg (scripts/make-article-images.mjs).
   Any other URL is used as it is. */
const COVER_WIDTHS = [640, 960, 1280, 1672];
function cover(a) {
    const url = a.cover_image_url || "";
    const m = url.match(/^(\/assets\/images\/articles\/.+)-\d+\.webp$/);
    if (!m) return { src: url, srcset: "", og: url || SITE_OG };
    const ws = COVER_WIDTHS.filter((w) => existsSync(join(ROOT, `${m[1]}-${w}.webp`)));
    return {
        src: `${m[1]}-${ws.includes(1280) ? 1280 : ws[ws.length - 1]}.webp`,
        srcset: ws.map((w) => `${m[1]}-${w}.webp ${w}w`).join(", "),
        og: existsSync(join(ROOT, `${m[1]}-og.jpg`)) ? `${m[1]}-og.jpg` : url
    };
}
const coverImg = (a, { sizes, priority = false, w = 640, h = 400 }) => {
    const c = cover(a);
    if (!c.src) return "";
    return `<img src="${esc(c.src)}"${c.srcset ? ` srcset="${c.srcset}" sizes="${sizes}"` : ""} alt="${esc(aiAlt(a.cover_image_alt || a.title))}" width="${w}" height="${h}" ${priority ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>`;
};

const CARD_SIZES = "(min-width: 1100px) 360px, (min-width: 700px) 45vw, 92vw";
const guideCard = (a, showCat = false) => `<article class="wb-card"><div class="wb-card__thumb">${coverImg(a, { sizes: CARD_SIZES })}${a.cover_image_url ? aiBadge("wb-ai-badge--card") : ""}${showCat ? `<span class="wb-card__cat">${esc(catLabel(a.category))}</span>` : ""}</div><div class="wb-card__body"><h3 class="wb-card__title"><a href="${guideUrl(a.slug)}">${esc(a.title)}</a></h3>${a.excerpt ? `<p class="wb-card__excerpt">${esc(a.excerpt)}</p>` : ""}</div></article>`;

/* articles grouped by guide category, in catalog order; unknown ones last */
function guideGroups() {
    const known = new Set(guideCats.map((c) => c.id));
    const groups = guideCats.map((c) => ({ ...c, items: articles.filter((a) => a.category === c.id) })).filter((g) => g.items.length);
    const more = articles.filter((a) => !known.has(a.category));
    if (more.length) groups.push({ id: "more-guides", title: "More guides", icon: "i-leaf", items: more });
    return groups;
}

/* Article body: legacy link/label fixes, then a strict allow-list sanitizer */
const SANITIZE = {
    allowedTags: ["div", "section", "span", "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a",
        "blockquote", "figure", "figcaption", "img", "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "hr", "code", "small", "sup", "sub"],
    allowedAttributes: {
        "*": ["class", "id"],
        a: ["href", "title", "rel", "target"],
        img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
        th: ["scope", "colspan", "rowspan"], td: ["colspan", "rowspan"]
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
        a: (tag, attribs) => {
            if (/^https?:\/\//.test(attribs.href || "") && !(attribs.href || "").startsWith(SITE)) {
                return { tagName: "a", attribs: { ...attribs, target: "_blank", rel: attribs.rel || "noopener" } };
            }
            return { tagName: "a", attribs };
        },
        img: (tag, attribs) => ({ tagName: "img", attribs: { loading: "lazy", decoding: "async", ...attribs } })
    }
};
function articleBody(a, seo) {
    let html = a.content_html || "";
    for (const [from, to] of seo.replace || []) html = html.split(from).join(to);
    html = html
        .replace(/href="(?:\.\.\/|\/)?blogs\.html\?category=([a-z-]+)"/g, 'href="/guides#$1"')
        .replace(/href="(?:\.\.\/|\/)?blogs\.html"/g, 'href="/guides"')
        .replace(/href="(?:https:\/\/www\.backyardwithben\.com)?\/?(?:\.\.\/)?articles\/view\.html\?slug=([a-z0-9-]+)"/g, 'href="/guides/$1"')
        .replace(/<strong>\s*Ben(?:'|&#39;|’)s Tip\s*<\/strong>/gi, "<strong>Pro tip</strong>");
    return sanitizeHtml(html, SANITIZE);
}

/* FAQ pairs from the article's own FAQ section (.article-faq-item: h3 + p) */
function faqPairs(html) {
    const out = [];
    const re = /<div class="article-faq-item">\s*<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)<\/div>/g;
    let m;
    while ((m = re.exec(html))) {
        const q = decodeEntities(textOf(m[1])), ans = decodeEntities(textOf(m[2]));
        if (q && ans) out.push({ q, a: ans });
    }
    return out;
}

function relatedArticles(a, seo) {
    const bySlug = new Map(articles.map((x) => [x.slug, x]));
    const picked = (seo.related || []).map((s) => bySlug.get(s)).filter((x) => x && x.slug !== a.slug);
    for (const x of articles) {
        if (picked.length >= 3) break;
        if (x.slug !== a.slug && x.category === a.category && !picked.includes(x)) picked.push(x);
    }
    return picked.slice(0, 3);
}

/* ---------------------------------------------------------
   PAGES
--------------------------------------------------------- */
function homePage() {
    const heroSrcset = HERO_WIDTHS.map((x) => `/assets/images/uvodwoman-${x}.webp ${x}w`).join(", ");

    const body = `
<section class="wb-hero" aria-labelledby="hero-h">
    <div class="wb-hero__media" data-parallax>${photo({ base: "uvodwoman", widths: HERO_WIDTHS, sizes: "100vw", alt: HERO_ALT, w: 1672, h: 941, cls: "wb-hero__img", priority: true })}</div>
    ${aiBadge("wb-ai-badge--hero")}
    <div class="wb-container">
        <div class="wb-hero__copy">
            <span class="wb-eyebrow">Backyard with Ben</span>
            <h1 id="hero-h"><span class="wb-scribble">The tools and ideas behind a better backyard.</span></h1>
            <p class="wb-lede">Top-rated tool picks, finished pieces to buy and practical guides, all in one place.</p>
            <div class="wb-hero__actions">
                <a class="wb-btn" href="/tools">Browse the tools ${icon("i-arrow", "")}</a>
                <a class="wb-btn wb-btn--ghost" href="/shop">Shop the look ${icon("i-arrow", "")}</a>
            </div>
        </div>
    </div>
</section>
${tapeDivider}
<section class="wb-section wb-section--tight" aria-label="Where to start">
    <div class="wb-container wb-tiles">
        ${tile("/tools", "i-drill", "Ben's Tools", "Top-rated tools, picked from specs and reviews.")}
        ${tile("/shop", "i-pot", "Shop the Look", "Finished planters, lights and furniture, ready to go.")}
        ${tile("/guides", "i-leaf", "Guides", "Practical backyard how-tos and ideas.")}
    </div>
</section>
<section class="wb-section wb-section--alt" aria-labelledby="ess-h">
    <div class="wb-container">
        <div class="wb-section-head"><div><span class="wb-eyebrow">Workshop basics</span><h2 id="ess-h">Our essentials</h2></div><a class="wb-link-arrow" href="/tools">See all ${icon("i-arrow", "")}</a></div>
        ${disclosureNote()}
        <div class="wb-prodgrid wb-prodgrid--home">${collectionCards("homeEssentials").join("")}</div>
    </div>
</section>
<section class="wb-section" aria-labelledby="buy-h">
    <div class="wb-container">
        <div class="wb-section-head"><div><span class="wb-eyebrow">Ready to enjoy</span><h2 id="buy-h">Shop the look</h2></div><a class="wb-link-arrow" href="/shop">See all ${icon("i-arrow", "")}</a></div>
        ${disclosureNote()}
        <div class="wb-prodgrid wb-prodgrid--home">${collectionCards("shopTeaser").join("")}</div>
    </div>
</section>
<section class="wb-section wb-section--alt" aria-labelledby="guides-h">
    <div class="wb-container">
        <div class="wb-section-head"><div><span class="wb-eyebrow">Fresh reads</span><h2 id="guides-h">Latest guides</h2></div><a class="wb-link-arrow" href="/guides">All guides ${icon("i-arrow", "")}</a></div>
        <div class="wb-grid wb-grid--3 wb-grid--guides" id="home-guides">${articles.slice(0, 3).map((a) => guideCard(a, true)).join("")}</div>
    </div>
</section>
<section class="wb-section" aria-labelledby="host-h">
    <div class="wb-container wb-about-strip wb-about-strip--sm">
        <figure class="wb-polaroid wb-polaroid--sm">${photo({ base: "profilewoman", widths: HOST_WIDTHS, sizes: "220px", alt: HOST_ALT, w: 960, h: 960 })}${aiBadge()}</figure>
        <div>
            <span class="wb-eyebrow">Say hi to our host</span>
            <h2 id="host-h">Meet Emma, our AI host</h2>
            <p>Emma is the AI-generated host of Backyard with Ben. She introduces the site, while our picks and guides come from product specs, ratings and verified customer reviews.</p>
            <a class="wb-link-arrow" href="/about">More about us ${icon("i-arrow", "")}</a>
        </div>
    </div>
</section>
${newsletterHtml()}`;
    return page({
        title: "Backyard with Ben | Tools, Shop the Look & Backyard Guides",
        description: "Top-rated tool picks based on specs and verified reviews, finished pieces to buy and practical guides for your backyard and outdoor living space.",
        path: "/", current: "", body, scripts: newsletterScripts + stickyToolsBtn,
        extraHead: `<link rel="preload" as="image" imagesrcset="${heroSrcset}" imagesizes="100vw" fetchpriority="high">`,
        jsonLd: [ORG_LD, {
            "@context": "https://schema.org", "@type": "WebSite", "@id": SITE + "/#website", name: "Backyard with Ben",
            url: SITE + "/", description: BRAND_DESC, inLanguage: "en-US", publisher: { "@id": SITE + "/#organization" }
        }]
    });
}

function toolsPage() {
    const cats = catalog.toolCategories;
    const sections = cats.map((c) => {
        return `<section class="wb-cat${c.highlight ? " wb-cat--highlight" : ""}" id="${c.id}" aria-labelledby="${c.id}-h">
    <div class="wb-container">
        ${c.highlight ? `<span class="wb-start-here">${icon("i-arrow", "")}Start here</span>` : ""}
        <div class="wb-cat__title">${icon(c.icon, "")}<div><h2 id="${c.id}-h">${esc(c.title)}</h2><p class="wb-lede" style="margin:0">${esc(c.blurb)}</p></div></div>
        <div class="wb-prodgrid">${categoryCards("tools", c.id).join("")}</div>
    </div>
</section>`;
    }).join("");
    const body = `
<section class="wb-section wb-section--tight">
    <div class="wb-container">
        <span class="wb-eyebrow">Picked from specs and reviews</span>
        <h1>Ben's Tools</h1>
        <p class="wb-lede">Our top tool picks for backyard DIY: chosen from specs, ratings and verified reviews.</p>
        ${howWePick("tools")}
        ${disclosureNote()}
    </div>
</section>
${tabBar("Tool categories", cats)}
${sections}
${newsletterHtml()}`;
    return page({
        title: "Ben's Tools | Top Tool Picks for Backyard DIY | Backyard with Ben",
        description: "Our top tool picks for backyard DIY, chosen from specs, ratings and verified reviews: power tools, sanding, measuring, clamps, safety gear and a starter kit.",
        path: "/tools", current: "/tools", body, scripts: newsletterScripts,
        jsonLd: [breadcrumbLd([["Ben's Tools", "/tools"]]), productListLd("tools", "Ben's Tools: top tool picks for backyard DIY")]
    });
}

function shopPage() {
    const cats = catalog.shopCategories;
    const sections = cats.map((c) => `<section class="wb-cat" id="${c.id}" aria-labelledby="${c.id}-h">
    <div class="wb-container">
        <div class="wb-cat__title">${icon(c.icon, "")}<h2 id="${c.id}-h">${esc(c.title)}</h2></div>
        <div class="wb-prodgrid">${categoryCards("shop", c.id).join("")}</div>
    </div>
</section>`).join("");
    const body = `
<section class="wb-section wb-section--tight">
    <div class="wb-container">
        <span class="wb-eyebrow">Skip the sawdust</span>
        <h1>Shop the Look</h1>
        <p class="wb-lede">Our top picks for finished planters, beds, lights and furniture: chosen from specs, ratings and verified reviews.</p>
        ${howWePick("products")}
        ${disclosureNote()}
    </div>
</section>
${tabBar("Shop categories", cats)}
${sections}
${newsletterHtml()}`;
    return page({
        title: "Shop the Look | Planters, Beds, Lighting & More | Backyard with Ben",
        description: "Don't want to build it yourself? Shop finished planters, raised beds, lighting, fire pits, furniture and decor we picked.",
        path: "/shop", current: "/shop", body, scripts: newsletterScripts + stickyToolsBtn,
        jsonLd: [breadcrumbLd([["Shop the Look", "/shop"]]), productListLd("shop", "Shop the Look: finished backyard pieces")]
    });
}

function guidesPage() {
    const groups = guideGroups();
    const sections = groups.map((g) => `<section class="wb-cat" id="${g.id}" aria-labelledby="${g.id}-h">
    <div class="wb-container">
        <div class="wb-cat__title">${icon(g.icon || "i-leaf", "")}<h2 id="${g.id}-h">${esc(g.title)} guides</h2></div>
        <div class="wb-grid wb-grid--3 wb-grid--guides">${g.items.map((a) => guideCard(a)).join("")}</div>
    </div>
</section>`).join("\n");
    const body = `
<section class="wb-section wb-section--tight">
    <div class="wb-container">
        <span class="wb-eyebrow">Read up</span>
        <h1>Backyard guides</h1>
        <p class="wb-lede">Practical backyard guides on gardening, landscaping, grilling, lawns and more: ${articles.length} guides in ${groups.length} categories.</p>
    </div>
</section>
${tabBar("Guide categories", groups)}
${sections}
${newsletterHtml()}`;
    return page({
        title: "Backyard Guides: Gardening, Lawn, BBQ & DIY | Backyard with Ben",
        description: "Practical backyard guides on gardening, plants and trees, landscaping, lawn care, outdoor living, BBQ and grilling and weekend DIY projects, all in one place.",
        path: "/guides", current: "/guides", body,
        scripts: newsletterScripts + stickyToolsBtn,
        jsonLd: [breadcrumbLd([["Guides", "/guides"]]), {
            "@context": "https://schema.org", "@type": "CollectionPage", name: "Backyard guides", url: SITE + "/guides",
            isPartOf: { "@id": SITE + "/#website" },
            mainEntity: { "@type": "ItemList", itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + guideUrl(a.slug), name: a.title })) }
        }]
    });
}

/* One fully rendered article page (works without JavaScript) */
function articlePage(a) {
    const seo = articleSeo[a.slug] || {};
    const path = guideUrl(a.slug);
    const url = SITE + path;
    const cat = catLabel(a.category);
    const h1 = seo.h1 || a.title;
    const title = seo.seoTitle || `${a.title} | Backyard with Ben`;
    const desc = seo.metaDescription || a.meta_description || a.excerpt || "";
    const lead = seo.lead || a.excerpt || "";
    const html = articleBody(a, seo);
    const faq = faqPairs(html);
    const c = cover(a);
    const minutes = a.read_time_minutes || Math.max(1, Math.round(wordCount(html) / 200));
    const modified = a.updated_at || a.published_at;
    const updatedLater = isoDay(modified) > isoDay(a.published_at);
    const related = relatedArticles(a, seo);
    const productGroups = (seo.products || []).map((g, i) => {
        const cards = (g.ids || []).filter((id) => productById.has(id)).map(productCard).join("");
        return cards ? `<h2 id="gtools-h-${i}">${icon(i === 0 && /^Tools/.test(g.title) ? "i-drill" : "i-pot", "")} ${esc(g.title)}</h2><div class="wb-prodgrid wb-prodgrid--guide">${cards}</div>` : "";
    }).join("");
    const catHref = guideCats.some((g) => g.id === a.category) ? `/guides#${a.category}` : "/guides#more-guides";
    const shareHref = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    const heroSizes = "(min-width: 1240px) 1200px, 100vw";

    const body = `
<article id="article-content">
    <header class="wb-article-head">
        <div class="wb-narrow">
            <nav class="wb-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/guides">Guides</a><span aria-hidden="true">›</span><a href="${catHref}">${esc(cat)}</a></nav>
            <a class="wb-cat-pill" href="${catHref}">${esc(cat)}</a>
            <h1>${esc(h1)}</h1>
            ${lead ? `<p class="wb-lede">${esc(lead)}</p>` : ""}
            <div class="wb-byline"><img class="wb-byline__logo" src="/assets/images/logo-dark-h48.png" alt="" width="105" height="32"><span>By the <strong>Backyard with Ben</strong> team</span><span aria-hidden="true">·</span><span>${updatedLater
                ? `Updated <time datetime="${isoDay(modified)}">${fmtDate(modified)}</time>`
                : `Published <time datetime="${isoDay(a.published_at)}">${fmtDate(a.published_at)}</time>`} · ${minutes} min read</span></div>
        </div>
    </header>
    ${c.src ? `<figure class="wb-article-hero">${aiBadge()}${coverImg(a, { sizes: heroSizes, priority: true, w: 1672, h: 941 })}</figure>` : ""}
    <div class="wb-narrow"><div class="wb-article-body">${html}</div>
        <p class="wb-article-dates">Published <time datetime="${isoDay(a.published_at)}">${fmtDate(a.published_at)}</time>${updatedLater ? ` · Last updated <time datetime="${isoDay(modified)}">${fmtDate(modified)}</time>` : ""}. Written by the Backyard with Ben team from standard, widely published guidance. <a href="/about">About us</a>.</p>
    </div>
    <div class="wb-narrow wb-article-extra">
        ${productGroups ? `<section class="wb-box" id="article-tools" aria-label="Products for this guide">
            ${disclosureNote()}
            ${productGroups}
        </section>` : ""}
        <p class="wb-share"><a class="wb-btn wb-btn--ghost wb-btn--sm" href="${shareHref}" target="_blank" rel="noopener">${icon("i-facebook", "")} Share on Facebook</a></p>
    </div>
    <section class="wb-section wb-section--alt wb-keep" aria-labelledby="keep-h">
        <div class="wb-container">
            <div class="wb-keep__head">
                <span class="wb-eyebrow">Keep going</span>
                <h2 id="keep-h">More for your backyard</h2>
                <p>Gear up with our top-rated tool picks, shop the look if you'd rather buy than build, or read a related guide. <a href="${catHref}">See all ${esc(cat)} guides</a>.</p>
                <div class="wb-keep__actions"><a class="wb-btn wb-btn--sm" href="/tools">${icon("i-drill", "")} Ben's Tools</a><a class="wb-btn wb-btn--sm wb-btn--primary" href="/shop">${icon("i-pot", "")} Shop the Look</a></div>
            </div>
            ${related.length ? `<h3 class="sr-only">Related guides</h3><div class="wb-cards-center wb-grid--guides">${related.map((r) => guideCard(r, true)).join("")}</div>` : ""}
        </div>
    </section>
</article>
${newsletterHtml()}`;

    const ldImage = c.src ? [SITE + c.og, SITE + c.src] : undefined;
    return page({
        title, description: desc, path, ogImage: c.og || SITE_OG, ogType: "article", current: "/guides", body,
        scripts: newsletterScripts,
        extraHead: [
            `<meta property="article:published_time" content="${new Date(a.published_at).toISOString()}">`,
            `<meta property="article:modified_time" content="${new Date(modified).toISOString()}">`,
            `<meta property="article:section" content="${esc(cat)}">`,
            c.srcset ? `<link rel="preload" as="image" imagesrcset="${c.srcset}" imagesizes="${heroSizes}" fetchpriority="high">` : ""
        ].filter(Boolean).join("\n    "),
        jsonLd: [
            {
                "@context": "https://schema.org", "@type": "Article", "@id": url + "#article",
                headline: h1, description: desc, image: ldImage, url, mainEntityOfPage: url,
                datePublished: new Date(a.published_at).toISOString(), dateModified: new Date(modified).toISOString(),
                author: ORG_REF, publisher: { ...ORG_REF, logo: ORG_LD.logo },
                articleSection: cat, wordCount: wordCount(html), inLanguage: "en-US",
                isPartOf: { "@id": SITE + "/#website" }
            },
            breadcrumbLd([["Guides", "/guides"], [cat, catHref], [h1, path]]),
            faq.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null
        ]
    });
}

function aboutPage() {
    const body = `
<section class="wb-section">
    <div class="wb-container wb-about-strip wb-about-strip--lg">
        <figure class="wb-polaroid wb-polaroid--lg">${photo({ base: "profilewoman", widths: HOST_WIDTHS, sizes: "(min-width: 760px) 420px, 90vw", alt: HOST_ALT, w: 960, h: 960, priority: true })}${aiBadge()}<figcaption>AI-generated image</figcaption></figure>
        <div>
            <span class="wb-eyebrow">Emma, the AI host of Backyard with Ben</span>
            <h1 class="wb-about-hi">Hi</h1>
            <p class="wb-lede">I'm Emma, the AI host of Backyard with Ben.</p>
            <p>I'm not a real person: I'm an AI-generated character who presents the brand. The tool picks and guides are put together by the Backyard with Ben team from product specs, ratings and verified customer reviews.</p>
            <p>Backyard with Ben is a brand about DIY, tools and outdoor living: top-rated tool picks, good-looking finished pieces for when you'd rather buy than build, and practical guides for your own backyard.</p>
        </div>
    </div>
</section>
${tapeDivider}
<section class="wb-section">
    <div class="wb-container wb-prose">
        <h2>How we pick products</h2>
        <ul style="list-style:disc;padding-left:1.2em;display:grid;gap:8px">
            <li><strong>Ratings:</strong> we look for products rated around 4.4★ or higher with a large number of verified customer reviews.</li>
            <li><strong>Specs and value:</strong> we compare specifications, materials, warranty and price for what you get.</li>
            <li><strong>Fit for our guides:</strong> picks suit the beginner and intermediate projects we write about.</li>
            <li><strong>Budget alternatives:</strong> when a cheaper option does the job, we say so.</li>
            <li><strong>No physical testing:</strong> we don't test products ourselves, and we never claim we did.</li>
            <li><strong>Affiliate links never change a pick.</strong> They help pay for the site at no extra cost to you.</li>
        </ul>
        <p style="margin-top:1em">Read the full <a href="/disclosure">disclosure</a>, including how we use AI.</p>
        <div class="wb-hero__actions"><a class="wb-btn" href="/tools">Browse the tools ${icon("i-arrow", "")}</a><a class="wb-btn wb-btn--ghost" href="${FB_URL}" target="_blank" rel="noopener">${icon("i-facebook", "")} Facebook</a><a class="wb-btn wb-btn--ghost" href="/contact.html">Get in touch</a></div>
    </div>
</section>
${newsletterHtml()}`;
    return page({
        title: "About Emma, Our AI Host | Backyard with Ben",
        description: "Meet Emma, the AI-generated host of Backyard with Ben, and learn how we pick products from specs, ratings and verified reviews.",
        path: "/about", current: "/about", body, scripts: newsletterScripts + stickyToolsBtn
    });
}

function disclosurePage() {
    const body = `
<section class="wb-section">
    <div class="wb-container wb-prose">
        <span class="wb-eyebrow">The fine print</span>
        <h1>Affiliate &amp; AI disclosure</h1>
        <p class="wb-lede">Last updated: October 2026.</p>
        <h2>What is an affiliate link?</h2>
        <p>An affiliate link is a special tracking link. If you click one on this site and then make a qualifying purchase, the retailer pays us a small commission. It does not change the price you pay.</p>
        <h2>Amazon Associates</h2>
        <p>Backyard with Ben is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com and affiliated sites. ${DISCLOSURE_TEXT}</p>
        <h2>AI content</h2>
        <p>Emma, the host of Backyard with Ben, is an AI-generated character, not a real person. Images of Emma and some other images on this site, including guide cover images, are AI-generated and are labeled as such.</p>
        <p>We do not physically test products. Our picks are based on product specifications, customer ratings, the number of verified reviews, value for money and how well a product fits the projects in our guides. Product cards only show the official product image from the retailer, or a simple icon, never an AI-generated product image.</p>
        <h2>Editorial independence</h2>
        <p>We only recommend tools and products we believe are genuinely useful for backyard and DIY projects. Whether a link is an affiliate link does not influence our opinions or recommendations.</p>
        <h2>Prices</h2>
        <p>We do not show prices. They change often, so the buttons say "Check price on Amazon" and take you to the current price.</p>
        <h2>Questions</h2>
        <p>Use the <a href="/contact.html">contact page</a> or email ben@backyardwithben.com.</p>
    </div>
</section>
${newsletterHtml()}`;
    return page({
        title: "Affiliate & AI Disclosure | Backyard with Ben",
        description: "How Backyard with Ben uses affiliate links, including the Amazon Associates program, and how we use AI-generated content.",
        path: "/disclosure", current: "", body, scripts: newsletterScripts
    });
}

/* ---------------------------------------------------------
   CONTACT, LEGAL, 404
--------------------------------------------------------- */
function contactPage() {
    const body = `
<section class="wb-section wb-section--tight">
    <div class="wb-container">
        <span class="wb-eyebrow">Say hello</span>
        <h1>Contact</h1>
        <p class="wb-lede">Questions about a tool or a guide? Our team reads every message.</p>
    </div>
</section>
${tapeDivider}
<section class="wb-section">
    <div class="wb-container wb-contact">
        <div>
            <h2>Let's talk backyards.</h2>
            <p>Send a note with the form and we'll get back to you as soon as we can. Tool questions, guide ideas and feedback are all welcome.</p>
            <div class="wb-contact__ways">
                <div class="wb-contact__way">${icon("i-mail", "")}<div><h3>Email</h3><p><a href="mailto:ben@backyardwithben.com">ben@backyardwithben.com</a></p></div></div>
                <div class="wb-contact__way">${icon("i-info", "")}<div><h3>Reply time</h3><p>We usually answer within 2-3 business days.</p></div></div>
                <div class="wb-contact__way">${icon("i-facebook", "")}<div><h3>Follow along</h3><p><a href="${FB_URL}" target="_blank" rel="noopener">Find us on Facebook</a> for more backyard ideas.</p></div></div>
            </div>
        </div>
        <form id="contact-form" class="wb-form" action="/api/contact" method="POST" novalidate>
            <div class="wb-form__row2">
                <div class="wb-field"><label for="contact-name">Name</label><input type="text" id="contact-name" name="name" autocomplete="name" required aria-describedby="err-name"><p class="wb-field__err" id="err-name" aria-live="polite"></p></div>
                <div class="wb-field"><label for="contact-email">Email</label><input type="email" id="contact-email" name="email" autocomplete="email" required aria-describedby="err-email"><p class="wb-field__err" id="err-email" aria-live="polite"></p></div>
            </div>
            <div class="wb-field"><label for="contact-subject">Subject</label><input type="text" id="contact-subject" name="subject" required aria-describedby="err-subject"><p class="wb-field__err" id="err-subject" aria-live="polite"></p></div>
            <div class="wb-field"><label for="contact-message">Message</label><textarea id="contact-message" name="message" required aria-describedby="err-message"></textarea><p class="wb-field__err" id="err-message" aria-live="polite"></p></div>
            <button class="wb-btn" type="submit"><span class="wb-btn__label">Send message</span>${icon("i-arrow", "")}</button>
            <p class="wb-form__msg" role="status" aria-live="polite"></p>
        </form>
    </div>
</section>
${newsletterHtml()}`;
    return page({
        title: "Contact | Backyard with Ben",
        description: "Questions about a tool or a guide? Send the Backyard with Ben team a message. We reply within a few business days.",
        path: "/contact.html", current: "", body, scripts: newsletterScripts + `\n<script src="/js/contact.js" defer></script>`
    });
}

function legalPage({ file, title, h1, lede, description }) {
    let frag = readFileSync(join(ROOT, `data/legal/${file}.html`), "utf-8");
    frag = frag.replace("<h2>Cookies &amp; Tracking</h2>", '<h2 id="cookies">Cookies &amp; Tracking</h2>');
    const body = `
<section class="wb-section">
    <div class="wb-container">
        <span class="wb-eyebrow">The fine print</span>
        <h1>${h1}</h1>
        <p class="wb-lede">${lede}</p>
        <div class="wb-legal">${frag}</div>
    </div>
</section>
${newsletterHtml()}`;
    return page({ title, description, path: `/${file}.html`, body, scripts: newsletterScripts });
}

function notFoundPage() {
    const body = `
<section class="wb-section">
    <div class="wb-container wb-prose">
        <span class="wb-eyebrow">Lost in the backyard</span>
        <h1>Page not found</h1>
        <p class="wb-lede">That page doesn't exist or has moved. Try one of these instead.</p>
        <div class="wb-hero__actions"><a class="wb-btn" href="/guides">Browse the guides ${icon("i-arrow", "")}</a><a class="wb-btn wb-btn--ghost" href="/tools">Ben's Tools</a><a class="wb-btn wb-btn--ghost" href="/">Home</a></div>
    </div>
</section>
${newsletterHtml()}`;
    return page({ title: "Page not found | Backyard with Ben", description: "This page could not be found.", path: "/404.html", body, scripts: newsletterScripts, robots: "noindex, follow" });
}


/* ---------------------------------------------------------
   SITEMAP (indexable pages only, articles with lastmod + image)
--------------------------------------------------------- */
function sitemapXml() {
    const entry = (path, extra = "") => `  <url>\n    <loc>${SITE}${path}</loc>\n${extra}  </url>\n`;
    const latest = articles.reduce((m, a) => (a.updated_at > m ? a.updated_at : m), articles[0].updated_at);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
    xml += entry("/") + entry("/tools") + entry("/shop") + entry("/guides", `    <lastmod>${isoDay(latest)}</lastmod>\n`) + entry("/about");
    for (const a of articles) {
        const c = cover(a);
        xml += entry(guideUrl(a.slug), `    <lastmod>${isoDay(a.updated_at || a.published_at)}</lastmod>\n` +
            (c.src ? `    <image:image><image:loc>${esc(SITE + c.src)}</image:loc></image:image>\n` : ""));
    }
    return xml + "</urlset>\n";
}

/* ---------------------------------------------------------
   ROBOTS + LLMS (search and AI crawlers are welcome)
--------------------------------------------------------- */
const CRAWLERS = ["Googlebot", "Google-Extended", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-SearchBot", "Applebot", "Applebot-Extended"];
const robotsTxt = () => `# Backyard with Ben: search engines and AI assistants are welcome to crawl and cite this site.
User-agent: *
Allow: /

${CRAWLERS.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")}

Sitemap: ${SITE}/sitemap.xml
`;

/* Article HTML -> clean Markdown for llms-full.txt */
function htmlToMd(html) {
    const abs = (h) => (h.startsWith("/") ? SITE + h : h);
    let s = html
        .replace(/<span class="article-number">[\s\S]*?<\/span>/g, "")
        .replace(/<div class="article-tags">[\s\S]*?<\/div>/g, "")
        .replace(/<table[\s\S]*?<\/table>/g, (t) => {
            const rows = [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => textOf(c[1])));
            if (!rows.length) return "";
            return "\n\n" + rows.map((r, i) => `| ${r.join(" | ")} |` + (i === 0 ? `\n|${r.map(() => " --- |").join("")}` : "")).join("\n") + "\n\n";
        })
        .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (m, h, t) => `[${textOf(t)}](${abs(h)})`)
        .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, "**$2**")
        .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, "_$2_")
        .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (m, t) => `\n\n## ${textOf(t)}\n\n`)
        .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (m, t) => `\n\n### ${textOf(t)}\n\n`)
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (m, t) => `\n- ${t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}`)
        .replace(/<\/(p|ul|ol|div|section|blockquote)>/g, "\n\n")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<[^>]+>/g, "");
    s = decodeEntities(s).split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n");
    return s.replace(/\n{3,}/g, "\n\n").trim();
}

function llmsTxt() {
    const groups = guideGroups();
    return `# Backyard with Ben

> ${BRAND_DESC}

Backyard with Ben (${SITE}) publishes practical, beginner-friendly backyard guides and curated product picks. Guides are written by the Backyard with Ben team from standard, widely published guidance; products are picked from specs, ratings and verified customer reviews and are not physically tested. The host, Emma, is an AI-generated character. Product links are Amazon affiliate links. Prices are never shown on the site.

## Main pages

- [Guides](${SITE}/guides): all ${articles.length} guides, grouped by category
- [Ben's Tools](${SITE}/tools): top tool picks for backyard DIY (power tools, sanding, measuring, clamps, safety gear, starter kit)
- [Shop the Look](${SITE}/shop): finished planters, raised beds, lighting, fire pits, furniture and decor
- [About](${SITE}/about): who is behind the site and how picks are made
- [Affiliate & AI disclosure](${SITE}/disclosure)

${groups.map((g) => `## ${g.title}\n\n${g.items.map((a) => `- [${a.title}](${SITE}${guideUrl(a.slug)}): ${a.meta_description || a.excerpt || ""}`).join("\n")}`).join("\n\n")}

## Optional

- [Full text of every guide](${SITE}/llms-full.txt): clean Markdown, regenerated on every publish
`;
}

function llmsFullTxt() {
    return `# Backyard with Ben: full guide text\n\n> ${BRAND_DESC}\n\nSource: ${SITE}. Generated from the published guides on every build.\n\n` + articles.map((a) => {
        const seo = articleSeo[a.slug] || {};
        return `---\n\n# ${seo.h1 || a.title}\n\nURL: ${SITE}${guideUrl(a.slug)}\nCategory: ${catLabel(a.category)}\nLast updated: ${isoDay(a.updated_at || a.published_at)}\n\n${a.excerpt ? a.excerpt + "\n\n" : ""}${htmlToMd(articleBody(a, seo))}\n`;
    }).join("\n");
}

/* ---------------------------------------------------------
   STATIC FILES copied into dist/ (source-only files stay out)
--------------------------------------------------------- */
const STATIC = ["css", "assets", "ads.txt", "js/consent.js", "js/site.js", "js/newsletter.js", "js/contact.js", "js/supabase-config.js"];
const STATIC_SKIP = ["assets/images/uvodwoman.png", "assets/images/profilewoman.png", "assets/images/backyardwithbenLOGOaNAZEV.png"].map((f) => join(ROOT, f));
function copyStatic() {
    for (const rel of STATIC) {
        cpSync(join(ROOT, rel), join(DIST, rel), { recursive: true, filter: (src) => !STATIC_SKIP.includes(src) && !src.endsWith(".DS_Store") });
    }
}

/* ---------------------------------------------------------
   RUN
--------------------------------------------------------- */
articles = (await fetchPublishedArticles()).filter((a) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug || ""));
if (!articles.length) {
    console.error("BUILD FAILED: Supabase returned 0 published articles. Refusing to deploy an empty guides section.");
    process.exit(1);
}
for (const slug of Object.keys(articleSeo)) if (!articles.some((a) => a.slug === slug)) console.warn(`! data/article-seo.json has "${slug}", which is not a published article`);

rmSync(DIST, { recursive: true, force: true });
copyStatic();
write("index.html", homePage());
write("tools/index.html", toolsPage());
write("shop/index.html", shopPage());
write("guides/index.html", guidesPage());
for (const a of articles) write(`guides/${a.slug}/index.html`, articlePage(a));
write("about/index.html", aboutPage());
write("disclosure/index.html", disclosurePage());
write("contact.html", contactPage());
write("privacy.html", legalPage({ file: "privacy", title: "Privacy Policy | Backyard with Ben", h1: "Privacy policy", lede: "What information Backyard with Ben collects, how it's used and the choices you have.", description: "Read the Backyard with Ben privacy policy: what we collect, how cookies work and the choices you have." }));
write("terms.html", legalPage({ file: "terms", title: "Terms of Use | Backyard with Ben", h1: "Terms of use", lede: "The rules for using Backyard with Ben.", description: "Read the Backyard with Ben terms of use, including how affiliate links and site content work." }));
write("404.html", notFoundPage());
write("sitemap.xml", sitemapXml());
write("robots.txt", robotsTxt());
write("llms.txt", llmsTxt());
write("llms-full.txt", llmsFullTxt());
console.log(`Built ${articles.length} guides + static pages into dist/ (${products.length} products).`);
