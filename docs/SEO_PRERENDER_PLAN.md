# SEO + LLM discoverability — prerender plan

**Status:** Plan only. Not authorised to implement. No application code in this PR. No deploy, no new dependency.
**Date:** 13 November 2026 (paths and Q1–Q10 locked by the owner the same day)
**Audience:** product owner (Can) + whoever implements after approval
**Hard rules (unchanged):** no backend, no secrets, no deploy in the planning/implementation PRs unless the owner asks, no paid Cloudflare product, no runtime cost, **page content and titles stay Turkish**, static assets only.

This is an implementation plan, not a financial specification and not permission to code.

---

## Decisions (owner-locked)

Recorded 13 November 2026. These override earlier drafts in this file (Turkish public slugs, “no English paths”, open Q1–Q10).

| ID | Decision |
| --- | --- |
| **Paths** | **Public URLs are English.** Canonical: `/`, `/detailed`, `/detailed/ingredients`, `/detailed/sales`, `/detailed/expenses`, `/detailed/result`, `/simulations`, `/guides/<english-slug>`. **Page copy, `<title>`, and meta stay Turkish.** Do not emit Turkish public paths (`/hizli-hesap`, `/detayli-hesap`, `/simulasyonlar`, `/rehber`, …) as canonical files. |
| **Menü** | `/detailed` is Detaylı Menü. `/detailed/menu` 301s to `/detailed` (same pattern as `/quick` → `/`). |
| **Q1** | `/` is the canonical home (Hızlı Hesap). `/quick` 301s to `/`. |
| **Q2** | Superseded. English paths **are** the canonical public URLs. |
| **Q3** | First prerender PR keeps `not_found_handling: "single-page-application"`. A **later** implementation step switches to `"404-page"` once every known path is prerendered and tested. |
| **Q4** | `www` → apex 301 via a **Cloudflare dashboard redirect rule** (no Worker). Owner verifies the current dashboard state. |
| **Q5** | One `og.jpg` for every URL for now. |
| **Q6** | Allow AI crawlers **including training bots** (GPTBot, ClaudeBot, Google-Extended, and the rest listed in §4.1) in `robots.txt` **and** at the Cloudflare edge setting. |
| **Q7** | **No new npm packages.** Prerender is option A: custom `renderToString` + Vite’s own SSR build. Not `vite-prerender-plugin`, not `vite-react-ssg`, not React Router, not `tsx` / `vite-node`. If that path is blocked, stop and ask; do not add a package. |
| **Q8** | Hakkında footer (today’s static FAQ block) on **every calculator page** (`/`, `/detailed` and its screens, `/simulations`). |
| **Q9** | `/guides/` slugs are **TBD after keyword research**. Keep two placeholder pages in the template, marked TBD. Do not treat the working H1s as final URLs. |
| **Q10** | `/detailed/result` is **not** in `sitemap.xml`. Prerender it so the URL works, but `<meta name="robots" content="noindex">` until it has unique crawlable text. |

### Still TBD (not product forks)

- Exact `/guides/<english-slug>` strings — after the owner’s keyword list.
- Owner confirms the www → apex dashboard rule is live (Q4).
- Owner confirms Cloudflare AI Crawler / Training policies are Allow (Q6 is the decision; the dashboard click-path is §4.4).

There are no remaining open product questions that block writing the implementation PRs in §9.2.

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

The owner-approved direction: **prerender real English paths at build time**, stay 100% static, keep the calculator hydrating in the browser, keep `localStorage` drafts, keep all visible copy in Turkish.

Keyword research is **out of this plan**. Guide slugs stay TBD.

---

## 1. Prerender approach

### 1.1 Constraint that decides the option

| Must | Must not |
| --- | --- |
| HTML for each public URL exists in `dist/` after `npm run build` | A Worker that renders on request |
| `curl https://maliyet.lol/detailed` returns **Turkish** content without executing JS | SSR, edge rendering, Cloudflare Browser Rendering, prerender.io, Rendertron |
| Calculator still hydrates; drafts still `localStorage` | New paid service, KV, D1, R2, Durable Objects |
| No `main` Worker unless hosting itself requires one (it does not today) | React Router; **any new npm package** (Q7) |

