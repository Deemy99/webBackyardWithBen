#!/usr/bin/env node
/* =========================================================
   scripts/make-logo.mjs — builds the dark-mode navbar logo
   from assets/images/backyardwithbenLOGOaNAZEV.png (never
   modified). Removes the background, recolors with the
   design tokens from css/workshop.css and exports WebP + PNG.

   Needs sharp (not a site dependency):
     npm i --no-save sharp   (or set SHARP_DIR to a folder that has it)
     node scripts/make-logo.mjs
========================================================= */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharp = createRequire(join(process.env.SHARP_DIR || ROOT, "x.js"))("sharp");
const IMG = join(ROOT, "assets/images");

/* colors come from the design tokens */
const css = readFileSync(join(ROOT, "css/workshop.css"), "utf-8");
const tok = (n) => { const m = css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`)); if (!m) throw new Error("token " + n); return m[1]; };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const C = {
    markDark: rgb(tok("wb-accent")),        // ring + trunk
    markLight: rgb(tok("wb-chalk")),        // leaves + fence
    nameDark: rgb(tok("wb-text")),          // BACKYARD
    nameLight: rgb(tok("wb-accent-hover"))  // WITH BEN + rules
};

const { data, info } = await sharp(join(IMG, "backyardwithbenLOGOaNAZEV.png")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const gr = (i) => data[i * 3 + 1] - data[i * 3];            // "greenness"
const lum = (i) => (data[i * 3] * .299 + data[i * 3 + 1] * .587 + data[i * 3 + 2] * .114) / 255;
const INK = { dark: 46, light: 32 };                         // G-R of the two inks
const cls = new Uint8Array(W * H);                           // 0 bg/edge, 1 dark core, 2 light core
for (let i = 0; i < W * H; i++) { const l = lum(i); if (gr(i) > 20) cls[i] = l < .42 ? 1 : (l < .75 ? 2 : 0); }

const NAME_X = Math.round(W * .365);                         // mark | name split
const out = Buffer.alloc(W * H * 4);
const R = 4;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, g = gr(i);
    if (g < 3) continue;
    let c = cls[i];
    if (!c) {                                                // antialiased edge: borrow the nearest core class
        let best = 99;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
            const k = cls[yy * W + xx]; const d = dx * dx + dy * dy; if (k && d < best) { best = d; c = k; }
        }
        if (!c) continue;
    }
    const a = Math.min(1, g / (c === 1 ? INK.dark : INK.light));
    const col = x < NAME_X ? (c === 1 ? C.markDark : C.markLight) : (c === 1 ? C.nameDark : C.nameLight);
    out.set([col[0], col[1], col[2], Math.round(a * 255)], i * 4);
}
const full = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
const meta = await sharp(full).metadata();
const ratio = meta.width / meta.height;
console.log("trimmed", meta.width, meta.height, "ratio", ratio.toFixed(3));

await sharp(full).resize({ height: 300 }).png({ compressionLevel: 9 }).toFile(join(IMG, "logo-dark-master.png"));
for (const h of [48, 96, 144]) {
    const buf = await sharp(full).resize({ height: h }).toBuffer();
    await sharp(buf).png({ compressionLevel: 9, palette: false }).toFile(join(IMG, `logo-dark-h${h}.png`));
    await sharp(buf).webp({ quality: 90, alphaQuality: 100 }).toFile(join(IMG, `logo-dark-h${h}.webp`));
}
console.log("width at h48:", Math.round(48 * ratio));
