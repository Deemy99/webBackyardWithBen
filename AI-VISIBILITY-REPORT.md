# AI Visibility Report: Backyard with Ben

**Site:** https://www.backyardwithben.com
**Prepared:** October 2026
**For:** Site owner (no technical background needed)

This report covers what was changed so AI search tools can read and cite the site, which questions it has a realistic chance of being cited for, and a short monthly routine to check.

Important: no one can guarantee that Google, ChatGPT, Perplexity or any other AI tool will cite a website. These tools give different answers to the same question on different days. The work below improves the *odds*. It does not promise results, and this report contains no traffic or citation numbers, because none have been measured yet.

---

## 1. What was implemented, and why it matters

| Change | What it means in plain terms | Why AI tools care |
|---|---|---|
| **Every guide is now a ready-made HTML page** at `/guides/<slug>` | Before, guide text was loaded by the browser *after* the page opened (from the Supabase database). Some crawlers saw an almost empty page. Now the full text is there when the page is fetched. | This is probably the most important fix. Google AI Overviews and Gemini use Google's index; ChatGPT search and Copilot lean on Bing and OpenAI's own crawler; Perplexity uses its own crawler. Many of these crawlers do not run JavaScript reliably, so if they can't see the text, they can't cite it. |
| **Self-canonical URL** on each guide | Each page tells search engines "this is the official address of this page." | Stops duplicate versions from splitting the page's credibility. |
| **Structured data (Article, Breadcrumb, FAQ)** | Hidden labels that say "this is an article, published on this date, in this section, with these questions and answers." | Helps engines understand what the page is and pull out exact Q&A pairs. Google no longer shows FAQ rich results for most sites, but the markup still describes the content clearly. |
| **Visible "Published" / "Last updated" dates; share tags; responsive WebP images** | Readers and machines can see how fresh the guide is; pages load fast and preview cleanly when shared. | Perplexity and other live-search tools tend to favor content that is clearly dated and current. |
| **"Quick answer" box, Key Takeaways, question-style headings, FAQ, tables, 2–4 internal links** | Each guide opens with a short direct answer and is organized around the questions people actually ask. | AI tools build answers from short, self-contained passages. A clear two- or three-sentence answer under a heading that matches the question is the easiest thing for them to quote. |
| **Organization + WebSite data on the home page** (logo, Facebook link) | Tells engines who runs the site and which social profile belongs to it. | Helps AI tools recognize "Backyard with Ben" as one consistent brand (an "entity") rather than a random page. |
| **ItemList on /tools and /shop** (names and links only) | Lists the picks in a machine-readable way. | **No Product or Review markup was added, on purpose.** Products are not physically tested and no prices are shown, so marking them up as reviews would be misleading and could break Google's guidelines. |
| **/guides marked as a CollectionPage** | Identifies it as the hub for all guides. | Helps engines see how the site is organized. |
| **robots.txt explicitly allows AI and search crawlers** (Googlebot, Google-Extended, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Applebot, Applebot-Extended) | A public "welcome" sign for each crawler by name. | If a crawler is blocked, its AI tool cannot cite the site. Note: Google AI Overviews use regular Googlebot; Google-Extended controls whether content is used for Gemini models. Both are allowed. |
| **/llms.txt and /llms-full.txt** (rebuilt on every update) | A plain summary of the site and every guide, plus a clean text version of all guides. | This is a newer, unofficial convention. Some AI tools and agents read it; the major search engines have not said they use it. It costs nothing to keep and may help. |
| **sitemap.xml from the database** (clean URLs, last-modified dates, images) | A complete, current list of every page. | Helps Google and Bing find new and updated guides quickly. |
| **Bing Webmaster Tools verification placeholder** | A slot (the `BING_VERIFY` setting in `scripts/build.mjs`) waiting for your Bing code. | Bing's index feeds Copilot and is one of the sources behind ChatGPT search. **Not active until you add the code** (see section 4). |

---

## 2. Questions this site should be cited for

These are questions with short, factual answers that a "Quick answer" box can state directly. For each one, open the guide and confirm that its Quick answer or FAQ actually answers this exact question in one to three sentences. If it doesn't, that small edit is worth more than anything else on this list.

| # | Question people ask AI | Best guide |
|---|---|---|
| 1 | Is a gas or charcoal grill better? | `/guides/gas-vs-charcoal-grill` |
| 2 | How long should I grill a steak for medium-rare, and at what temperature? | `/guides/grill-perfect-steak-temperature-timing` |
| 3 | How often should I clean my grill? | `/guides/how-to-clean-a-grill` |
| 4 | When is the best time of year to fertilize a lawn? | `/guides/best-time-to-fertilize-lawn` |
| 5 | When is the best time to overseed a lawn? | `/guides/how-to-overseed-a-lawn` |
| 6 | How do I get rid of weeds without killing my grass? | `/guides/get-rid-of-weeds-in-lawn` |
| 7 | How deep should a raised garden bed be? | `/guides/raised-garden-bed` |
| 8 | What are the easiest vegetables to grow in a raised bed for beginners? | `/guides/best-vegetables-raised-garden-beds-beginners` |
| 9 | How do I get backyard privacy without a fence? | `/guides/backyard-privacy-without-fence` |
| 10 | What are the fastest-growing trees for backyard privacy? | `/guides/best-privacy-trees-for-backyard` |
| 11 | How deep should I plant a tree? | `/guides/how-to-plant-a-tree` |
| 12 | How far from the house should I plant shrubs? | `/guides/landscaping-around-house` |
| 13 | How much does landscaping cost? | `/guides/landscaping-cost-guide` |
| 14 | Is a covered patio or a pergola better? | `/guides/covered-patio-vs-pergola` |
| 15 | How far should a fire pit be from the house? | `/guides/build-backyard-fire-pit` |