`react-dom/server` (`renderToString`) is **already inside `react-dom`**. It is not a new package.

### 1.2 Options

#### A. Custom build-time `renderToString` script (**locked**)

After the existing client `vite build`, a small Node script (Vite SSR build of one `src/entry-server.tsx`, then `node scripts/prerender.mjs`) renders each known path and writes:

```
dist/index.html
dist/detailed/index.html
dist/detailed/ingredients/index.html
dist/detailed/sales/index.html
dist/detailed/expenses/index.html
dist/detailed/result/index.html
dist/simulations/index.html
dist/guides/<slug>/index.html
dist/404.html
```

Do **not** write `dist/quick/`, `dist/hizli-hesap/`, `dist/detayli-hesap/`, `dist/simulasyonlar/`, or `dist/rehber/`. `/quick` and `/detailed/menu` exist only as `_redirects` 301s.

The script injects the string into `#root` of the Vite HTML template and replaces `<title>`, meta, canonical, OG, and JSON-LD per path. `/detailed/result` also gets `noindex`.

**Pros**

- Zero new runtime or dev dependencies. The script uses `vite build --ssr` (Vite is already a devDependency) and Node.
- No React Router. Path parsing stays a tiny helper (`areaFromLocation` reads `pathname`). Architecture D4 / “no router” stays true.
- We control exactly which paths exist.
- Matches “100% static, no Worker code, no request-time SSR”.
- Easy to test: `curl dist/detailed/index.html` in CI.

**Cons**

- We own the script. `window` / `localStorage` / `matchMedia` must be guarded so the server entry does not throw (Detailed draft already guards `localStorage`; the hook must not run `window` at module scope — today `useDetailedCalc` touches `window` only inside effects and event handlers, which `renderToString` does not run. Verify).
- Two Vite builds (client + ssr). Build gets slower. Still free, still local.
- Hydration must match the prerendered markup (Quick’s seeded example form must be the same on server and first client render).

**New dependencies:** **none.** If `vite build --ssr` + `node` cannot run the script, **stop** — do not add `tsx` or `vite-node`.

#### B. `vite-prerender-plugin`

**Rejected (Q7).** New devDependency.

#### C. `vite-react-ssg`

**Rejected (Q7).** New devDependency; pulls toward React Router.

#### D. Abandoned `vite-plugin-prerender` forks, Puppeteer snapshots, Cloudflare Browser Rendering

**Rejected.** Paid / request-time / graveyard.

### 1.3 What gets prerendered

- Shell (masthead, three-area nav, colophon).
- Hakkında footer on every calculator page (Q8).
- The area’s **default first paint** (Quick seeded example **inputs**, not a calculated result — V6 still holds; Detaylı Menü empty or restored only after hydration; Simülasyonlar empty line “Önce Detaylı Hesap’ı doldur.”).
- Visible FAQ on calculator pages (the Hakkında questions) matching JSON-LD.
- Per-page `<title>` (Turkish), description, canonical (English path), OG, JSON-LD.

What they must **not** contain:

- A user’s draft or a calculated result (those exist only after JS + `localStorage`).
- Hidden keyword blocks, hidden FAQ, different content for bots vs humans.
- Turkish path strings as canonical URLs.

---

## 2. URL structure

### 2.1 Canonical paths

