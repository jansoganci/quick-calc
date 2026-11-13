# SEO + LLM discoverability — prerender plan

**Status:** Plan only. Not authorised to implement. No code, no deploy, no new dependency until the owner approves this document and an implementation PR.
**Date:** 13 November 2026
**Audience:** product owner (Can) + whoever implements after approval
**Hard rules (unchanged):** no backend, no secrets, no deploy in the planning/implementation PRs unless the owner asks, no paid Cloudflare product, no runtime cost, Turkish only, static assets only.

This is an implementation plan, not a financial specification and not permission to code.

---

## 0. Why this exists

Today maliyet.lol is a Vite 6 + React 18 SPA on **Cloudflare Workers Static Assets** (free plan). `wrangler.jsonc` has **no Worker `main` script**. It only serves `./dist` with `not_found_handling: "single-page-application"`.

Crawlers that do not run JavaScript currently see:

- one HTML document (`index.html`) at `https://maliyet.lol/`
- a static “Hakkında” + FAQ block **outside** `#root` (deliberate — React never touches it)
- one `WebApplication` and one `FAQPage` JSON-LD block
- `public/robots.txt` (`User-agent: *` / `Allow: /`)
- `public/sitemap.xml` (only `/`)
- `public/llms.txt`

They **do not** see Hızlı Hesap, Detaylı Hesap, or Simülasyonlar as separate URLs. Area switching lives in the **hash** (`#quick`, `#detailed-feasibility`, `#simulations`, plus Detaylı suffixes). The fragment is never sent to Cloudflare and never appears in a sitemap. Google, Bing, GPTBot, and similar fetch `/`. They get the shell + the footer FAQ, not per-area HTML.

The owner-approved direction: **prerender real paths at build time**, stay 100% static, keep the calculator hydrating in the browser, keep `localStorage` drafts.

Keyword research is **out of this plan**. The owner does that later. This document leaves a rehber template and two placeholder slugs.

---

## 1. Prerender approach

### 1.1 Constraint that decides the option

| Must | Must not |
| --- | --- |
| HTML for each public URL exists in `dist/` after `npm run build` | A Worker that renders on request |
| `curl https://maliyet.lol/detayli-hesap` returns Turkish content without executing JS | SSR, edge rendering, Cloudflare Browser Rendering, prerender.io, Rendertron |
| Calculator still hydrates; drafts still `localStorage` | New paid service, KV, D1, R2, Durable Objects |
| No `main` Worker unless hosting itself requires one (it does not today) | React Router unless the owner later approves a new dependency |

`react-dom/server` (`renderToString`) is **already inside `react-dom`**. It is not a new package.

### 1.2 Options

#### A. Custom build-time `renderToString` script (recommended)

After the existing client `vite build`, a small Node script (Vite SSR build of one `src/entry-server.tsx`, then `node scripts/prerender.mjs`) renders each known path and writes:

```
dist/index.html
dist/hizli-hesap/index.html
dist/detayli-hesap/index.html
dist/detayli-hesap/malzemeler/index.html
dist/detayli-hesap/satis/index.html
dist/detayli-hesap/giderler/index.html
dist/detayli-hesap/sonuc/index.html
dist/simulasyonlar/index.html
dist/rehber/<slug>/index.html
dist/404.html
```

The script injects the string into `#root` of the Vite HTML template and replaces `<title>`, meta, canonical, OG, and JSON-LD per path.

**Pros**

- Zero new runtime dependencies. Zero new devDependencies if the script uses `vite build --ssr` (Vite is already a devDependency) and Node (already used for the build).
- No React Router. Path parsing stays the same tiny helper the app already uses for hashes (`areaFromLocationHash` becomes `areaFromLocation`, reading `pathname` instead of `hash`). Architecture D4 / “no router” stays true.
- We control exactly which paths exist. No plugin crawling random `<a href>`.
- Matches “100% static, no Worker code, no request-time SSR”.
- Easy to test: `curl dist/detayli-hesap/index.html` in CI.

**Cons**

- We own the script. `window` / `localStorage` / `matchMedia` must be guarded so the server entry does not throw (Detailed draft already guards `localStorage`; the hook must not run `window` at module scope — today `useDetailedCalc` touches `window` only inside effects and event handlers, which `renderToString` does not run. Verify; add `typeof window === 'undefined'` only where a render actually touches the DOM).
- Two Vite builds (client + ssr). Build gets slower. Still free, still local.
- Hydration must match the prerendered markup (Quick’s seeded example form must be the same on server and first client render).

