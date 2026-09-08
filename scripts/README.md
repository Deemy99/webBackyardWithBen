# scripts/publish-article.mjs

Local-only tool that inserts a new row into the Supabase `articles`
table using the **service_role** key (bypasses Row Level Security).
This script is safe to keep in this public repo — it contains no
secret values, only logic. It reads the actual key at runtime from a
file **outside** this project.

## One-time setup (do this yourself, not via Claude)

This repo is connected to a **public** GitHub remote with no
`.gitignore`. The service_role key must never exist inside this
project folder, even temporarily — one `git add`/commit/push and it
becomes permanently public.

1. Create the config directory outside the project:
   ```bash
   mkdir -p ~/.config/backyardwithben
   chmod 700 ~/.config/backyardwithben
   ```
2. Create `~/.config/backyardwithben/secrets.env` with:
   ```
   SUPABASE_URL=https://opdwpgezipwagjflremz.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<paste your real service_role key here>
   ```
   Get the service_role key from Supabase → Project Settings → API →
   Secret keys. **Never paste this key into a Claude Code session or
   any file inside this project.**
3. Lock down the file:
   ```bash
   chmod 600 ~/.config/backyardwithben/secrets.env
   ```

## Usage

```bash
node scripts/publish-article.mjs < article.json
```

`article.json` is a single JSON object with fields matching the
`articles` table: `slug`, `title`, `excerpt`, `category`,
`cover_image_url`, `cover_image_alt`, `content_html`, `tags`,
`meta_description`, `read_time_minutes`, `published`.

On success, prints the inserted article's `slug`, `id`,
`published_at` and live URL as JSON. On a duplicate `slug`, it fails
loudly (does not overwrite the existing article) — pick a different
slug and retry.

## What this script will never do

- Never accept the key as a CLI argument or print it to the console.
- Never hardcode a real key value in this file.
- Never install `@supabase/supabase-js` or any dependency — uses
  Node's built-in `fetch` only.
- Never silently overwrite an existing article on a slug collision.
