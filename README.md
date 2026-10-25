# TNewIQ

**TNewIQ** (short for TechNewsIQ).

A personal technology radar. It collects the latest headlines from public RSS and Atom feeds every hour and presents them in a multilingual, installable web app (PWA). It always shows the original headline, source, date and link.

> **Status:** the data pipeline, tests and app logic work. The visual design is waiting for approval, so the interface is a plain, unstyled shell for now. See the design proposal: three directions (A Signal, B Edition, C Pocket), with B recommended.

- Interface languages: English, ខ្មែរ (Khmer), 简体中文 (Simplified Chinese), 한국어 (Korean)
- Eight topics: Artificial Intelligence, Cybersecurity, Developer Tools, Programming Languages, Cloud & Infrastructure, Startups & Products, Research Papers, Mobile & Hardware
- Cost: $0. Static hosting on GitHub Pages, scheduled collection on GitHub Actions, bookmarks and settings in the browser. No database, no paid APIs, no AI services.

## How it works

```
sources/sources.json ──► scripts/ingest (GitHub Actions, hourly)
   allowlisted feeds         fetch → parse → sanitize → normalize → classify → dedupe → merge
                                                │
                                                ▼
                                  public/data/articles.json  (committed only when it changes)
                                                │
                                                ▼
                         Vite build ──► GitHub Pages ──► React PWA (service worker caches data)
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

29 feeds, each checked on 2026-10-25 and found to return valid RSS or Atom. They are listed in `sources/sources.json` with their homepages.

- **AI:** OpenAI News, Google AI Blog, Hugging Face Blog
- **Cybersecurity:** CISA Cybersecurity Advisories, Krebs on Security, The Hacker News
- **Developer tools:** The GitHub Blog, VS Code Blog, NAVER D2 (ko), 우아한형제들 기술블로그 (ko), 开源中国 (zh-CN), 阮一峰的网络日志 (zh-CN)
- **Languages:** Rust Blog, The Go Blog, Python Insider, TypeScript Blog, Node.js Releases
- **Cloud:** Kubernetes Blog, Docker Blog, AWS What's New, The Cloudflare Blog
- **Startups and products:** TechCrunch Startups, Product Hunt
- **Research:** arXiv cs.AI, cs.CR and cs.LG (via the arXiv API, with 3.5 s between requests)
- **Mobile and hardware:** Apple Newsroom, Android Developers Blog, Ars Technica Gadgets

Dropped after checking: InfoQ China and 36Kr (they serve HTML, not a feed). No Khmer-language technology feed has been verified yet.

TNewIQ stores only metadata, a short excerpt and the link, and sends readers to the original article. Review each publisher's terms of use before you publicise the site.

To add a source, add an entry to `sources/sources.json` (HTTPS feed URL, homepage, language, one or two topics) and run `npm run ingest`. If the feed redirects to another host, list that host in `allowedRedirectHosts`.

## Development

Requires Node 22 or later.

```bash
npm install
npm run ingest      # fetch real feeds into public/data
npm run dev         # http://localhost:5173/tnewiq/
npm run check       # lint + typecheck + tests + build
```

| Script | Purpose |
| --- | --- |
| `npm run ingest` | Run the collector locally. Writes files only if the content changed. |
| `npm test` | Vitest: ingestion, i18n, search, bookmarks, translation links, manifest, app behaviour. |
| `npm run build` | Type check and production build to `dist/`. |
| `npx pwa-assets-generator` | Regenerate PWA icons from `public/favicon.svg`. |

Set `BASE_PATH=/` when building for a host that serves from the domain root. No other environment variables or secrets are used, so there is no `.env.example`.

Test fixtures live in `tests/fixtures` and `tests/app/fixtures.ts`, are clearly marked as not real, and are never part of the production build.

## Deployment (GitHub Pages)

The code lives at `https://github.com/Chingmony/tnewiq` (public) and the site will be served at `https://chingmony.github.io/tnewiq/`.

1. Keep the repository **public**: free GitHub Pages and unlimited Actions minutes depend on it.
2. Make sure `main` is the default branch (**Settings → General → Default branch**). The workflows run on `main`.
3. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Open **Settings → Actions → General → Workflow permissions** and choose **Read and write permissions**, so the collector can commit data.
5. Run **Actions → Ingest → Run workflow** once to test it.

Workflows:

- `.github/workflows/ingest.yml` runs every hour at minute 17, and on demand. It commits `public/data` only when the content changed, then calls the deploy workflow. A single failing source does not stop the run; the run fails only if every source fails. Each run writes a per-source table to the job summary.
- `.github/workflows/deploy.yml` runs on every push to `main`. It lints, type checks, tests, builds and publishes to Pages.

GitHub may delay scheduled runs at busy times, and it disables scheduled workflows in repositories with no activity for 60 days. The hourly data commits normally count as activity.

## PWA and offline use

- Installable: the manifest has 192 px, 512 px and maskable icons, `display: standalone`, and start URL and scope set to `/tnewiq/`.
- The service worker precaches the app shell. Article data is fetched network-first and falls back to the last cached copy when offline.
- When offline, the app says so and shows the cached stories and the time they were last downloaded. Bookmarks live in `localStorage` and work offline.
- New versions are not swapped in silently. A banner offers **Reload**.
- Installing: on Android in Chrome, use **Install app** (or the button in Settings). On iPhone and iPad in Safari, tap **Share → Add to Home Screen**. On desktop Chrome or Edge, use the install icon in the address bar.
- Background refresh while the app is closed is not promised. Data refreshes when the app is opened.

## Translation

Articles are always shown in their original language. When an article's language differs from the interface language, two options appear:

- **Translate page in Google Translate** opens the public article URL in Google Translate, in a new tab. Only that URL is sent.
- **Copy headline and excerpt** copies the text so you can use any translator you choose.

TNewIQ does not translate anything itself and never claims to.

## Privacy and security

- No accounts, analytics or tracking. Bookmarks and preferences stay in your browser.
- Feed content is treated as untrusted. It is reduced to plain text at ingestion, validated again in the browser, and rendered as text by React. No HTML from feeds is ever injected into the page.
- Links must be `http(s)`; images must be `https`. External links use `rel="noopener noreferrer"`.
- The collector only requests allowlisted HTTPS hosts, including on redirects.

## Known limitations

- **Design pending:** the interface is unstyled until a design direction is approved. Fonts, colours and the app icon are placeholders.
- No verified Khmer-language technology feed yet.
- The Khmer, Chinese and Korean interface text was written without a native-speaker review. Khmer in particular should be checked.
- Some feeds omit dates (shown as "date not provided") or block automated requests at times (the Woowahan blog returned HTTP 403 on one run). A failing source keeps its earlier articles.
- Topic keywords are simple rules and can occasionally misclassify an item.
- arXiv publishes no new listings on weekends, so research items pause then.
- The JavaScript bundle is about 106 kB gzipped and can be reduced later, for example with `zod/mini`.