**New dependencies to approve:** **none**, if implemented as above.

If the SSR step is awkward without a runner, the fallback is one **devDependency**: `vite-node` (or running the script through `npx tsx`). That still needs an explicit owner yes. Do not add it in the first implementation PR unless the no-extra-package path fails.

#### B. `vite-prerender-plugin` (`vite-prerender-plugin`, Preact org, Vite 5/6/7)

You export `prerender()`; the plugin injects HTML into `renderTarget: '#root'`.

**Pros:** maintained, Vite 6 listed, small API.

**Cons:** **new devDependency**. Their React example uses `react-router-dom` + `StaticRouter`. We would still write our own `prerender()` and would still not need a router, but we pay for a plugin whose main trick is “call our function and write files” — which the custom script already does. Extra moving part for a three-area site.

**New dependencies:** `vite-prerender-plugin`. Owner must approve.

#### C. `vite-react-ssg`

SSG for React on Vite. Docs tell React Router v7 users to use RR’s own SSG; the package targets React Router v6.

**Pros:** batteries included.

**Cons:** **new devDependency**, pulls toward React Router, more abstraction than this app wants (AGENTS.md: no generic form frameworks / speculative stacks). Overkill.

**New dependencies:** `vite-react-ssg` + almost certainly `react-router-dom`. Reject unless the owner later wants a router.

#### D. Other names (`vite-plugin-prerender`, Puppeteer/Playwright snapshot, Cloudflare Browser Rendering)

- Older `vite-plugin-prerender` packages are a graveyard of abandoned forks. Do not pick one by name without checking the npm page on the implementation day.
- Headless-browser snapshot: new heavy devDependency, slower CI, still “static HTML” but worse than `renderToString` for a deterministic form.
- Cloudflare Browser Rendering / prerender.io: **paid / request-time**. Disallowed.

### 1.3 Recommendation

**Option A.** Custom prerender using `react-dom/server`’s `renderToString`, Vite’s own SSR build, no React Router, no Worker, no new packages unless the owner later approves `tsx` / `vite-node`.

What the prerendered calculator pages contain:

- Shell (masthead, three-area nav, colophon).
- The area’s **default first paint** (Quick seeded example **inputs**, not a calculated result — V6 still holds; Detaylı Menü empty or restored only after hydration; Simülasyonlar empty line “Önce Detaylı Hesap’ı doldur.”).
- Visible FAQ **on that page** if the page has one (rehber always; calculator home keeps today’s three questions, still visible, still matching JSON-LD).
- Per-page `<title>`, description, canonical, OG, JSON-LD.

What they must **not** contain:

- A user’s draft or a calculated result (those exist only after JS + `localStorage`).
- Hidden keyword blocks, hidden FAQ, different content for bots vs humans.

---

## 2. URL structure

### 2.1 Target paths (canonical)

| Path | Area / page | Notes |
| --- | --- | --- |
| `/` | Hızlı Hesap | Keep as the default landing. Same product as today. |
| `/hizli-hesap` | Hızlı Hesap | Alias of `/`. One of them 301s to the other (open question Q1). |
| `/detayli-hesap` | Detaylı Hesap · Menü | Replaces `#detailed-feasibility` |
| `/detayli-hesap/malzemeler` | Malzemeler | Replaces `#detailed-feasibility/malzemeler` |
| `/detayli-hesap/satis` | Satış | ASCII, same tokens as today |
| `/detayli-hesap/giderler` | Giderler | |
| `/detayli-hesap/sonuc` | Sonuç | |
| `/simulasyonlar` | Simülasyonlar | Replaces `#simulations` / `#simulasyonlar` |
| `/rehber/<slug>` | Content | Template in §6. Two placeholder slugs in this plan |
| `/404` or `404.html` | Not found | Only if we leave SPA fallback; see §2.4 |

Do **not** put form values, product names, or draft IDs in the path (Quick R6). Screen names are navigation, not calculator state.

English aliases (`/quick`, `/detailed-feasibility`, `/simulations`) are **not** canonical. Optional 301s — open question Q2. Default in this plan: **do not create English public URLs**. Keep them as hash-compat only (§2.3).

### 2.2 Client navigation (no router package)

Replace hash helpers with pathname helpers in `src/app/shellCopy.ts` / `App.tsx`:

- Read `window.location.pathname` (and keep reading `hash` for one release — §2.3).
- Area clicks `pushState` to `/`, `/detayli-hesap`, `/simulasyonlar`.
- Detaylı screen clicks `pushState` to `/detayli-hesap/malzemeler` etc.
- `popstate` already exists; it keeps working.
- `<a href="/detayli-hesap">` stay real links (crawlers follow them; clicks `preventDefault` + `pushState` as today).

