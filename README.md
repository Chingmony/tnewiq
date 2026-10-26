# TNewIQ

**TNewIQ** (short for TechNewsIQ).

A personal technology radar. It collects the latest headlines from public RSS and Atom feeds every hour and presents them in a multilingual, installable web app (PWA). It always shows the original headline, source, date and link.

> **Design:** orange-led palette — Orange `#FF933E`, Sun `#FFCB56`, Cream `#FFE9A9`, Sky `#73A5CA` — with Bricolage Grotesque headings, Figtree body text and Kantumruy Pro for Khmer (all self-hosted). Light and dark themes; darker orange and sky tones are used for small text so it stays readable.

- Interface languages: English, ខ្មែរ (Khmer), 简体中文 (Simplified Chinese), 한국어 (Korean)
- Eight topics: Artificial Intelligence, Cybersecurity, Developer Tools, Programming Languages, Cloud & Infrastructure, Startups & Products, Research Papers, Mobile & Hardware
- Cost: $0. Static hosting on Vercel (Hobby), scheduled collection on GitHub Actions, bookmarks and settings in the browser. No database and no paid APIs. Optional AI briefings use the Gemini API free tier (see [Story pages and AI briefings](#story-pages-and-ai-briefings)).

## How it works

```
sources/sources.json ──► scripts/ingest (GitHub Actions, hourly)
   allowlisted feeds         fetch → parse → sanitize → normalize → classify → dedupe → merge
                                                │
                                                ▼
                                  public/data/articles.json  (committed only when it changes)
                                                │
                                                ├──► scripts/insights (optional, Gemini free tier)
                                                │       → public/data/insights/<id>.json
                                                ▼
                         Vite build ──► Vercel ──────► React PWA (service worker caches data)
```

| Path | What it does |
| --- | --- |
| `sources/sources.json` | The allowlist of feeds. Nothing else is ever fetched. |
| `scripts/ingest/fetchFeed.ts` | HTTPS only, allowlisted hosts only (checked on every redirect), 20 s timeout, 8 MB cap. |
| `scripts/ingest/parseFeed.ts` | RSS 2.0, RSS 1.0 (RDF) and Atom. Rejects invalid XML and entity declarations. |
| `scripts/ingest/normalize.ts` | Plain-text titles and excerpts (280 characters max), canonical URLs without tracking parameters, UTC dates. Unknown dates stay `null`. |
| `scripts/ingest/classify.ts` | Deterministic topics: the source's topic first, then keyword rules on the headline (English, Korean, Chinese, Khmer). |
| `scripts/ingest/dedupe.ts`, `merge.ts` | Removes duplicate URLs and syndicated headlines, keeps first-seen dates, keeps 30 days or 1,500 articles. |
| `src/shared/article.ts` | The versioned data schema (zod), shared by the collector and the app. |
| `src/locales/*.json` | All interface text, one file per language. |
| `src/lib`, `src/hooks` | Data loading and validation, search, filters, bookmarks, translation links, install prompt. |

### Article record

```jsonc
{
  "id": "9f546203b6c706e9",          // sha-256 of the canonical URL (16 hex)
  "sourceId": "woowahan-techblog",
  "sourceName": "우아한형제들 기술블로그",
  "originalTitle": "…",
  "originalUrl": "https://techblog.woowahan.com/27864/",
  "originalLanguage": "ko",          // from the source config
  "originalDescription": "…",        // short plain-text excerpt, or null
  "publishedAt": "2026-10-21T07:56:08.000Z", // null when the feed gives no valid date
  "discoveredAt": "2026-10-25T13:43:48.608Z",
  "topics": ["developer-tools"],
  "imageUrl": null,                  // https only, or null
  "contentHash": "26ee3f0f760f6c76"  // changes when the title or excerpt changes
}
```

## Sources

61 feeds, each checked on 2026-10-25 or 2026-10-26 and found to return valid RSS or Atom. They are listed in `sources/sources.json` with their homepages.

- **AI labs and companies:** OpenAI News, Anthropic News, Research and Engineering\*, Engineering at Meta (AI), Meta Newsroom, Google AI Blog, Google DeepMind Blog, Google Research Blog, Microsoft Research Blog, Hugging Face Blog, NVIDIA Blog, NVIDIA Technical Blog, AWS Machine Learning Blog
- **AI news:** TechCrunch AI, The Verge AI, MIT Technology Review AI, Ars Technica AI, The Decoder, 量子位 (zh-CN), AI타임스 (ko)
- **AI analysis:** Simon Willison's Weblog, Import AI, Latent Space

\* Anthropic publishes no feed of its own. These three come from the community project [Olshansk/rss-feeds](https://github.com/Olshansk/rss-feeds), which turns anthropic.com pages into RSS. Links still lead to anthropic.com, but the feeds may lag or stop if that project changes. Meta AI's own site (ai.meta.com) has no feed and its robots.txt forbids automated collection without permission, so Meta is covered through its official Newsroom and Engineering blog feeds instead.
- **Cybersecurity (official):** CISA Cybersecurity Advisories, CISA News, NIST CSRC Drafts Open for Comment, NIST Cybersecurity Insights, MITRE ATLAS Releases, MITRE ATT&CK Releases, MITRE ATT&CK Blog, OWASP Gen AI Security Project, OWASP ASVS Releases, NCSC (UK), CERT/CC Vulnerability Notes
- **Cybersecurity (news):** Krebs on Security, The Hacker News
- **Developer tools:** The GitHub Blog, VS Code Blog, NAVER D2 (ko), 우아한형제들 기술블로그 (ko), 开源中国 (zh-CN), 阮一峰的网络日志 (zh-CN)
- **Languages:** Rust Blog, The Go Blog, Python Insider, TypeScript Blog, Node.js Releases
- **Cloud:** Kubernetes Blog, Docker Blog, AWS What's New, The Cloudflare Blog
- **Startups and products:** TechCrunch Startups, Product Hunt
- **Research:** arXiv cs.AI, cs.CL, cs.CR and cs.LG (via the arXiv API, with 3.5 s between requests)
- **Mobile and hardware:** Apple Newsroom, Android Developers Blog, Ars Technica Gadgets

Dropped after checking: InfoQ China and 36Kr (they serve HTML, not a feed); Mistral (no public feed); OWASP's main site and NIST's cybersecurity news feed (no feed, or an empty one; OWASP and NIST are covered by the project and publication feeds above); Google Project Zero (its feed is over the 8 MB limit); Hugging Face Papers (needs sign-in); VentureBeat (blocks automated requests). No Khmer-language technology feed has been verified yet.

TNewIQ stores only metadata, a short excerpt and the link, and sends readers to the original article. Review each publisher's terms of use before you publicise the site.

To add a source, add an entry to `sources/sources.json` (HTTPS feed URL, homepage, language, one or two topics) and run `npm run ingest`. If the feed redirects to another host, list that host in `allowedRedirectHosts`. If its dates have no time zone (for example `2026-10-26 18:52:33`), set `utcOffset` (for example `"+09:00"`).

## Development

Requires Node 22 or later.

```bash
npm install
npm run ingest      # fetch real feeds into public/data
npm run dev         # http://localhost:5173/tnewiq/  (the site root on Vercel)
npm run check       # lint + typecheck + tests + build
```

| Script | Purpose |
| --- | --- |
| `npm run ingest` | Run the collector locally. Writes files only if the content changed. |
| `npm run insights` | Write AI briefings locally (needs `GEMINI_API_KEY` in the environment). |
| `npm test` | Vitest: ingestion, i18n, search, bookmarks, translation links, manifest, app behaviour. |
| `npm run build` | Type check and production build to `dist/`. |
| `npx pwa-assets-generator` | Regenerate PWA icons from `public/favicon.svg`. |

Set `BASE_PATH=/` when building for a host that serves from the domain root. The only other variables are `GEMINI_API_KEY` and the optional `GEMINI_MODEL`, used by `npm run insights` (see [AI briefings](#story-pages-and-ai-briefings)). The site itself needs no secrets.

Test fixtures live in `tests/fixtures` and `tests/app/fixtures.ts`, are clearly marked as not real, and are never part of the production build.

## Deployment (Vercel)

The code lives at `https://github.com/Chingmony/tnewiq` (public) and is deployed on Vercel's free Hobby plan, which is for personal, non-commercial projects.

**One-time setup**

1. In Vercel, choose **Add New → Project** and import `Chingmony/tnewiq` from GitHub. If it is not listed, allow the Vercel GitHub app to access the repository.
2. Leave the detected settings as they are (framework Vite, build `npm run build`, output `dist`, all set in `vercel.json`). No environment variables are needed. Vercel sets `VERCEL=1`, so the site is built for the domain root.
3. Deploy.
4. On GitHub, open **Settings → Actions → General → Workflow permissions** and choose **Read and write permissions**, so the collector can commit data.
5. Run **Actions → Ingest → Run workflow** once to test the full loop.

**How stories stay current**

1. `.github/workflows/ingest.yml` runs every hour at minute 17, and on demand. It commits `public/data` only when the content changed. A single failing source does not stop the run; the run fails only if every source fails. Each run writes a per-source table to the job summary.
2. Vercel redeploys on every push to `main`, including those data commits, usually within a minute or two.
3. `/data/*.json` is served with `max-age=0, must-revalidate`, the app fetches it with `no-cache`, and the service worker is network-first. An app left open re-downloads stories when it returns to view after 15 minutes.
4. "Stories updated …" in the app is the time the collected content last changed, not the time of the last check.

`.github/workflows/ci.yml` lints, type checks, tests and builds every code push and pull request.

GitHub may delay scheduled runs at busy times, and it disables scheduled workflows in repositories with no activity for 60 days. The hourly data commits normally count as activity.

## Story pages and AI briefings

Selecting a headline opens a story page (`#story/<id>`) with the title, source, dates, topics, the publisher's own excerpt, **Read original**, bookmark, share, translate-page and related stories.

When available, the page also shows an **AI briefing** in the interface language: a translated title, a summary, "why it matters" and key points, in English, Khmer, Simplified Chinese and Korean.

- **Written by:** the Gemini API free tier, inside the hourly GitHub Action (`scripts/insights`). Never in the browser.
- **Input:** only the headline and the text the publisher includes in its feed (`.cache/feed-context.json`, never committed), or the short excerpt when that is all there is. The prompt forbids adding facts and treats feed text as data, not instructions.
- **Checks:** every response is validated (all four languages present, each in the right script, plain text only) before it is saved to `public/data/insights/<id>.json`.
- **Labelling:** briefings carry a "Source & AI disclosure" note saying they are AI-generated and pointing readers to the original. The model that wrote each one is recorded in its file. The original title and excerpt are always shown too.
- **Limits:** newest stories first, 40 per run (change it with the `INSIGHTS_MAX_PER_RUN` Actions variable), one request every 6.5 s. The model's "thinking" step is turned off so answers arrive quickly; a model that takes longer than 120 s is skipped in favour of the next one. A run stops when Google reports the quota is used up; the rest wait for the next run. Collecting stories never depends on this step.
- **Cost:** $0 on the free tier. Google never bills unless you attach billing to the key's project yourself. On the free tier, Google may use what it receives (public article text) to improve its products.

### Turn it on

1. Create a free API key at https://aistudio.google.com/apikey. No card is needed; do not enable billing.
2. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `GEMINI_API_KEY` and paste the key.
3. Optional: under **Variables**, add `GEMINI_MODEL` to choose models, comma-separated and tried in order (default `gemini-flash-latest,gemini-flash-lite-latest`). When Google answers "overloaded" (HTTP 503), the generator waits and retries, then falls back to the next model, then leaves the rest for the next run.
4. Optional: add `INSIGHTS_MAX_PER_RUN` to change how many briefings each hourly run writes (default 40). Raising it never costs money on the free tier; once the daily quota is used up, the rest simply wait for the next run.
5. Run **Actions → Ingest → Run workflow**. The job summary lists how many briefings were written.

Without the secret the step is skipped and story pages say the briefing isn't ready yet.

## PWA and offline use

- Installable: the manifest has 192 px, 512 px and maskable icons, `display: standalone`, and start URL and scope set to the site root on Vercel (`/tnewiq/` for a GitHub Pages build).
- The service worker precaches the app shell. Article data is fetched network-first and falls back to the last cached copy when offline.
- When offline, the app says so and shows the cached stories and the time they were last downloaded. Bookmarks live in `localStorage` and work offline.
- New versions are not swapped in silently. A banner offers **Reload**.
- Installing: on Android in Chrome, use **Install app** (or the button in Settings). On iPhone and iPad in Safari, tap **Share → Add to Home Screen**. On desktop Chrome or Edge, use the install icon in the address bar.
- Background refresh while the app is closed is not promised. Data refreshes when the app is opened.

## Translation

Articles are always shown in their original language. When an article's language differs from the interface language, two options appear:

- **Translate page in Google Translate** opens the public article URL in Google Translate, in a new tab. Only that URL is sent.
- **Copy headline and excerpt** copies the text so you can use any translator you choose.

Article pages are not translated by TNewIQ. The only exception is the optional, clearly labelled [AI briefing](#story-pages-and-ai-briefings), which includes a translated title and summary.

## Privacy and security

- No accounts, analytics or tracking. Bookmarks and preferences stay in your browser.
- Feed content is treated as untrusted. It is reduced to plain text at ingestion, validated again in the browser, and rendered as text by React. No HTML from feeds is ever injected into the page.
- Links must be `http(s)`; images must be `https`. External links use `rel="noopener noreferrer"`.
- The collector only requests allowlisted HTTPS hosts, including on redirects.

## Known limitations

- Chinese and Korean text use the device's own fonts (PingFang, Microsoft YaHei, Apple SD Gothic Neo, Malgun Gothic, Noto) to keep downloads small.
- Some browsers lack Khmer date data, so Khmer dates and relative times use a built-in fallback.
- No verified Khmer-language technology feed yet.
- The Khmer, Chinese and Korean interface text was written without a native-speaker review. Khmer in particular should be checked.
- Some feeds omit dates (shown as "date not provided") or block automated requests at times (the Woowahan blog returned HTTP 403 on one run). A failing source keeps its earlier articles.
- Topic keywords are simple rules and can occasionally misclassify an item.
- arXiv publishes no new listings on weekends, so research items pause then.
- The JavaScript bundle is about 106 kB gzipped and can be reduced later, for example with `zod/mini`.