| Path | Area / page | Notes |
| --- | --- | --- |
| `/` | Hızlı Hesap | Canonical home (Q1) |
| `/quick` | — | **301 → `/`**. Not prerendered, not in sitemap |
| `/detailed` | Detaylı Hesap · Menü | Replaces `#detailed-feasibility` |
| `/detailed/menu` | — | **301 → `/detailed`** |
| `/detailed/ingredients` | Malzemeler | Replaces `#detailed-feasibility/malzemeler` |
| `/detailed/sales` | Satış | Replaces `#detailed-feasibility/satis` |
| `/detailed/expenses` | Giderler | Replaces `#detailed-feasibility/giderler` |
| `/detailed/result` | Sonuç | Replaces `#detailed-feasibility/sonuc`. Prerender + **noindex**. **Not in sitemap** (Q10) |
| `/simulations` | Simülasyonlar | Replaces `#simulations` / `#simulasyonlar` |
| `/guides/<english-slug>` | Content | Template in §6. Slugs TBD (Q9) |
| `/404` or `404.html` | Not found | Used when Q3’s later step switches off SPA fallback |

Do **not** put form values, product names, or draft IDs in the path (Quick R6). Screen names are navigation, not calculator state.

**Dropped (not public, not prerendered, not in sitemap):** `/hizli-hesap`, `/detayli-hesap`, `/detayli-hesap/*`, `/simulasyonlar`, `/rehber`, `/rehber/*`. Optional `_redirects` 301s from those strings onto the English canonicals are allowed so a mistyped URL is not a soft-404 to Hızlı; they are not indexed.

### 2.2 Client navigation (no router package)

Replace hash helpers with pathname helpers in `src/app/shellCopy.ts` / `App.tsx`:

- Read `window.location.pathname` (and keep reading `hash` for one release — §2.3).
- Area clicks `pushState` to `/`, `/detailed`, `/simulations`.
- Detaylı screen clicks `pushState` to `/detailed/ingredients` etc.
- `popstate` already exists; it keeps working.
- `<a href="/detailed">` stay real links (crawlers follow them; clicks `preventDefault` + `pushState` as today). Visible link text stays Turkish (`Detaylı Hesap`).

This is still not React Router.

### 2.3 Backward-compatible hash redirects

**Hashes never reach the Worker.** `_redirects` cannot see `#detailed-feasibility`. Compatibility is **client-side only**, in a tiny inline script in the HTML template **before** the module bundle, so a bookmarked `https://maliyet.lol/#detailed-feasibility/satis` still opens Satış even if the bundle is slow.

Map (replace, then `history.replaceState` so Back is not a loop):

| Incoming hash | Destination path |
| --- | --- |
| `#quick` / `#quick-calculation` | `/` |
| `#detailed-feasibility` | `/detailed` |
| `#detailed-feasibility/malzemeler` | `/detailed/ingredients` |
| `#detailed-feasibility/satis` | `/detailed/sales` |
| `#detailed-feasibility/giderler` | `/detailed/expenses` |
| `#detailed-feasibility/sonuc` | `/detailed/result` |
| `#simulations` / `#simulasyonlar` | `/simulations` |
| unknown hash | `/` (today unknown hash opens Hızlı) |

Keep the hash parser for at least one production release after the path launch. Then a later PR can delete it.

`_redirects` **is** useful for **path** aliases (not hashes), and it does **not** require a Worker:

```
# public/_redirects — copied to dist/ by Vite
/quick / 301
/detailed/menu /detailed 301
```

Optional (mistype / old plan URLs, not canonical):

```
/hizli-hesap / 301
/detayli-hesap /detailed 301
/detayli-hesap/malzemeler /detailed/ingredients 301
/detayli-hesap/satis /detailed/sales 301
/detayli-hesap/giderler /detailed/expenses 301
/detayli-hesap/sonuc /detailed/result 301
/simulasyonlar /simulations 301
```

Cloudflare Workers Static Assets parse `_redirects` from the assets directory with no `main` script. Fragments in the source are ignored (documented). Do not put `#...` rules there.

### 2.4 Workers Static Assets config

Today:

```jsonc
"assets": {
  "directory": "./dist",
  "not_found_handling": "single-page-application"
}
```

No `html_handling` key → default **`auto-trailing-slash`**: `foo.html` is served at `/foo`, `foo/index.html` at `/foo/`.

**First prerender PR** (Q3 — still no Worker `main`):