This is still not React Router.

### 2.3 Backward-compatible hash redirects

**Hashes never reach the Worker.** `_redirects` cannot see `#detailed-feasibility`. Compatibility is **client-side only**, in a tiny inline script in the HTML template **before** the module bundle, so a bookmarked `https://maliyet.lol/#detailed-feasibility/satis` still opens Satış even if the bundle is slow.

Map (replace, then `history.replaceState` so Back is not a loop):

| Incoming hash | Destination path |
| --- | --- |
| `#quick` / `#quick-calculation` | `/` (or `/hizli-hesap` if that is canonical) |
| `#detailed-feasibility` | `/detayli-hesap` |
| `#detailed-feasibility/malzemeler` | `/detayli-hesap/malzemeler` |
| `#detailed-feasibility/satis` | `/detayli-hesap/satis` |
| `#detailed-feasibility/giderler` | `/detayli-hesap/giderler` |
| `#detailed-feasibility/sonuc` | `/detayli-hesap/sonuc` |
| `#simulations` / `#simulasyonlar` | `/simulasyonlar` |
| unknown hash | `/` (today unknown hash opens Hızlı) |

Keep the hash parser for at least one production release after the path launch. Then a later PR can delete it.

`_redirects` **is** useful for **path** aliases (not hashes), and it does **not** require a Worker:

```
# public/_redirects — copied to dist/ by Vite
/hizli-hesap / 301
```

(or the reverse, if `/hizli-hesap` is canonical). Cloudflare Workers Static Assets parse `_redirects` from the assets directory with no `main` script. Fragments in the source are ignored (documented). Do not put `#...` rules there.

### 2.4 Workers Static Assets config

Today:

```jsonc
"assets": {
  "directory": "./dist",
  "not_found_handling": "single-page-application"
}
```

No `html_handling` key → default **`auto-trailing-slash`**: `foo.html` is served at `/foo`, `foo/index.html` at `/foo/`.

**Recommended after prerender** (still no Worker `main`):

```jsonc
"assets": {
  "directory": "./dist",
  "html_handling": "auto-trailing-slash",
  "not_found_handling": "single-page-application"
}
```

Why keep SPA fallback:

- `/detayli-hesap/satis` must work even if someone bookmarks a suffix we forgot to prerender.
- Unknown Detaylı suffixes today fall back to Menü. After the move, unknown `/detayli-hesap/foo` can still hydrate and land Menü.

Cost of SPA fallback: a junk path like `/asdf` returns **200** + Hızlı HTML (soft 404). Mitigation:

- Prerender every real path so the important URLs are real files (correct title/canonical).
- Add a visible Turkish 404 **inside the app** for unknown pathnames after hydration (`Bu sayfa yok.` + link home). Crawlers that run JS see it; crawlers that do not may still see Hızlı’s prerendered `/` shell if the fallback file is `index.html`. That is the SPA tradeoff.
- Switching `not_found_handling` to `"404-page"` gives honest 404s for `/asdf` **and** breaks any calculator suffix we failed to emit as a file. Only do that once the prerender path list is complete and tested. Open question Q3.

`html_handling: "drop-trailing-slash"` is an alternative if the owner wants `/detayli-hesap` not `/detayli-hesap/`. Default auto is enough; pick one canonical per path and put that in `<link rel="canonical">`.

**Do not** add `main`, `binding`, or `run_worker_first`. Those invoke Worker code and can create billable invocations. Static assets with no `main` stay on the free static serving path.

`workers_dev` stays `false`. Routes stay `maliyet.lol/*` and `www.maliyet.lol/*`. Canonical host is already `https://maliyet.lol/` — keep it. www should 301 to apex (open question Q4 if that is not already a Cloudflare Bulk Redirect / DNS setting; this plan does not add a Worker to do it).

---

## 3. Per-page `<head>`

`lang="tr"` stays on `<html>`. All copy Turkish. No i18n library. `og:locale` stays `tr_TR`.

One module owns strings (same U4 rule as `shellCopy.ts`), e.g. `src/app/seoCopy.ts`, imported by the prerender script **and** by a tiny client helper that can `document.title = …` on in-app navigations so the tab matches the path after `pushState`.

