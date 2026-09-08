#!/usr/bin/env node

/* =========================================================
   PUBLISH ARTICLE (local-only script)

   Reads a single article JSON object from stdin, validates
   it, and inserts it into the Supabase `articles` table using
   the service_role key (bypasses Row Level Security).

   SECURITY:
   - The service_role key is NEVER hardcoded here. It's read
     at runtime from ~/.config/backyardwithben/secrets.env,
     a location outside this project's (public GitHub) repo.
   - Never pass the key as a CLI argument, never print it or
     any request header, never commit this file with a real
     key value pasted in "temporarily."

   Usage:
     node scripts/publish-article.mjs < article.json
     node scripts/publish-article.mjs --file /path/outside/repo/article.json
========================================================= */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const VALID_CATEGORIES = [
    "gardening",
    "plants-trees",
    "lawn",
    "landscaping",
    "outdoor-living",
    "bbq",
    "diy"
];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;


function fail(message) {
    console.error("ERROR: " + message);
    process.exit(1);
}


function loadSecrets() {

    const path = join(homedir(), ".config", "backyardwithben", "secrets.env");

    let raw;

    try {
        raw = readFileSync(path, "utf-8");
    } catch (error) {
        fail(
            "Could not read " + path + " — create it first with " +
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see scripts/README.md)."
        );
    }

    const values = {};

    raw.split("\n").forEach((line) => {

        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
            return;
        }

        const eqIndex = trimmed.indexOf("=");

        if (eqIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();

        values[key] = value;

    });

    if (!values.SUPABASE_URL || !values.SUPABASE_SERVICE_ROLE_KEY) {
        fail(
            "secrets.env must define both SUPABASE_URL and " +
            "SUPABASE_SERVICE_ROLE_KEY (non-empty)."
        );
    }

    return values;

}


function readStdin() {

    return new Promise((resolve, reject) => {

        let data = "";

        process.stdin.setEncoding("utf-8");

        process.stdin.on("data", (chunk) => {
            data += chunk;
        });

        process.stdin.on("end", () => {
            resolve(data);
        });

        process.stdin.on("error", reject);

    });

}


function validateArticle(article) {

    const required = ["slug", "title", "content_html", "category"];

    for (const field of required) {

        if (!article[field] || typeof article[field] !== "string" || article[field].trim() === "") {
            fail(`Missing or empty required field: "${field}"`);
        }

    }

    if (!SLUG_PATTERN.test(article.slug)) {
        fail(`Invalid slug "${article.slug}" — must be lowercase letters/numbers/hyphens only.`);
    }

    if (!VALID_CATEGORIES.includes(article.category)) {
        fail(`Invalid category "${article.category}" — must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    if (/<script[\s>]/i.test(article.content_html)) {
        fail("content_html must not contain a <script> tag.");
    }

    if (article.published !== undefined && typeof article.published !== "boolean") {
        fail('"published" must be a boolean.');
    }

    if (
        article.read_time_minutes !== undefined &&
        article.read_time_minutes !== null &&
        typeof article.read_time_minutes !== "number"
    ) {
        fail('"read_time_minutes" must be a number or null.');
    }

}


async function main() {

    const fileFlagIndex = process.argv.indexOf("--file");

    const raw =
        fileFlagIndex !== -1 && process.argv[fileFlagIndex + 1]
            ? readFileSync(process.argv[fileFlagIndex + 1], "utf-8")
            : await readStdin();

    let article;

    try {
        article = JSON.parse(raw);
    } catch (error) {
        fail("Input is not valid JSON: " + error.message);
    }

    validateArticle(article);

    const secrets = loadSecrets();

    const payload = {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt || "",
        category: article.category,
        cover_image_url: article.cover_image_url || "",
        cover_image_alt: article.cover_image_alt || "",
        content_html: article.content_html,
        tags: article.tags || null,
        meta_description: article.meta_description || null,
        read_time_minutes: article.read_time_minutes ?? null,
        published: article.published === true
    };

    if (payload.published) {
        payload.published_at = new Date().toISOString();
    }

    let response;

    try {

        response = await fetch(secrets.SUPABASE_URL + "/rest/v1/articles", {
            method: "POST",
            headers: {
                apikey: secrets.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: "Bearer " + secrets.SUPABASE_SERVICE_ROLE_KEY,
                "Content-Type": "application/json",
                Prefer: "return=representation"
            },
            body: JSON.stringify([payload])
        });

    } catch (error) {
        fail("Network error contacting Supabase: " + error.message);
    }

    const bodyText = await response.text();

    if (!response.ok) {

        let parsed = null;

        try {
            parsed = JSON.parse(bodyText);
        } catch (error) {
            /* not JSON, fall through to raw text below */
        }

        if (parsed && parsed.code === "23505") {
            fail(`DUPLICATE_SLUG: "${article.slug}" already exists. Choose a different slug and retry.`);
        }

        fail(`Supabase insert failed (HTTP ${response.status}): ${bodyText}`);

    }

    const inserted = JSON.parse(bodyText)[0];

    console.log(JSON.stringify({
        ok: true,
        slug: inserted.slug,
        id: inserted.id,
        published_at: inserted.published_at,
        url: `https://www.backyardwithben.com/articles/view.html?slug=${inserted.slug}`
    }, null, 2));

}


main();