```jsonc
"assets": {
  "directory": "./dist",
  "html_handling": "auto-trailing-slash",
  "not_found_handling": "single-page-application"
}
```

Why SPA fallback for that PR:

- `/detailed/sales` must work even if someone bookmarks a suffix we forgot to prerender.
- Unknown `/detailed/foo` can still hydrate and land Menü.

Cost: a junk path like `/asdf` returns **200** + Hızlı HTML (soft 404). Mitigation for the first PR: prerender every real path; after hydration, unknown pathnames can show `Bu sayfa yok.` + a link home.

**Later step (Q3):** once the path list is complete and tested, switch `not_found_handling` to `"404-page"` and ship `404.html` so `/asdf` is an honest 404. That step is its own PR (§9.2 step 8).

**Do not** add `main`, `binding`, or `run_worker_first`.

`workers_dev` stays `false`. Routes stay `maliyet.lol/*` and `www.maliyet.lol/*`. Canonical host is `https://maliyet.lol/`. **www → apex** is a Cloudflare dashboard redirect (Q4, no Worker). Owner verifies it is on.

---

## 3. Per-page `<head>`

`lang="tr"` stays on `<html>`. All copy Turkish. No i18n library. `og:locale` stays `tr_TR`. Paths in `canonical` / `og:url` are the English URLs.

One module owns strings (same U4 rule as `shellCopy.ts`), e.g. `src/app/seoCopy.ts`, imported by the prerender script **and** by a tiny client helper that can `document.title = …` on in-app navigations so the tab matches the path after `pushState`.

| Path | `<title>` (draft — owner edits) | Meta description (draft — owner edits) |
| --- | --- | --- |
| `/` | `Maliyet — Bir satıştan geriye ne kalıyor?` | Keep today’s sentence |
| `/detailed` | `Detaylı Hesap — Maliyet` | Product + channel + personel + PDF, one sentence |
| `/detailed/ingredients` | `Malzemeler — Detaylı Hesap — Maliyet` | Shared ingredient list, one sentence |
| `/detailed/sales` | `Satış — Detaylı Hesap — Maliyet` | |
| `/detailed/expenses` | `Giderler — Detaylı Hesap — Maliyet` | |
| `/detailed/result` | `Sonuç — Detaylı Hesap — Maliyet` | No invented result numbers. Plus **`noindex`** (Q10) |
| `/simulations` | `Simülasyonlar — Maliyet` | Ocak testi, Detaylı taslağını okur |
| `/guides/<slug>` | `{H1} — Maliyet` | First 150–160 characters of the lead, no stuffing |

Every prerendered file also has:

- `<link rel="canonical" href="https://maliyet.lol{canonicalPath}">` — no hash, no query, no trailing slash unless that is the chosen canonical. `/detailed/result` canonical is still itself (noindex does not need a canonical pointing at Menü).
- `og:type` `website` on calculator pages, `article` on guides.
- `og:title` / `og:description` = the same **Turkish** strings as title/description (no cloaking).
- `og:url` = canonical (English path).
- `og:image` = `https://maliyet.lol/og.jpg` (Q5, one image).
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

Do **not** `Disallow` `/detailed/result` — that URL is `noindex` in the page, not robots-blocked (Q10). Do **not** add a Cloudflare-managed block. If Cloudflare Bot Preference Sync injects a `BEGIN Cloudflare` block that `Disallow`s GPTBot, that is the dashboard setting in §4.4.

`Google-Extended` is training, not Google Search. Q6 requires Training **Allow** at the edge as well as this file.

### 4.2 `sitemap.xml`

List **only indexable canonical** URLs (not hashes, not 301 aliases, **not** `/detailed/result`).

```
https://maliyet.lol/
https://maliyet.lol/detailed
https://maliyet.lol/detailed/ingredients
https://maliyet.lol/detailed/sales
https://maliyet.lol/detailed/expenses
https://maliyet.lol/simulations
https://maliyet.lol/guides/<slug>   (only after Q9 slugs exist)
```