| Path | `<title>` (draft — owner edits) | Meta description (draft — owner edits) |
| --- | --- | --- |
| `/` | `Maliyet — Bir satıştan geriye ne kalıyor?` | Keep today’s sentence |
| `/hizli-hesap` | same as `/` if it 301s; else same title | same |
| `/detayli-hesap` | `Detaylı Hesap — Maliyet` | Product + channel + personel + PDF, one sentence |
| `/detayli-hesap/malzemeler` | `Malzemeler — Detaylı Hesap — Maliyet` | Shared ingredient list, one sentence |
| `/detayli-hesap/satis` | `Satış — Detaylı Hesap — Maliyet` | |
| `/detayli-hesap/giderler` | `Giderler — Detaylı Hesap — Maliyet` | |
| `/detayli-hesap/sonuc` | `Sonuç — Detaylı Hesap — Maliyet` | No invented result numbers in the description |
| `/simulasyonlar` | `Simülasyonlar — Maliyet` | Ocak testi, Detaylı taslağını okur |
| `/rehber/<slug>` | `{H1} — Maliyet` | First 150–160 characters of the lead, no stuffing |

Every prerendered file also has:

- `<link rel="canonical" href="https://maliyet.lol{canonicalPath}">` — no hash, no query, no trailing slash unless that is the chosen canonical.
- `og:type` `website` on calculator pages, `article` on rehber.
- `og:title` / `og:description` = the same strings as title/description (no cloaking).
- `og:url` = canonical.
- `og:image` = today’s `https://maliyet.lol/og.jpg` until the owner wants per-page cards (open question Q5).
- Twitter tags mirroring OG.
- `og:site_name` `Maliyet`.

Client-side `pushState` must update title + canonical + OG via `document.querySelector` or by replacing the tags. Share crawlers do not run that JS; they see the **file** at that path, which is why prerender matters.

Do not put different wording in JSON-LD than in the visible page.

---

## 4. `sitemap.xml`, `robots.txt`, `llms.txt`, Cloudflare AI crawl controls

### 4.1 `robots.txt`

Replace the single `User-agent: *` / `Allow: /` with explicit allows for the named crawlers, then keep a `*` allow so humans and others are not locked out.

Draft (UTF-8, no secrets, no Sitemap paywall):

```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: *
Allow: /

Sitemap: https://maliyet.lol/sitemap.xml
```

Do **not** `Disallow` the calculator. Do **not** add a Cloudflare-managed block. If Cloudflare Bot Preference Sync injects a `BEGIN Cloudflare` block that `Disallow`s GPTBot, that is the dashboard setting in §4.4 — fix it there, do not fight it with a second file.

`Google-Extended` is training, not Google Search. The owner asked to allow it; the dashboard Training policy must also be **Allow** or Cloudflare will still edge-block training crawlers.

### 4.2 `sitemap.xml`

List **only canonical** URLs (not hash URLs, not both `/` and `/hizli-hesap` if one 301s).

```
https://maliyet.lol/
https://maliyet.lol/detayli-hesap
https://maliyet.lol/detayli-hesap/malzemeler
https://maliyet.lol/detayli-hesap/satis
https://maliyet.lol/detayli-hesap/giderler
https://maliyet.lol/detayli-hesap/sonuc
https://maliyet.lol/simulasyonlar
https://maliyet.lol/rehber/<slug-1>
https://maliyet.lol/rehber/<slug-2>
```

`lastmod` = build date or file mtime. `changefreq` is optional and ignored by Google; omit rather than invent. Generate this file from the same path list the prerender script uses so they cannot drift.

### 4.3 `llms.txt`

Keep `public/llms.txt`. Expand it when paths exist:

- One paragraph what Maliyet is (today’s text, plus Simülasyonlar as a third *area*, not a third engine).
- Bullet links with absolute URLs to `/`, `/detayli-hesap`, `/simulasyonlar`, and each rehber slug.
- “Ücretsiz, hesap yok, tarayıcıda hesaplanır, sunucuya veri gitmez.”
- No formulas that disagree with the specs. No English product name “quick calc”.

Optional later: `llms-full.txt`. Not in the first implementation PR.

### 4.4 Cloudflare dashboard — owner does this (we cannot)

The old **Block AI bots** toggle was replaced. Current name: **AI Crawler and Agent access policies**. Free plan has it.

**Exact steps (English dashboard labels as of Nov 2026 docs):**

