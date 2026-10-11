#!/usr/bin/env node
/* =========================================================
   UPDATE ARTICLES (local-only script)

   Updates existing rows in the Supabase `articles` table, e.g.
   after an SEO pass. Supabase stays the single source of truth;
   the site is rebuilt from it on Vercel.

   Input: a JSON array of { "slug": "...", <fields to change> }.
   Only these fields can be changed: title, excerpt,
   meta_description, cover_image_url, cover_image_alt,
   content_html, read_time_minutes. Never slug, category,
   published or dates (updated_at is set to now on every change).

   Dry run by default: prints what would change. With --apply it
   first saves a backup of the current rows to
   ~/.config/backyardwithben/backups/ (outside the repo), then
   PATCHes row by row and checks that exactly one row changed.

   SECURITY: same as publish-article.mjs. The service_role key is
   read at runtime from ~/.config/backyardwithben/secrets.env and is
   never printed, logged or passed on the command line.

   Usage:
     node scripts/update-articles.mjs --file /path/outside/repo/updates.json
     node scripts/update-articles.mjs --file /path/outside/repo/updates.json --apply
========================================================= */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FIELDS = ["title", "excerpt", "meta_description", "cover_image_url", "cover_image_alt", "content_html", "read_time_minutes"];
const CONFIG_DIR = join(homedir(), ".config", "backyardwithben");

function fail(message) {
    console.error("ERROR: " + message);
    process.exit(1);
}

function loadSecrets() {
    let raw;
    try {
        raw = readFileSync(join(CONFIG_DIR, "secrets.env"), "utf-8");
    } catch (error) {
        fail("Could not read ~/.config/backyardwithben/secrets.env (see scripts/README.md).");
    }
    const values = {};
    for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#") || !t.includes("=")) continue;
        values[t.slice(0, t.indexOf("=")).trim()] = t.slice(t.indexOf("=") + 1).trim();
    }
    if (!values.SUPABASE_URL || !values.SUPABASE_SERVICE_ROLE_KEY) {
        fail("secrets.env must define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
    return values;
}

const words = (html) => String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

async function main() {
    const fileIndex = process.argv.indexOf("--file");
    if (fileIndex === -1 || !process.argv[fileIndex + 1]) fail("Usage: --file updates.json [--apply]");
    const apply = process.argv.includes("--apply");

    let updates;
    try {
        updates = JSON.parse(readFileSync(process.argv[fileIndex + 1], "utf-8"));
    } catch (error) {
        fail("Could not read the updates file: " + error.message);
    }
    if (!Array.isArray(updates) || !updates.length) fail("The updates file must be a non-empty JSON array.");

    for (const u of updates) {
        if (!u || typeof u.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(u.slug)) fail("Every update needs a valid slug.");
        const extra = Object.keys(u).filter((k) => k !== "slug" && !FIELDS.includes(k));
        if (extra.length) fail(`${u.slug}: fields not allowed: ${extra.join(", ")}`);
        if ("content_html" in u && (typeof u.content_html !== "string" || words(u.content_html) < 300)) fail(`${u.slug}: content_html is missing or suspiciously short.`);
        if ("title" in u && !String(u.title || "").trim()) fail(`${u.slug}: empty title.`);
    }

    const secrets = loadSecrets();
    const headers = {
        apikey: secrets.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: "Bearer " + secrets.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json"
    };

    const slugs = updates.map((u) => u.slug);
    const res = await fetch(`${secrets.SUPABASE_URL}/rest/v1/articles?select=*&slug=in.(${slugs.join(",")})`, { headers });
    if (!res.ok) fail(`Could not read the current rows (HTTP ${res.status}).`);
    const current = new Map((await res.json()).map((r) => [r.slug, r]));
    const missing = slugs.filter((s) => !current.has(s));
    if (missing.length) fail("No article with slug: " + missing.join(", "));

    const plan = updates.map((u) => {
        const row = current.get(u.slug);
        const changed = FIELDS.filter((f) => f in u && u[f] !== row[f]);
        return { u, row, changed };
    });
    for (const { u, row, changed } of plan) {
        const wc = changed.includes("content_html") ? ` (words ${words(row.content_html)} -> ${words(u.content_html)})` : "";
        console.log(`${u.slug}: ${changed.length ? changed.join(", ") + wc : "no changes"}`);
    }
    const todo = plan.filter((p) => p.changed.length);
    if (!apply) {
        console.log(`\nDry run: ${todo.length} of ${plan.length} articles would change. Add --apply to write.`);
        return;
    }

    mkdirSync(join(CONFIG_DIR, "backups"), { recursive: true, mode: 0o700 });
    const backup = join(CONFIG_DIR, "backups", `articles-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    writeFileSync(backup, JSON.stringify(plan.map((p) => p.row), null, 2), { mode: 0o600 });
    console.log(`\nBackup of ${plan.length} current rows: ${backup}`);

    let done = 0;
    for (const { u, changed } of todo) {
        const body = Object.fromEntries(changed.map((f) => [f, u[f]]));
        body.updated_at = new Date().toISOString();
        const r = await fetch(`${secrets.SUPABASE_URL}/rest/v1/articles?slug=eq.${u.slug}`, {
            method: "PATCH", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(body)
        });
        const text = await r.text();
        if (!r.ok) fail(`${u.slug}: update failed (HTTP ${r.status}): ${text.slice(0, 300)}. ${done} articles were updated before this; restore from the backup if needed.`);
        const rows = JSON.parse(text);
        if (rows.length !== 1) fail(`${u.slug}: expected 1 updated row, got ${rows.length}.`);
        done++;
    }
    console.log(`Updated ${done} articles. Redeploy on Vercel (or let the Supabase webhook do it) to publish the changes.`);
}

main();
