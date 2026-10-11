/* =========================================================
   scripts/lib/articles.mjs — read published articles

   Read-only, with the public publishable key from
   js/supabase-config.js (Row Level Security only lets it read
   published rows). SUPABASE_URL / SUPABASE_ANON_KEY environment
   variables override it. Never put the service_role key here.
========================================================= */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function publicConfig() {
    const js = readFileSync(join(ROOT, "js/supabase-config.js"), "utf-8");
    const pick = (name) => (js.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`)) || [])[1];
    return {
        url: process.env.SUPABASE_URL || pick("SUPABASE_URL"),
        key: process.env.SUPABASE_ANON_KEY || pick("SUPABASE_ANON_KEY")
    };
}

export async function fetchPublishedArticles() {
    /* offline/preview builds: ARTICLES_JSON=/path/to/rows.json npm run build */
    if (process.env.ARTICLES_JSON) return JSON.parse(readFileSync(process.env.ARTICLES_JSON, "utf-8"));
    const { url, key } = publicConfig();
    if (!url || !key) throw new Error("Supabase URL or public key not found");
    const res = await fetch(`${url}/rest/v1/articles?select=*&published=eq.true&order=published_at.desc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!res.ok) throw new Error(`Supabase returned HTTP ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error("Unexpected Supabase response");
    return rows;
}