1. Log in at [https://dash.cloudflare.com/](https://dash.cloudflare.com/).
2. Open the **maliyet.lol** zone.
3. Go to **Security → Settings**  
   deep link pattern: `https://dash.cloudflare.com/?to=/:account/:zone/security/settings`
4. Filter by **Bot traffic**.
5. Open **AI Crawler and Agent access policies** (formerly “Configure AI bot policies”).
6. Set all three behaviours to **Allow (do not block)**:
   - **Search**
   - **Agents** (Personal Agents inherit this; leave them on Allow)
   - **Training** (needed if GPTBot / ClaudeBot / Google-Extended should not be edge-blocked)
7. If **Enable Bot Preference Sync** is on, either turn it off or keep Training on Allow so Cloudflare does not inject `Disallow` for training bots into `robots.txt`.
8. **Save**.
9. Second screen: **AI Crawl Control**  
   `https://dash.cloudflare.com/?to=/:account/:zone/ai` → **Crawlers** / **Security** tab. For GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended: Action = **Allow**. Do not “Enforce robots.txt” in a way that blocks them if our file already Allows.
10. Confirm **Bot Fight Mode** (Security → Bots / Settings) is not blocking verified crawlers. If it is on, either skip verified bots or turn it off for this zone. Owner verifies; we do not change production settings from an agent.
11. Fetch `https://maliyet.lol/robots.txt` in a private window. If a `BEGIN Cloudflare` / `BEGIN Cloudflare Managed content` block `Disallow`s GPTBot, the dashboard is still syncing a Training disallow — repeat 6–8.

We cannot see the dashboard from this repo. Treat “owner verified Allow” as a launch checkbox, not as something CI can assert.

---

## 5. Structured data

All JSON-LD is a 1:1 mirror of **visible** copy. No extra questions, no extra claims, no `FAQPage` on a page that has no FAQ on screen.

### 5.1 `WebApplication` (calculator URLs)

Keep the existing shape on `/`, `/detayli-hesap`, `/simulasyonlar` (and `/hizli-hesap` only if it is not a 301):

- `@type`: `WebApplication`
- `name`: `Maliyet`
- `url`: that page’s canonical
- `description`: that page’s meta description
- `applicationCategory`: `FinanceApplication`
- `operatingSystem`: `Any (web browser)`
- `inLanguage`: `tr`
- `isAccessibleForFree`: true
- `offers.price`: `"0"` / `TRY`

Do not mark rehber pages as `WebApplication`.

### 5.2 `FAQPage` (visible FAQ only)

Today’s three questions stay on `/` (the static footer already shows them). After prerender, either:

- keep the footer FAQ on calculator pages and keep the same JSON-LD, or
- move the FAQ into the React tree so it is inside `#root` and still visible, still matching JSON-LD.

**Never** ship FAQ JSON-LD for questions that are not on that page. **Never** hide the FAQ with `display:none` / off-screen / `aria-hidden` for crawlers. That is cloaking.

Rehber pages: FAQ section is part of the template (§6). Each rehber file has its own `FAQPage` for **its** visible questions only.

### 5.3 `BreadcrumbList` (rehber only)

Calculator areas are three peers, not a deep tree. Do not force breadcrumbs on `/detayli-hesap`.

Rehber:

```
Ana sayfa → Rehber → {H1}
```

Visible breadcrumb on the page (text links, existing tokens, no icons) **and** matching `BreadcrumbList` JSON-LD. URLs in the JSON are the canonical paths.

### 5.4 What we will not add

- `HowTo` that restates financial formulas the spec does not want in marketing copy.
- Fake `AggregateRating`.
- A second language `WebSite` SearchAction (there is no on-site search).

---

## 6. Rehber template

Not a blog engine. Not a CMS. Not a new design language.

### 6.1 Visual

Same sheet, tokens, type:

- Page `#EDEEF0`, surface `#FFFFFF`, ink `#16181C`, secondary `#5B6169`, muted `#8A9199`, rules `#E3E5E8`, accent `#1D3A5F` on links / focus only
- IBM Plex Sans + Mono
- No cards, no icons, no red, no badges
- 44px text links / buttons
- Sen register, Turkish only
- Mobile-first 390, then desktop

A rehber page is the same `AppShell` (left nav on desktop, top row on mobile) plus an `<article>` in the sheet.

### 6.2 Structure (every rehber slug)

1. Visible breadcrumb: `Maliyet / Rehber / {H1}`
2. `h1` in esnaf Turkish
3. Lead paragraph (also the meta description source)
4. Body: short sections, `h2`, lists, no tables unless a later owner-approved spec says so
5. **Visible FAQ** (`h2` Sık sorulanlar, each question visible, answers visible)
6. One text link into the calculator, explicit: `Hızlı Hesap’a git` and/or `Detaylı Hesap’a git` — real `href="/"`, `href="/detayli-hesap"`
7. Colophon unchanged

No “read more” cards. No related-posts grid.

Copy rules: no `marj`, `amortisman`, `net kâr`. Prefer `bu üründen kalan`, `malzeme payı`, `aylık işletme sonucu`. Do not invent formulas. If a sentence needs a number, it is an example labelled as an example, not a live engine output.

### 6.3 Implementation shape (when coding is approved)

- `src/features/rehber/pages.ts` — slug, title, description, body blocks, FAQ pairs, calculator hrefs.
- `src/features/rehber/RehberPage.tsx` — renders one page from that module.
- Prerender iterates `pages.ts`. Adding a slug is a content change, not a new route library.

Do not put rehber copy in `docs/`. Docs stay specs. User-facing Turkish lives in `src/features/rehber/`.

### 6.4 Two placeholder slugs

Keyword research comes later. These slugs are **stubs** so the template and prerender path list are real. Headings are placeholders; replace after research.

| Slug | Working H1 (placeholder) | Links into |
| --- | --- | --- |
| `/rehber/bir-satistan-ne-kaliyor` | Bir satıştan işletmede ne kalıyor? | `/` (Hızlı Hesap) |
| `/rehber/kafe-acmadan-once-hesap` | Kafe açmadan önce hangi sayıları girmelisin? | `/detayli-hesap` |

Each placeholder ships with 2–3 visible FAQ questions that the page actually answers, e.g. “Bu hesap ücretsiz mi?”, “Rakamlar kime gönderilir?” → “Hiç kimseye; tarayıcıda kalır.” Final FAQ text is owner-edited.

Do not publish a third slug in the first content PR.

---

## 7. Performance / Core Web Vitals and hydration

### 7.1 What prerender changes

| Metric | Effect |
| --- | --- |
| LCP | First paint includes real text (nav, H1, FAQ) instead of an empty `#root`. Should help LCP on content pages. Calculator LCP may still be the IBM Plex font or the Hesapla button. |
| CLS | Hydration must not swap a short FAQ for a different layout. Seeded Quick form must match. Sticky masthead already accounted for (`lg:top-14`). |
| INP | Unchanged if we do not add a router library or extra JS. Path `pushState` is the same as today’s hash handler. |
| JS weight | No new runtime package. HTML files get larger (inlined content). Gzip still small for these pages. |
| TTFB | Static asset from Cloudflare. No Worker. Same as today. |

Existing CWV drag that this plan **does not fix** (out of scope unless the owner asks):

- Google Fonts CSS from `fonts.googleapis.com` (extra connection). Self-hosting Plex would be a separate PR.
- `og.jpg` and font files.

### 7.2 Hydration contract

- Client entry stays `hydrateRoot` on `#root` (today `createRoot` — **must change to `hydrateRoot`** once `#root` has prerendered markup, or React 18 will throw away the HTML and warn). This is a one-line change in `main.tsx` plus a guard for empty root in local `vite` dev (dev can keep `createRoot` if there is no prerender in `npm run dev`).
- `localStorage` draft: `useDetailedCalc` already reads storage in `useState(loadInitialDraft)` on the **client**. During `renderToString`, `window` is undefined — `loadInitialDraft` must return the empty form on the server (it already `try/catch`es and can no-op without `window`). After hydration, the client’s first render might see the draft and disagree with the empty server HTML.

**That mismatch is the main technical risk.** Mitigation (pick one, recommended first):

1. **Recommended:** server and the client’s first render both use the empty/seeded form. Restore the draft in `useEffect` (one frame of empty Detaylı, then the draft). V6 already shows empty results until Hesapla; a one-frame empty Menü is acceptable. Quick stays on the seeded example (not localStorage).
2. Do not prerender Detaylı / Simülasyonlar bodies, only the shell + a visible Turkish sentence. Worse for SEO on those URLs.
3. Delay `hydrateRoot` until after reading localStorage (flicker, extra complexity). Do not do this.

Simülasyonlar prerender = empty line + link to Detaylı. After hydration, if a draft+view exists in memory it is session-only; a cold load has no `view` until they Hesapla again (today `hasCalculated` is not in the draft). **Do not start persisting results** to make Simülasyonlar prerender “full”. That would be a product change.

### 7.3 Dev vs prod

`npm run dev` stays CSR (empty `#root`). Prerender runs only in `npm run build`. `vite preview` / `wrangler deploy` of `dist/` is how we verify crawler HTML. This planning PR does not deploy.

---

## 8. Verification checklist

### 8.1 In CI / local (implementation PR)

For every canonical path:

```bash
# after npm run build, against dist/ or vite preview
curl -sS http://127.0.0.1:4173/detayli-hesap | grep -F "Detaylı Hesap"
curl -sS http://127.0.0.1:4173/simulasyonlar | grep -F "Simülasyonlar"
curl -sS http://127.0.0.1:4173/rehber/bir-satistan-ne-kaliyor | grep -F "Bir satıştan"
```

Assert:

- HTTP 200
- `<html lang="tr">`
- Unique `<title>` and canonical
- Visible Turkish in `#root` (not only in the footer)
- FAQ visible iff FAQ JSON-LD is present
- No `Hesaplama modu`
- Hash URLs are not in sitemap
- `robots.txt` lists the named bots
- `llms.txt` lists the same absolute URLs as the sitemap (calculator + rehber)

Hydration: open each path in a browser, no console error, Quick Hesapla still works, Detaylı draft still round-trips, Simülasyonlar empty state link goes to Detaylı.

### 8.2 Google Rich Results Test (owner or implementer after a preview URL exists)

1. [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)
2. Run against `/`, `/detayli-hesap`, one rehber URL (public or a temporary preview the owner deploys).
3. Expect `WebApplication` and `FAQPage` on `/`; `BreadcrumbList` + `FAQPage` on rehber; **no** FAQ errors about missing visible text.
4. Screenshot the passing result into the implementation PR, not this plan PR.

### 8.3 Google Search Console — owner only

We do not have the Search Console account. Owner:

1. [https://search.google.com/search-console](https://search.google.com/search-console) → Add property → **URL prefix** `https://maliyet.lol/`
2. Verification: **DNS TXT** via Cloudflare  
   - GSC shows a TXT record (`google-site-verification=…`)  
   - Cloudflare dashboard → **maliyet.lol** → **DNS** → Add record → Type **TXT** → Name `@` → Content = the GSC token → Proxy status **DNS only** (grey cloud) is fine for TXT  
   - Do not put the token in the git repo  
   - Verify in GSC
3. Submit `https://maliyet.lol/sitemap.xml`
4. Inspect `/`, `/detayli-hesap`, `/simulasyonlar`, one rehber URL
5. Optional: domain property `maliyet.lol` if both www and apex should report together (only if www is in use)

### 8.4 Bing Webmaster Tools — owner only

1. [https://www.bing.com/webmasters](https://www.bing.com/webmasters)
2. Add `https://maliyet.lol/`
3. Import from Search Console **or** DNS TXT (another TXT at `@`, different token, also not in git)
4. Submit the same sitemap

### 8.5 LLM crawlers

After dashboard Allow (§4.4) and a production deploy the owner runs:

```bash
curl -sI -A "GPTBot" https://maliyet.lol/ | head
curl -sI -A "ClaudeBot" https://maliyet.lol/ | head
curl -sI -A "PerplexityBot" https://maliyet.lol/ | head
```

Expect **200**, not 403. Then `curl -s -A "GPTBot" https://maliyet.lol/detayli-hesap` should contain `Detaylı`.

---

## 9. Risks, PR-sized steps, open questions

### 9.1 Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Hydration mismatch vs `localStorage` draft | React warns / blank Detaylı | Restore draft in `useEffect` only (§7.2) |
| Soft 404s from SPA fallback | Junk URLs look like Hızlı to Google | Prerender the real set; optional later 404-page (Q3) |
| Hash bookmarks break | Existing `#detailed-feasibility` links | Inline hash→path script (§2.3) |
| New dependency creep | Owner must approve packages | Option A: none |
| Request-time Worker “just for redirects” | Breaks the no-Worker / no-cost rule | `_redirects` + client hash map only |
| FAQ JSON-LD ≠ visible FAQ | Rich Results fail / cloaking | One copy module, tests |
| Cloudflare Training / Bot Fight still blocking | GPTBot 403 despite robots Allow | Owner checklist §4.4 |
| Prerendering Hesapla results | Would leak a fake “official” P&L | Never prerender calculated figures |
| English paths | Splits ranking, bilingual smell | No `/quick` public URLs unless Q2 is yes |
| `hydrateRoot` in `npm run dev` | Empty `#root` throws | CSR in dev, hydrate only when `#root` has children |

### 9.2 PR-sized steps (implementation, after this plan is approved)

Do not combine these into one PR. Each is reviewable. None deploys unless the owner says so.

1. **Path routing, keep hashes.** Pathname helpers, `pushState` for the three areas + Detaylı suffixes, inline hash→path map, tests. UI should look the same. No prerender yet. Visual PR if nav chrome changes.
2. **`hydrateRoot` + draft restore in `useEffect`.** No user-visible product change except a possible one-frame empty Detaylı on refresh. Tests that `window` is not required to import the page modules.
3. **`seoCopy.ts` + per-path title/canonical on client navigations.** Still one `index.html` for crawlers at this step.
4. **Prerender script (option A) + wrangler `html_handling`.** Emit the calculator paths. CI `curl` greps. `public/_redirects` for `/hizli-hesap` if Q1 is decided.
5. **`robots.txt`, generated `sitemap.xml`, expanded `llms.txt`.** Named bots as specified.
6. **Rehber template + two placeholder slugs + BreadcrumbList + FAQ.** Visual PR (390 + desktop of one rehber page).
7. **JSON-LD audit + Rich Results.** Fix mismatches. Owner runs GSC/Bing/dashboard (§8.3–8.4, §4.4).

Step 1 depends on the three-area nav already being on `main` (PR #27 or its successor). Do not mix this plan’s implementation with that UI PR.

### 9.3 Open questions for the owner

**Q1.** Canonical home: `/` or `/hizli-hesap`? This plan assumes `/` stays canonical and `/hizli-hesap` 301s to `/`.

**Q2.** Any English path aliases (`/quick`, `/simulations`) as 301s, or hash-only forever? This plan assumes **no English public paths**.

**Q3.** After all known paths are prerendered, switch `not_found_handling` from `single-page-application` to `404-page`? Honest 404 vs never-breaking Detaylı suffixes. This plan keeps SPA fallback for the first prerender PR.

**Q4.** Is www → apex already a Cloudflare redirect? If not, should it be a dashboard Bulk Redirect (still no Worker)?

**Q5.** One `og.jpg` for every URL, or later per-area cards? This plan keeps one image.

**Q6.** Confirm Training crawlers (GPTBot, ClaudeBot, Google-Extended) should be **Allow** at the edge, not only in `robots.txt`. Dashboard must match.

**Q7.** Approve **no new npm packages** for option A. If you prefer a plugin, say so (`vite-prerender-plugin` only; not `vite-react-ssg`, not React Router).

**Q8.** Keep the static Hakkında footer on every calculator page once rehber exists, or only on `/`?

**Q9.** Placeholder rehber slugs: keep `bir-satistan-ne-kaliyor` and `kafe-acmadan-once-hesap`, or replace after your keyword list before anyone writes body copy?

**Q10.** Should `/detayli-hesap/sonuc` be in the sitemap (empty “Hesapla’dan önce…” state) or omitted until it has unique crawlable text?

---

## 10. What this plan does not do

- Does not authorise coding, deploy, or secrets.
- Does not change Quick or Detailed financial formulas.
- Does not add a third calculator engine.
- Does not build Yiyecek/İçecek comparison or fiyat-mı-adet-mi (rejected).
- Does not run keyword research.
- Does not touch Cloudflare dashboard (owner).
- Does not add React Router, a CMS, i18n, or a paid prerender service.

---

## 11. Current-repo facts this plan is based on

- Stack: React 18, Vite 6, Tailwind, daisyUI, TypeScript. `package.json` deploy = `vite build && wrangler deploy`.
- `wrangler.jsonc`: `assets.directory = "./dist"`, `not_found_handling = "single-page-application"`, no `main`, `workers_dev: false`, routes on `maliyet.lol` / `www.maliyet.lol`.
- Hash IA today: `#quick` / `#quick-calculation`, `#detailed-feasibility` + suffixes, `#simulations` / `#simulasyonlar` (three-area nav is a separate UI PR).
- `index.html` already has `lang="tr"`, title, description, canonical, OG, Twitter, `WebApplication`, `FAQPage`, and a visible FAQ footer outside `#root`.
- `public/robots.txt`, `public/sitemap.xml` (only `/`), `public/llms.txt`, `public/og.jpg` already exist and will be extended, not invented.
- Persistence: Quick none; Detailed `localStorage` key `maliyet.detailed.draft.v1`. No server.
- Authority docs: `TECH_STACK_AND_CONSTRAINTS.md` (static assets, no extra Cloudflare products), `FRONTEND_IMPLEMENTATION_SPEC.md` §2.2 (share tags), `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §6 (area nav / hash). This plan does not override financial specs.
