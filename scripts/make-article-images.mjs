#!/usr/bin/env node
/* =========================================================
   scripts/make-article-images.mjs — responsive cover images

   For every published article (read-only, public key) it takes
   the current cover image from assets/images/articles/ and writes:

     assets/images/articles/<slug>-640.webp  -960  -1280  -1672
     assets/images/articles/<slug>-og.jpg    1200x630 share image

   The original files are never changed or deleted (old URLs keep
   working). Existing outputs are skipped. Afterwards point
   cover_image_url at /assets/images/articles/<slug>-1280.webp;
   scripts/build.mjs derives the srcset and the OG image from it.

   Needs sharp (not a site dependency):
     npm i --no-save sharp   (or set SHARP_DIR to a folder that has it)
     node scripts/make-article-images.mjs
========================================================= */
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchPublishedArticles } from "./lib/articles.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharp = createRequire(join(process.env.SHARP_DIR || ROOT, "x.js"))("sharp");
const DIR = join(ROOT, "assets/images/articles");
export const COVER_WIDTHS = [640, 960, 1280, 1672];

const articles = await fetchPublishedArticles();
let made = 0;
for (const a of articles) {
    const url = decodeURIComponent(a.cover_image_url || "");
    if (!url.startsWith("/assets/images/articles/")) { console.warn(`! ${a.slug}: no local cover image`); continue; }
    let src = join(ROOT, url);
    /* already switched to the responsive set: use the largest one as source */
    const m = src.match(/^(.*)-\d+\.webp$/);
    if (m) src = m[1] + "-1672.webp";
    if (!existsSync(src)) { console.warn(`! ${a.slug}: missing ${src}`); continue; }
    for (const w of COVER_WIDTHS) {
        const out = join(DIR, `${a.slug}-${w}.webp`);
        if (existsSync(out)) continue;
        await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
        made++;
    }
    const og = join(DIR, `${a.slug}-og.jpg`);
    if (!existsSync(og)) {
        await sharp(src).resize(1200, 630, { fit: "cover", position: "centre" }).jpeg({ quality: 80, mozjpeg: true }).toFile(og);
        made++;
    }
}
console.log(`${made} image files written for ${articles.length} articles.`);