`lastmod` = build date or file mtime. `changefreq` is optional and ignored by Google; omit rather than invent. Generate this file from the same path list the prerender script uses, minus `noindex` URLs, so they cannot drift.

### 4.3 `llms.txt`

Keep `public/llms.txt`. Expand it when paths exist:

- One paragraph what Maliyet is (today’s text, plus Simülasyonlar as a third *area*, not a third engine).
- Bullet links with **absolute English URLs** to `/`, `/detailed`, `/simulations`, and each guide slug that exists.
- “Ücretsiz, hesap yok, tarayıcıda hesaplanır, sunucuya veri gitmez.”
- No formulas that disagree with the specs. No English product name “quick calc”. Link hrefs are English; the sentences around them stay Turkish.

Optional later: `llms-full.txt`. Not in the first implementation PR.

### 4.4 Cloudflare dashboard — owner does this (we cannot)

Q6 is **Allow**, including training. The old **Block AI bots** toggle was replaced. Current name: **AI Crawler and Agent access policies**. Free plan has it.

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
   - **Training** (GPTBot / ClaudeBot / Google-Extended)
7. If **Enable Bot Preference Sync** is on, either turn it off or keep Training on Allow so Cloudflare does not inject `Disallow` for training bots into `robots.txt`.
8. **Save**.
9. Second screen: **AI Crawl Control**  
   `https://dash.cloudflare.com/?to=/:account/:zone/ai` → **Crawlers** / **Security** tab. For GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended: Action = **Allow**. Do not “Enforce robots.txt” in a way that blocks them if our file already Allows.
10. Confirm **Bot Fight Mode** (Security → Bots / Settings) is not blocking verified crawlers. If it is on, either skip verified bots or turn it off for this zone. Owner verifies; we do not change production settings from an agent.
11. Fetch `https://maliyet.lol/robots.txt` in a private window. If a `BEGIN Cloudflare` / `BEGIN Cloudflare Managed content` block `Disallow`s GPTBot, the dashboard is still syncing a Training disallow — repeat 6–8.

**www → apex (Q4):** Cloudflare dashboard → **Rules → Redirect Rules** (or Bulk Redirects) → `www.maliyet.lol` 301 to `https://maliyet.lol`. No Worker. Owner verifies the current state.

We cannot see the dashboard from this repo. Treat “owner verified Allow + www redirect” as launch checkboxes.

---

## 5. Structured data

All JSON-LD is a 1:1 mirror of **visible** copy. No extra questions, no extra claims, no `FAQPage` on a page that has no FAQ on screen.

### 5.1 `WebApplication` (indexable calculator URLs)

Keep the existing shape on `/`, `/detailed`, `/detailed/ingredients`, `/detailed/sales`, `/detailed/expenses`, `/simulations`:

- `@type`: `WebApplication`
- `name`: `Maliyet`
- `url`: that page’s canonical (English path)
- `description`: that page’s **Turkish** meta description
- `applicationCategory`: `FinanceApplication`
- `operatingSystem`: `Any (web browser)`
- `inLanguage`: `tr`
- `isAccessibleForFree`: true
- `offers.price`: `"0"` / `TRY`

Do not mark guide pages as `WebApplication`. `/detailed/result` may omit `WebApplication` (it is `noindex`).

### 5.2 `FAQPage` (visible FAQ only)

Q8: the Hakkında footer stays on **every calculator page**. The same three visible questions stay there; JSON-LD on those pages matches that visible FAQ.

**Never** ship FAQ JSON-LD for questions that are not on that page. **Never** hide the FAQ with `display:none` / off-screen / `aria-hidden` for crawlers. That is cloaking.

Guide pages: FAQ section is part of the template (§6). Each guide file has its own `FAQPage` for **its** visible questions only.

### 5.3 `BreadcrumbList` (guides only)

Calculator areas are three peers, not a deep tree. Do not force breadcrumbs on `/detailed`.

Guides:

```
Ana sayfa → Rehber → {H1}
```

Visible breadcrumb on the page (text links, existing tokens, no icons) **and** matching `BreadcrumbList` JSON-LD. URLs in the JSON are the English canonicals (`/`, `/guides/<slug>`). Visible labels stay Turkish.

### 5.4 What we will not add

- `HowTo` that restates financial formulas the spec does not want in marketing copy.
- Fake `AggregateRating`.
- A second language `WebSite` SearchAction (there is no on-site search).

---

## 6. Rehber / guides template

Not a blog engine. Not a CMS. Not a new design language. **Path prefix is `/guides/`.** On-page heading “Rehber” may stay Turkish.

### 6.1 Visual

Same sheet, tokens, type:

- Page `#EDEEF0`, surface `#FFFFFF`, ink `#16181C`, secondary `#5B6169`, muted `#8A9199`, rules `#E3E5E8`, accent `#1D3A5F` on links / focus only
- IBM Plex Sans + Mono
- No cards, no icons, no red, no badges
- 44px text links / buttons
- Sen register, Turkish only
- Mobile-first 390, then desktop

A guide page is the same `AppShell` (left nav on desktop inside the white sheet, top row on mobile) plus an `<article>` in the sheet.

### 6.2 Structure (every guide slug)

1. Visible breadcrumb: `Maliyet / Rehber / {H1}`
2. `h1` in esnaf Turkish
3. Lead paragraph (also the meta description source)
4. Body: short sections, `h2`, lists, no tables unless a later owner-approved spec says so
5. **Visible FAQ** (`h2` Sık sorulanlar, each question visible, answers visible)
6. One text link into the calculator, explicit: `Hızlı Hesap’a git` and/or `Detaylı Hesap’a git` — real `href="/"`, `href="/detailed"`
7. Colophon unchanged

No “read more” cards. No related-posts grid.

Copy rules: no `marj`, `amortisman`, `net kâr`. Prefer `bu üründen kalan`, `malzeme payı`, `aylık işletme sonucu`. Do not invent formulas. If a sentence needs a number, it is an example labelled as an example, not a live engine output.

### 6.3 Implementation shape (when coding is approved)

- `src/features/rehber/pages.ts` — English slug, Turkish title, description, body blocks, FAQ pairs, calculator hrefs.
- `src/features/rehber/RehberPage.tsx` — renders one page from that module.
- Prerender iterates `pages.ts`. Adding a slug is a content change, not a new route library.

Do not put rehber copy in `docs/`. Docs stay specs. User-facing Turkish lives in `src/features/rehber/`.

### 6.4 Placeholder pages (slugs TBD)

Keyword research comes later (Q9). Do **not** publish a URL until the English slug is chosen. The template and two working H1s exist so the prerender list and visual PR have something to render locally.

| Path | Status | Working H1 (placeholder) | Links into |
| --- | --- | --- | --- |
| `/guides/<slug-tbd-1>` | **TBD** after keyword research | Bir satıştan işletmede ne kalıyor? | `/` (Hızlı Hesap) |
| `/guides/<slug-tbd-2>` | **TBD** after keyword research | Kafe açmadan önce hangi sayıları girmelisin? | `/detailed` |

Each placeholder has 2–3 visible FAQ questions the page actually answers, e.g. “Bu hesap ücretsiz mi?”, “Rakamlar kime gönderilir?” → “Hiç kimseye; tarayıcıda kalır.” Final FAQ text is owner-edited.

Do not publish a third slug in the first content PR. Do not put TBD slugs in the production sitemap.

---

## 7. Performance / Core Web Vitals and hydration

### 7.1 What prerender changes

| Metric | Effect |
| --- | --- |
| LCP | First paint includes real Turkish text (nav, H1, FAQ) instead of an empty `#root`. Should help LCP on content pages. Calculator LCP may still be the IBM Plex font or the Hesapla button. |
| CLS | Hydration must not swap a short FAQ for a different layout. Seeded Quick form must match. Sticky masthead already accounted for (`lg:top-14`). Hakkında footer on every calculator page is the same block — do not resize it per area. |
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