A note on cost questions (#13): numbers must be presented as ranges, with the region and date they apply to. Vague or outdated cost figures are a common reason AI tools pick a different source.

---

## 3. Monthly citation check (about 30 minutes)

### Before you start
- Use a **private/incognito browser window** and stay logged out where possible, so your own history doesn't skew results.
- Pick the **same 10 questions** from section 2 each month (rotate the other 5 in every few months). Consistency is what makes month-to-month comparison meaningful.
- Expect variation. The same question can give a different answer an hour later. One check is a snapshot, not a verdict.

### Step by step (~5 minutes per tool)

1. **Google (AI Overviews and AI Mode)**: search the question on google.com. If an AI Overview appears, expand it and look at the source links and cards. Then switch to the **AI Mode** tab and ask again. Note whether backyardwithben.com appears in either.
2. **Gemini** (gemini.google.com): ask the question. Look for source links or the "Sources" / double-check option under the answer.
3. **ChatGPT** (chatgpt.com): make sure **Search** is turned on (the globe/search option), then ask. Check the inline source links and the "Sources" list at the end.
4. **Perplexity** (perplexity.ai): ask the question. Sources are numbered at the top and inline. This is usually the easiest place to see citations.
5. **Microsoft Copilot** (copilot.microsoft.com): ask the question and check the linked sources under the answer.

### Tracking sheet (Google Sheets or Excel)

| Date | Question | Platform | Our site cited? (Yes / Mention / No) | Our URL shown | Position (1st source, 2nd…) | Who else was cited | Notes |
|---|---|---|---|---|---|---|---|

One row per question per platform (10 questions x 5 platforms = 50 rows a month). A monthly count of "Yes" per platform shows the trend.

### Citation vs. mention
- **Citation:** a clickable link to a backyardwithben.com page appears as a source for the answer. This is what you're aiming for.
- **Mention:** the AI names "Backyard with Ben" in its text but doesn't link to it. Record it, since it shows the brand is recognized, but count it separately.
- **Not counted:** the site appears only in ordinary search results below the AI answer. That is regular SEO, which is useful but a different thing.

### When a competitor is cited instead
1. Open the competitor's cited page and write down, in the Notes column, *why* it probably won. Typical reasons: a direct answer in the first sentence, a specific number (temperature, depth, month), a comparison table, a more recent update, or a well-known brand.
2. Compare with our guide. Is the answer just as direct and just as specific? Is it near the top?
3. Make **one honest improvement** (sharpen the Quick answer, add a missing table, add the specific detail), then update the "Last updated" date because the content really changed.
4. Re-check that question next month. Don't copy competitor wording, and don't add claims the site can't support (for example, "we tested this").

---

## 4. Next steps you can take

**1. Keep the brand identity consistent everywhere.**
Use exactly the same name ("Backyard with Ben"), logo and short description on the site, Facebook and any future profile. AI tools connect these signals to decide the brand is one real entity. Also be consistent and open about the host: "Emma" is an AI-generated character, and products are not physically tested. Saying so clearly on the About page builds trust. If that later came out as a surprise, it would cost far more credibility than it saves now.

**2. Add real profiles to the site's "sameAs" list once they exist.**
Right now only Facebook is listed. When you create a Pinterest account (a strong fit for backyard and garden content), YouTube, Instagram or similar, ask your developer to add each one to the Organization data on the home page. Only add profiles that are actually live and active. Empty or placeholder profiles don't help.

**3. Activate Bing Webmaster Tools (recommended).**
Sign up at bing.com/webmasters, choose the meta-tag verification method, and give the code to your developer to place in `BING_VERIFY`. Then submit `https://www.backyardwithben.com/sitemap.xml`. Bing is a key source for Copilot and one of the sources behind ChatGPT search, so this is free and worth doing. You can also import the site from Google Search Console if it's already verified there.
**Optional:** IndexNow, a way to notify Bing (and some other engines) immediately when a page changes. It's helpful but not essential at 34 guides.

**4. Keep "Last updated" honest.**
The date on each guide comes from the database: it changes automatically whenever the article row is edited in Supabase, so you don't set it by hand. That also means you should only edit a guide when the content has meaningfully changed. Changing dates without real edits is easy for engines to spot over time, and it erodes trust. Small typo fixes don't need a new date.

**5. Refresh your top guides on a schedule.**
Every 3–6 months, review the most important guides (start with section 2): Is the Quick answer still accurate and direct? Is seasonal advice correct? Do links work? Are the tool picks still available on Amazon? Seasonal guides (fertilizing, overseeding, when to plant) are best refreshed a few weeks before their season starts.

**6. Earn mentions on other sites over time.**
AI tools trust sources others reference. Genuine mentions in gardening forums or other bloggers' roundups help; paid or spammy links do not.

**7. Give it time.**
Crawlers need weeks to re-read the new pages. Run the first check now as a **baseline** and judge progress over three or more months.