Simülasyonlar prerender = empty line + link to `/detailed`. After hydration, if a draft+view exists in memory it is session-only; a cold load has no `view` until they Hesapla again (today `hasCalculated` is not in the draft). **Do not start persisting results** to make Simülasyonlar prerender “full”. That would be a product change.

### 7.3 Dev vs prod

`npm run dev` stays CSR (empty `#root`). Prerender runs only in `npm run build`. `vite preview` / `wrangler deploy` of `dist/` is how we verify crawler HTML. This planning PR does not deploy.

---

## 8. Verification checklist

### 8.1 In CI / local (implementation PR)

For every canonical **indexable** path:

```bash
# after npm run build, against dist/ or vite preview
curl -sS http://127.0.0.1:4173/detailed | grep -F "Detaylı Hesap"
curl -sS http://127.0.0.1:4173/simulations | grep -F "Simülasyonlar"
curl -sSI http://127.0.0.1:4173/quick | grep -i location   # 301 → /
curl -sS http://127.0.0.1:4173/detailed/result | grep -F "noindex"
```

Assert:

- HTTP 200 on canonical files; **301** on `/quick` and `/detailed/menu`
- `<html lang="tr">`
- Unique Turkish `<title>` and English-path canonical
- Visible Turkish in `#root` (not only in the footer)
- Hakkında FAQ visible on every calculator page; FAQ JSON-LD present iff that FAQ is visible
- `/detailed/result` has `noindex` and is **absent** from `sitemap.xml`
- No Turkish public paths in the sitemap
- No `Hesaplama modu`
- Hash URLs are not in sitemap
- `robots.txt` lists the named bots including training (GPTBot, ClaudeBot, Google-Extended)
- `llms.txt` lists the same absolute English URLs as the sitemap (calculator + guides that exist)

Hydration: open each path in a browser, no console error, Quick Hesapla still works, Detaylı draft still round-trips, Simülasyonlar empty state link goes to `/detailed`.

### 8.2 Google Rich Results Test (owner or implementer after a preview URL exists)

1. [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)
2. Run against `/`, `/detailed`, one guide URL once a slug exists (public or a temporary preview the owner deploys).
3. Expect `WebApplication` and `FAQPage` on `/`; `BreadcrumbList` + `FAQPage` on a guide; **no** FAQ errors about missing visible text.
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
4. Inspect `/`, `/detailed`, `/simulations`, one `/guides/` URL once it exists
5. Optional: domain property `maliyet.lol` if both www and apex should report together (only if www is in use; Q4 301s www to apex)

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

Expect **200**, not 403. Then `curl -s -A "GPTBot" https://maliyet.lol/detailed` should contain `Detaylı`.

---

## 9. Risks, PR-sized steps, remaining TBD

### 9.1 Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Hydration mismatch vs `localStorage` draft | React warns / blank Detaylı | Restore draft in `useEffect` only (§7.2) |
| Soft 404s from SPA fallback | Junk URLs look like Hızlı to Google | Prerender the real set; later `"404-page"` step (Q3) |
| Hash bookmarks break | Existing `#detailed-feasibility` links | Inline hash→English-path script (§2.3) |
| New dependency creep | Q7 forbids packages | Option A only; stop if Node+Vite SSR is not enough |
| Request-time Worker “just for redirects” | Breaks the no-Worker / no-cost rule | `_redirects` + client hash map + dashboard www rule |
| FAQ JSON-LD ≠ visible FAQ | Rich Results fail / cloaking | One copy module, tests; Hakkında on every calculator page |
| Cloudflare Training / Bot Fight still blocking | GPTBot 403 despite robots Allow | Owner checklist §4.4 (Q6) |
| Prerendering Hesapla results | Would leak a fake “official” P&L | Never prerender calculated figures |
| `/detailed/result` indexed anyway | Empty Sonuç in search | `noindex` + omit from sitemap (Q10) |
| Publishing TBD guide slugs | Wrong URLs after keyword research | Template only until Q9 slugs exist |
| `hydrateRoot` in `npm run dev` | Empty `#root` throws | CSR in dev, hydrate only when `#root` has children |

### 9.2 PR-sized steps (implementation, after this plan is approved)

Do not combine these into one PR. Each is reviewable. None deploys unless the owner says so. Three-area nav is already on `main` (PR #27).

1. **English path routing, keep hashes.** Pathname helpers, `pushState` for `/`, `/detailed`, `/simulations` + Detaylı suffixes, inline hash→path map, `/quick` and `/detailed/menu` 301s, tests. Visible copy stays Turkish. No prerender yet.
2. **`hydrateRoot` + draft restore in `useEffect`.** No user-visible product change except a possible one-frame empty Detaylı on refresh. Tests that `window` is not required to import the page modules.
3. **`seoCopy.ts` + per-path Turkish title / English canonical on client navigations.** Still one `index.html` for crawlers at this step. `/detailed/result` already `noindex` on the client.
4. **Prerender script (option A) + wrangler `html_handling`.** Emit the calculator English paths. CI `curl` greps. `public/_redirects` for `/quick` and `/detailed/menu`. SPA fallback stays on (Q3).
5. **`robots.txt`, generated `sitemap.xml` (omit `/detailed/result`), expanded `llms.txt`.** Named bots including training.
6. **Guides template** (visual PR, 390 + desktop). Live `/guides/<slug>` files wait for Q9 slugs.
7. **JSON-LD audit + Rich Results.** Fix mismatches. Owner runs GSC/Bing/dashboard (§8.3–8.4, §4.4) and confirms www → apex (Q4).
8. **Later: `not_found_handling: "404-page"`** + `404.html`, only after steps 4–6 have prerendered every known path and CI covers them (Q3).

### 9.3 Remaining TBD (not open product questions)

- **Guide slugs** after keyword research (Q9).
- **Owner verifies** www → apex dashboard 301 (Q4).
- **Owner verifies** Cloudflare AI crawler / Training Allow (Q6).

---

## 10. What this plan does not do

- Does not authorise coding, deploy, or secrets.
- Does not change Quick or Detailed financial formulas.
- Does not add a third calculator engine.
- Does not build Yiyecek/İçecek comparison or fiyat-mı-adet-mi (rejected).
- Does not run keyword research or invent final `/guides/` slugs.
- Does not touch Cloudflare dashboard (owner).
- Does not add React Router, a CMS, i18n, a new npm package, or a paid prerender service.

---

## 11. Current-repo facts this plan is based on

- Stack: React 18, Vite 6, Tailwind, daisyUI, TypeScript. `package.json` deploy = `vite build && wrangler deploy`.
- `wrangler.jsonc`: `assets.directory = "./dist"`, `not_found_handling = "single-page-application"`, no `main`, `workers_dev: false`, routes on `maliyet.lol` / `www.maliyet.lol`.
- Hash IA today (PR #27 is on `main`): `#quick` / `#quick-calculation`, `#detailed-feasibility` + suffixes, `#simulations` / `#simulasyonlar`. Desktop nav is the left column of the 1152px white sheet.
- `index.html` already has `lang="tr"`, title, description, canonical, OG, Twitter, `WebApplication`, `FAQPage`, and a visible FAQ footer outside `#root`.
- `public/robots.txt`, `public/sitemap.xml` (only `/`), `public/llms.txt`, `public/og.jpg` already exist and will be extended, not invented.
- Persistence: Quick none; Detailed `localStorage` key `maliyet.detailed.draft.v1`. No server.
- Authority docs: `TECH_STACK_AND_CONSTRAINTS.md` (static assets, no extra Cloudflare products), `FRONTEND_IMPLEMENTATION_SPEC.md` §2.2 (share tags), `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §6 (area nav / hash). This plan does not override financial specs.
