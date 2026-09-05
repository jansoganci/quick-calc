# Detailed Feasibility — Downloadable Report Implementation Plan

**Status:** **Implemented.** Every task in §5 is built, and the report has been verified end to end in Chrome — flow, print layout and a saved A4 PDF inspected page by page. Two things were learned in the build and are recorded where they belong:

- **The print call needs no frame hop.** T-03 planned to defer `window.print()` by a `requestAnimationFrame` so the dialog could leave the DOM first. It is unnecessary and, in an automated browser, unreliable: React commits the DOM before effects, and a child's effect (the dialog closing itself) runs before its parent's. `useReportPrint` calls print directly in the effect.
- **A pre-existing bug surfaced.** `ChannelTable`'s desktop grid declared seven tracks but laid down eight cells a row, so every row wrapped one cell early. It was wrong on screen at `lg` too, since commit `1859533`; the report is simply where it was finally seen. Fixed as part of L2 ("no missing columns").

Draft persistence of `İşletme adı` is a later locked decision, implemented per §13 Q1's recommendation: stored beside `form` in the existing draft payload, prefilled into the dialog, still required, and never on the calculation path.
**Owns:** how the Detailed Feasibility result becomes a downloadable PDF report — mechanism, report content, print layout, the download flow, task order, verification.
**Does not own:** the goal itself (`DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` Part B), persistence rules (`TECH_STACK_AND_CONSTRAINTS.md` §4), layer boundaries (`APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`), the locked visual direction (`DESIGN_DIRECTION.md`), the screen UI (`DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md`), or any formula (`DETAILED_FINANCIAL_SPEC.md`).

**This document is the implementation source of truth for the report work.** Where it touches scope another document owns, it references that document rather than restating or overriding it.

**Revision — the product decisions in §3.2 are locked and this document has been reconciled to them.** The earlier proposal to add an optional business-name *form field*, and the open question about whether the name should exist at all, are **withdrawn and replaced** by the locked modal flow in §3.2 and task T-05. Nothing in this document should be read as reopening them.

**Companion documents:**

| Document | Owns | Relationship to this plan |
| --- | --- | --- |
| `docs/DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` | Draft autosave (Part A, implemented) and the recorded report goal (Part B) | **Part B is the parent of this document.** Its B1–B5 are inputs here; its B4 "not decided" list is answered here. When this plan is approved, B4 should point at this file |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` | Stack, persistence, exclusions | §5, §6.2, §7.1 constrain the mechanism choice (§10) |
| `docs/DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` | Detailed screen UI | §2 (input IA), §4.6 (tables), §4.7 (assumptions), §8.1 (structure), §8.2 (non-negotiables) are binding here |
| `docs/DESIGN_DIRECTION.md` | Locked visual direction | V1–V4, V6, V9, V11, V12 and §3 (excluded visual language) apply to paper and to the modal |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` | Structure and boundaries | R1–R7 govern where the new modules go |
| `docs/DETAILED_FINANCIAL_SPEC.md` | Formulas, outputs, engine version | **Untouched by this work.** No formula changes, no new output |
| **Design canvas** (Claude Design pass) | Report cover, page structure, table treatment in print, appendix, disclaimer placement, the name modal, the download action | https://claude.ai/code/artifact/38dbce39-14da-48e6-ac94-957b6bbb3417 — §7 records what it settled |

---

## 1. Goal

Make a completed Detailed Feasibility result **downloadable as a PDF the owner can keep, print, and hand to a bank, a partner, a landlord or a grant programme.** Free, no account, no gate (`DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` B1/B3).

Four properties decide whether this succeeds:

1. **It is correct in Turkish.** Every diacritic renders, every figure is formatted `tr-TR`, and the text in the PDF stays selectable and searchable.
2. **It is auditable.** It states the inputs it used, not only the conclusions, and it states its own limits.
3. **It is trustworthy.** Every figure is the engine's, formatted once by the existing utilities, never recomputed or reformatted for paper (`CLAUDE.md` §3, `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §8.2).
4. **It looks like the product.** The quiet analytical language, unchanged, adapted to paper.

## 2. Current state

Verified against the working tree.

| Area | State |
| --- | --- |
| Result content | Complete. `DetailedResults.tsx` renders money flow, scenarios, projection, payback, channel economics, break-even, assumptions |
| View-model boundary | Complete and well placed. `viewModel.ts:179` — `buildView(result, input)` already receives **both** `DetailedResult` and `DetailedResolvedInput` |
| Turkish formatting | Already centralized and correct: `lib/money.ts`, `lib/number.ts`, `lib/percent.ts` are all `Intl.NumberFormat('tr-TR')`, applied inside `viewModel.ts` / `resultView.ts`. Nothing else formats a figure |
| Print support | **None.** No `@media print`, no `print:` variants, no trigger, no cover, no appendix, no disclaimer section |
| Charts | Inline SVG with literal hex paint (`ProjectionChart.tsx:32+`, `PaybackChart.tsx:31+`) |
| Reconciliation bar | Tailwind background classes (`resultView.ts:42` → `bg-qc-bar-*`) with white in-bar labels (`text-qc-on-accent`) |
| Tables | None are `<table>` elements. `MonthTable`, `ScenarioTable`, `ChannelTable` are CSS grids of `div`s |
| Month table | Conditionally **mounted** behind `showMonthTable` |
| Assumptions block | Always mounted; visibility is CSS (`AssumptionsList.tsx:34`) |
| Modal / dialog | **None anywhere in the app.** No pattern to follow, no dependency to reuse |
| Business name | Does not exist in `formState.ts`, the engine, or the draft codec |
| Disclaimer copy | Two short lines exist — `SHELL_COPY.footerNature`, `COPY.resultLimitation`. No report-grade limitation text |
| Draft persistence | Implemented, form-only payload, `maliyet.detailed.draft.v1` |
| Dependencies | React, Vite, TypeScript, Tailwind, daisyUI. No chart, PDF, date, dialog or DOM library |
| Breakpoints | Tailwind defaults — `md` 768px, `lg` 1024px. No custom `screens`, no `print:` variants, **no `max-lg:` usage anywhere** |

## 3. Decisions already made

### 3.1 Carried in from the locked documents

- The report is **free**, no account, no payment gate. **Detailed Feasibility only** — Quick keeps `Özeti kopyala`.
- **No backend, no new Cloudflare product, no PDF service** (`TECH_STACK_AND_CONSTRAINTS.md` §2.2, §5 **[LOCKED]**).
- **No new dependency** unless a concrete need survives §6.2 and §7.1.
- **Every figure comes from the engine or the view model.** No recomputation, no second formatter, no new financial figure, no formula change.
- **Turkish only** (V11).
- **The locked visual language applies to paper and to the modal**: near-monochrome, hairline rules, no cards, no colour for negatives, IBM Plex, and none of the language excluded by `DESIGN_DIRECTION.md` §3 (badges, pills, gradients, glows, shadows-as-decoration, per-KPI accents, SaaS dashboard layouts).
- **The screen UI is not redesigned.** Screen behaviour changes only where the report cannot work otherwise, and each change is named per task in §8.

### 3.2 Newly locked product requirements

**L1 — Turkish PDF output is mandatory.** `ğ Ğ ş Ş ı İ ç Ç ö Ö ü Ü` must render correctly. Numbers must be Turkish-formatted (`1.000`, `10.000`, `1.000.000`, decimal comma, `%` figures likewise). The report **reuses the existing centralized formatters** — no report-specific number or money formatting, no second formatting system. PDF text stays selectable and searchable.

**L2 — Every important result must print correctly.** Charts, the reconciliation visual, scenarios, the month-by-month projection, channel economics, break-even, assumptions and the input appendix all appear, with: no clipped chart, no missing column, no mobile fallback layout, no chart split across pages, no avoidable split row, repeated headers on long tables, readable chart labels, vector SVG, a visible reconciliation bar, and a 24/36-month projection that stays understandable across pages.

**L3 — The download flow is LOCKED.** After a valid result exists, a report action appears in the result UI. Clicking it opens a **modal**, which asks for **`İşletme adı`**. The name is **required**: the download button stays disabled until a valid non-empty name is entered, and becomes enabled once it is. The name is used in the **report cover/title** and the **PDF filename**. It **never enters the financial engine and never affects a calculation** — it is report metadata, not a financial input. The modal stays inside the quiet visual language: not oversized, no card-heavy styling, no decorative icon, no gradient, no glow, no colourful CTA treatment, no unnecessary confirmation step. Desktop and mobile are designed deliberately.

**L4 — A disclaimer / limitation section is mandatory,** stating that this is a preliminary feasibility analysis; that the calculations depend on the inputs and assumptions supplied; that projections and charts are estimates, not guarantees; that actual commercial, tax, operational and financial outcomes may differ; that the report is not accounting, tax, investment, legal or financial advice; and that the provider does not accept liability for decisions made solely from it. The copy is **professional and credible**, never defensive or amateur. It is **visible but does not dominate**. All final copy lives in the centralized copy/labels system.

**L5 — Claude Design designs the report.** The visual design is not invented during implementation. The design pass covers cover, hierarchy, typography, section structure, spacing, table treatment, charts in print, appendix, disclaimer placement, the name modal, the in-app action and the mobile flow. It may adapt the screen design to paper but must not redesign the product identity. **The pass has been run; its output is the canvas linked above and the decisions recorded in §7.**

**L6 — Mechanism.** Browser Print CSS → Save as PDF remains preferred and is **re-validated against L1–L4 in §10**. No switch to jsPDF, pdf-lib, rasterisation or a backend renderer merely because the design got more sophisticated.

### 3.3 What L3 resolves in the earlier draft of this plan

The previous revision proposed an **optional business-name field in the Detailed form**, and flagged it as needing approval because `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §8.2 rule 3 forbids new inputs. **That proposal is withdrawn.** Under L3 the name is collected in the report modal, at report time, and never becomes a form field.

This is the better answer on the merits, not merely a different one:

- **§8.2 rule 3 is no longer engaged.** The ten-section input IA is untouched; no field is added to `DetailedFormState`, `toInput.ts`, `DetailedInput`, validation or the engine. The contradiction the earlier revision raised (C1) **disappears** rather than needing an exception.
- **Required-at-generation is stronger than optional-in-form.** Every report has a subject; the cover and the filename never fall back to an anonymous variant, so the design carries one case instead of two.
- **It cannot leak into a calculation.** The name lives in report-scope state, structurally out of reach of `toInput.ts`.

## 4. Findings

Sixteen findings from the code and the design pass. They are why the task list looks the way it does.

### F1 — Printing currently produces the phone layout

Print media queries evaluate against the **page area**, not the screen. A4 portrait is 210mm ≈ **794 CSS px** at 96dpi; with a 12mm side margin the page area is 186mm ≈ **703px**. Both are below `lg` (1024px), so every `lg:` rule switches off on paper:

| Component | Rule | What paper gets today |
| --- | --- | --- |
| `DetailedResults.tsx:57` | `hidden lg:block` on the large chart | The **phone-sized** chart |
| `ChannelTable.tsx:26` | `hidden lg:block` on the 7-column table | The transposed per-channel fallback |
| `MonthTable.tsx:12` | `hidden … lg:block` on 3 of 6 columns | Adet, Katkı and Sabit gider **missing** |
| `AssumptionsList.tsx:34` | `open ? 'block' : 'hidden lg:grid'` | An **empty** assumptions block |
| `DetailedResults.tsx:88` | `lg:grid lg:grid-cols-3` on break-even | Three stacked cells instead of a row |

This is L2's single largest blocker.

### F2 — Only `lg` is affected, and the tree is clean enough for a one-line fix

`md` (768px) still matches at A4 width, so sections are already expanded on paper (`DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §3: "`md` changes section behaviour; `lg` changes page layout"). `grep -rn "max-lg\|print:" src/` returns **nothing**, so redefining the `lg` screen as `{ raw: 'screen and (min-width: 1024px), print' }` cannot break an existing rule.

### F3 — The reconciliation bar prints blank; the charts print correctly

Browsers strip CSS backgrounds when printing unless the page opts in. `ResultBar.tsx:20` paints its segments with `bg-qc-bar-*` **backgrounds** and writes in-bar labels in `text-qc-on-accent` (`#FFFFFF`): on paper, an empty outlined rectangle containing white text on white. L2 names this explicitly.

SVG is the opposite case — `fill`/`stroke` are paint attributes, not CSS backgrounds — so both charts print as vectors with no intervention.

### F4 — The month table cannot be revealed by CSS

`showMonthTable` gates **mounting**. A stylesheet cannot print a node that is not in the DOM. `AssumptionsList` is the opposite case and F1's fix repairs it.

### F5 — Nothing is a real table, and the row collections are unbounded

`thead { display: table-header-group }` is the only mechanism that repeats a header across pages, and it needs real table markup. A 36-month projection is roughly two pages, and page 2 would carry six columns of unlabelled numbers — exactly what L2 forbids. `limits.ts` caps field *values* but places **no cap on the number of products, positions, expense lines or investment items**, so the appendix tables are unbounded too.

### F6 — The appendix needs no new plumbing and no new arithmetic

`buildView(result, input)` already holds `DetailedResolvedInput`: every product, position, line, mix share and rate, post-validation. Group totals also exist on the base stabilized month (`fixedFactor: 1`, `calculate.ts:135`): `monthlyPayroll`, `monthlyOwnerCost`, `monthlyOccupancyCost`, `rentCost`, `monthlyOpex`, plus `result.totalInitialInvestment`. **No total in the appendix is ever summed in a component.**

### F7 — Chrome has no CSS page numbering

`@page` margin boxes (`@bottom-center { content: counter(page) }`) are unsupported in Chromium and WebKit. Page numbers, URL and date come from the browser's own print header/footer checkbox. Documented acceptance, not a defect (§13 Q2).

### F8 — The PDF filename is controllable with no dependency

Browsers derive the suggested "Save as PDF" filename from `document.title`. Under L3 the business name is always present, so the title swap is deterministic: `Fizibilite Raporu — {ad} — {YYYY-AA-GG}`.

### F9 — Turkish output is *free* under print CSS and *expensive* under every alternative

`lib/money.ts`, `lib/number.ts` and `lib/percent.ts` are already `Intl.NumberFormat('tr-TR')`, and `percent.ts` even handles the Turkish sign convention (`-%104,4`, not `%-104,4`). Because the report renders the same `DetailedView` the screen renders, **L1's number formatting is satisfied by construction** — there is nothing to re-implement, and no place a second formatter could creep in.

The same applies to diacritics: the page's own IBM Plex faces are already loaded (`index.html`) and print reuses them, so `ğ ş ı İ ç ö ü` are ordinary text. A PDF library would have to re-implement **both** — Unicode font embedding *and* `tr-TR` number formatting — which is precisely the duplication `CLAUDE.md` §3 and L1 forbid.

**Nuance to record honestly:** the app's money convention is whole TL for results (`formatTry`, 0 fraction digits) with two decimals where the spec calls for them (`formatTryExact`, used for unit prices — `95,00 TL`). The machinery renders `1.500.000,50 TL` correctly; **which** fields carry decimals stays owned by the financial and frontend specs, and the report inherits that decision rather than making a new one.

### F10 — Sticky, fixed and animated chrome all need print resets

`AppHeader` is `lg:sticky` (`AppShell.tsx:49`), the summary pane is `lg:sticky` (`DetailedFeasibilityPage.tsx:68`), `MobileSummaryBar` is `fixed inset-x-0 bottom-0` twice (`MobileSummaryBar.tsx:29,51`), and `qc-enter` / `qc-live` are opacity animations that can print a half-faded page.

### F11 — A4 landscape would satisfy `lg` by coincidence; that is not a reason to use it

297mm − 2×12mm = 273mm ≈ **1032px**, barely past 1024. Any margin above ~12.5mm breaks it, and landscape is the wrong shape for this document. Rejected.

### F12 — The large chart's labels are too small on paper

`CHART_FRAMES.lg` is a 1092-unit viewBox with `labelSize: 11`, rendered into a ~703px page area: a 0.64 scale, so labels land at ~7px ≈ **5.3pt**. L2 requires readable chart labels. The geometry module is already frame-parameterised, so a `print` frame is a data addition, not new logic.

### F13 — Print typography must be re-set for paper, not inherited pixel-for-pixel *(design pass)*

The screen's 13px body is 9.75pt on paper and the 11px eyebrows are 8.25pt — legible only just, and below what a document handed to a bank should be. The design pass re-sets the ramp for print (§7.2). This follows the principle `DESIGN_DIRECTION.md` §1.1 already locks for mobile — *"figure and label sizes are re-set; the desktop scale is not simply reduced"* — applied to a third medium. It is **not** a redesign: the faces, weights, colours and hairlines are unchanged.

### F14 — The modal must be gone from the DOM *before* `window.print()` runs

`window.print()` is synchronous and blocks. Calling it in the same handler that closes the modal prints the modal, because React has not re-rendered yet. The print call must happen after the DOM update — a `useEffect` on a `printing` flag, or a `requestAnimationFrame` after the state change. `print:hidden` on the dialog is a second belt, not a substitute.

### F15 — The native `<dialog>` element covers the modal requirements with no dependency

`showModal()` gives a focus trap, `Esc` to close, inert background and a `::backdrop` — everything L3 asks for, from the platform. daisyUI's modal is available but brings its own card styling to fight; a bespoke overlay would re-implement focus trapping badly. Note `DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` A8's rule — *a browser `confirm()` dialog is not in this product's vocabulary* — is about `window.confirm`, not about `<dialog>`; the report modal is a deliberate, designed surface, not a browser alert.

### F16 — There is no modal precedent in the app, so the design pass had to set one

No dialog, overlay, sheet or scrim exists anywhere in the tree. §7.3 records the anatomy so this does not get invented twice.

---

## 5. Priority table

| ID | Task | Priority | Effort | Screen behaviour | Mobile impact | Depends on |
| --- | --- | --- | --- | --- | --- | --- |
| **T-01** | Print breakpoint strategy (`lg` applies to print) | **P0** | Small | None | Same PDF from a phone as from a desktop | — |
| **T-02** | Print reset: hide chrome, unstick, stop animations, `@page` | **P0** | Small | None | Hides the fixed mobile bar from print | T-01 |
| **T-03** | Report shell: cover, section order, print orchestration | **P0** | Medium | None on its own | None | T-01, T-02 |
| **T-04** | Month table always present in the report | **P0** | Small | None — toggle preserved | None | T-01 |
| **T-05** | Report action + business-name modal (L3) | **P0** | Medium | **Yes** — one new control, one new dialog | Bottom sheet, 44px targets | T-03 |
| **T-06** | `MonthTable` → real `<table>` with repeating header | **P1** | Medium | None visually | None | T-04 |
| **T-07** | Report view model: input appendix data | **P1** | Medium | None | None | — |
| **T-08** | Appendix rendering (`<table>`-based, break-safe) | **P1** | Medium | None — print-only | None | T-07, T-06 |
| **T-09** | Reconciliation bar fidelity in print | **P1** | Small | None | None | T-02 |
| **T-10** | Print chart frame (label legibility) | **P1** | Small | None | None | T-01 |
| **T-11** | Disclaimer — short on cover, full as Ek B (L4) | **P1** | Small | None — print-only | None | T-03 |
| **T-12** | Turkish output conformance: guards + tests (L1) | **P1** | Small | None | None | T-07 |
| **T-13** | Page-break tuning across every report section | **P1** | Small–Medium | None | None | T-03…T-11 |
| **T-14** | PDF filename via `document.title` | **P2** | Small | Title changes during the dialog | Same | T-05 |
| **T-15** | Mobile print copy + unsupported-browser fallback | **P2** | Small | **Yes** — one hint line | The mobile path's only affordance | T-05 |
| **T-16** | `ScenarioTable` / `ChannelTable` → `<table>` | **P2** | Medium | None visually | None | T-06 |

**Counts: P0 = 5 · P1 = 8 · P2 = 3.** Deferred items are in §15.

---

## 6. Detailed task analysis

Every task carries: problem · proposed solution · affected files · dependencies · screen behaviour · mobile impact · risks · acceptance criteria · effort.

### T-01 — Print breakpoint strategy · P0 · Small

**Problem.** F1: printing produces the phone layout — three month-table columns dropped, the large chart dropped, the channel table transposed, the assumptions block empty. L2 forbids all four.

**Proposed solution.** One `theme.extend.screens` entry in `tailwind.config.ts`:

```ts
screens: { lg: { raw: 'screen and (min-width: 1024px), print' } }
```

Every existing `lg:` utility then applies on paper, and `lg:hidden` correctly removes the mobile duplicates. `sm`, `md`, `xl` keep their defaults.

**Alternatives considered.** (a) `print:` variants beside each `lg:` in eight components — ~40 class edits, the same intent twice, silently wrong for every component added later; kept as the documented fallback. (b) A separate print-only component tree — duplicate markup with drift risk, and it would still not fix the shared components. (c) Landscape so `lg` matches naturally — rejected, F11.

**Affected.** `tailwind.config.ts`. No component changes.

**Dependencies.** None. **Screen behaviour:** unchanged — `screen and (min-width: 1024px)` is exactly today's condition. **Mobile:** the PDF becomes device-independent — a phone prints the same document a desktop does.

**Risks.** Tailwind generates no `max-lg:` variant for a `raw` screen. Nothing uses it today (F2); §14 R1 and the §12 guard test hold the line.

**Acceptance.** Chrome print preview at A4 portrait shows six month-table columns, the 1092-frame chart, the 7-column channel table, the two-column assumptions list and the three-cell break-even row; no horizontal overflow, nothing clipped.

---

### T-02 — Print reset · P0 · Small

**Problem.** F10: sticky headers, the fixed mobile bar, the mode switch, the form column, the colophon and opacity animations all reach the printer.

**Proposed solution.** Page-level rules in `src/app/index.css`; element-level suppression via `print:` variants at the call site — *page frame in the stylesheet, element visibility in the component.*

```css
@page { size: A4 portrait; margin: 14mm 12mm; }

@media print {
  html, body { background: #fff; }
  .qc-enter, .qc-live { animation: none !important; }
  [class*="sticky"], [class*="fixed"] { position: static !important; }
  a[href]::after { content: none; }
  h1, h2, h3 { break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
}
```

`print:hidden` goes on `AppHeader`, `SloganRow`, `AppFooter`, the `<main>` holding the form and summary pane, and `MobileSummaryBar`. Hiding `<main>` removes the two-column grid in one rule, so the 372px sidebar never has to survive a 703px page.

**Affected.** `src/app/index.css`, `AppShell.tsx`, `DetailedFeasibilityPage.tsx`, `MobileSummaryBar.tsx`.

**Dependencies.** T-01. **Screen behaviour:** unchanged. **Mobile:** the fixed bottom bar no longer lands mid-page in the PDF.

**Risks.** Hiding `<main>` also hides the verdict sentence — T-03's cover restates it from `view.verdict`, the same `VerdictSegment[]`, no new figure.

**Acceptance.** Print preview shows no masthead, mode switch, form, summary pane, mobile bar or colophon, and no animation artefacts. Page 1 is the cover.

---

### T-03 — Report shell: cover, order, print orchestration · P0 · Medium

**Problem.** There is no cover identifying the document and no code path that produces a report.

**Proposed solution.**

- **`ReportCover.tsx`** — `hidden print:block`, rendered above `<main>` so it is page 1, laid out per §7.1: business name, date, the R1 verdict sentence, one headline figure, three secondary figures, the guardrail note, the short disclaimer, `break-after: page`.
- **`useReportPrint.ts`** — the print orchestration hook: takes the business name, swaps `document.title` (T-14), waits for the DOM to settle after the modal closes (F14), calls `window.print()`, restores the title on `afterprint` **and** in a `finally`. It lives under `hooks/` because it touches `window`/`document` and `tsconfig.json` compiles the rest of the feature without the DOM lib — the same constraint that placed `draftStorage.ts` there (`DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` A5).
- **Report-scope state** — the business name is held in report state (`useDetailedCalc` or a small `useReportState`), never in `DetailedFormState`. See §13 Q1 for whether it also persists.

**Affected.** New `components/ReportCover.tsx`, `hooks/useReportPrint.ts`; changed `DetailedFeasibilityPage.tsx`, `labels.ts`.

**Dependencies.** T-01, T-02. **Screen behaviour:** none on its own (the control arrives with T-05). **Mobile:** none.

**Risks.** F14's ordering bug is the one that will actually bite; the hook owns it so it is fixed in one place. The cover must not drift into a KPI dashboard — §7.1 fixes the anatomy.

**Acceptance.** Printing produces a cover on page 1 with the verdict sentence and four figures, and results from page 2. Nothing of the cover is visible on screen at any width.

---

### T-04 — Month table always in the report · P0 · Small

**Problem.** F4: the month-by-month projection is absent from the report unless the reader had expanded it. L2 requires it always.

**Proposed solution.** Mount unconditionally; move the toggle from mounting to CSS:

```tsx
<div className={cn(showMonthTable ? 'block' : 'hidden print:block')}>
  <MonthTable rows={view.monthRows} />
</div>
```

Cost is at most 36 hidden rows, and it removes the whole class of "report content depends on UI state" bugs.

**Affected.** `DetailedResults.tsx`, `MonthTable.tsx`.

**Dependencies.** T-01. **Screen behaviour:** unchanged — verify the toggle label, transition and scroll position are untouched. **Mobile:** none.

**Note on §4.6.** `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §4.6 specifies the month table as *"collapsed by default"*. That is a **screen** rule and stays true; the report is a different medium. Record the report-only exception in §4.6 when this plan is approved (§14 C1).

**Acceptance.** Print preview contains the full month table with the toggle closed, open, and after a reload.

---

### T-05 — Report action and business-name modal · P0 · Medium

**Problem.** L3 locks a flow that does not exist: an action in the result UI, a modal asking for `İşletme adı`, a download button disabled until the name is valid, and the name flowing to the cover and the filename — without ever touching the engine.

**Proposed solution.** Per the design pass (§7.3, §7.4):

- **`ReportActionButton`** — one component, two call sites: the foot of `SummaryPane` (desktop, `hidden lg:block`) and the end of the results region (mobile, `lg:hidden`). Outlined 42/48px control, label `Fizibilite raporunu indir`, rendered **only when `view !== null`** so V6 is not weakened.
- **`ReportNameDialog`** — a native `<dialog>` (F15) opened with `showModal()`: title, one-line lede, one `TextField` (`İşletme adı`, reusing `src/components/TextField.tsx`), a hint line, a primary `Raporu indir` button and a quiet `Vazgeç`. Desktop 400px centred; mobile a full-width bottom sheet. No icon, no card stack, no second confirmation.
- **Validation** — `name.trim().length > 0` enables the button; nothing else. **No error message exists, because a disabled button cannot produce an error state.** A length cap (~60) protects the filename and the cover line.
- **Submission** — closes the dialog, then prints after the DOM update (F14), via `useReportPrint`.

**Affected.** New `components/ReportActionButton.tsx`, `components/ReportNameDialog.tsx`; changed `SummaryPane.tsx`, `DetailedResults.tsx` (or `DetailedFeasibilityPage.tsx`) for the two call sites, `labels.ts`, `index.css` (dialog + `::backdrop` rules), `hooks/useReportPrint.ts`.

**Dependencies.** T-03. **Screen behaviour:** **yes** — one new control and one new dialog; this is the minimum for the feature to exist. **Mobile:** deliberate — bottom sheet, 44px+ targets, no third control added to the crowded sticky bar (§7.4).

**Risks.** (a) F14 — printing the modal; owned by the hook. (b) The dialog must be `print:hidden` as a second guard. (c) `<dialog>` needs explicit `::backdrop` styling or it inherits a browser default; §7.3 fixes the value. (d) iOS Safari focus behaviour on `showModal()` with a text input — verify in the §12 matrix.

**Acceptance.** The action appears only after `Hesapla`; the dialog opens with focus in the field; the button is disabled for empty and whitespace-only names and enabled otherwise; `Esc` and backdrop-click close it; the printed PDF contains the report and **not** the dialog; the name appears on the cover and in the filename.

---

### T-06 — `MonthTable` → real `<table>` · P1 · Medium

**Problem.** F5: a 24–36 row table spans pages, and a CSS grid of `div`s cannot repeat its header. L2 requires repeated headers and an understandable multi-page projection.

**Proposed solution.** `<table class="w-full table-fixed">` with a `<colgroup>` reproducing today's `56px 1fr 1fr` / `lg:72px repeat(5,1fr)` widths, `<thead>` carrying the existing 11px uppercase eyebrows, `border-collapse: collapse` for the hairlines, and in the print block `thead { display: table-header-group }` plus `tr { break-inside: avoid }`. The three `lg`-only columns become `hidden lg:table-cell` — which, after T-01, means visible on paper.

**Affected.** `MonthTable.tsx` only; its data (`view.monthRows`) is unchanged.

**Dependencies.** T-04. **Screen behaviour:** visually unchanged; DOM semantics improve (better for assistive technology too). **Mobile:** unchanged three-column form.

**Risks.** Pixel drift — table layout distributes borders and padding differently from grid. Acceptance is visual equality, not "close".

**Acceptance.** Screenshots at 390px and 1280px before/after are identical. A 36-month horizon repeats the header on every page and splits no row.

---

### T-07 — Report view model: the input appendix data · P1 · Medium

**Problem.** The report states conclusions but not inputs; `DetailedView` carries results only.

**Proposed solution.** A pure, DOM-free builder testable in the existing `node` Vitest environment:

```ts
// reportView.ts
export type ReportInputRow   = { label: string; value: string }
export type ReportInputTable = { columns: string[]; rows: string[][] }
export type ReportInputGroup = {
  section: SectionId
  title: string
  rows?: ReportInputRow[]
  table?: ReportInputTable
  total?: ReportInputRow      // engine-sourced only, never summed here
}
export function buildReportInputGroups(
  input: DetailedResolvedInput,
  result: DetailedResult,
): ReportInputGroup[]
```

Wired in at `viewModel.ts:179`, which already has both arguments (F6). Values are **engine-resolved** and formatted **only** by `lib/money.ts`, `lib/number.ts`, `lib/percent.ts` — L1's "no report-specific formatting" is a structural property of this builder, enforced by T-12. Content, grouping and omissions: §9.2.

**Affected.** New `reportView.ts`, `reportView.test.ts`; changed `viewModel.ts` (one field), `labels.ts`.

**Dependencies.** None. **Screen behaviour:** unchanged — the field is consumed only by print-only components. **Mobile:** none.

**Risks.** Scope creep into a per-product P&L, which `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §4.6 **rejects**. Hard rule: *the appendix restates inputs and engine-published totals; it never derives a figure.*

**Acceptance.** Tests assert every `DetailedResolvedInput` field is rendered or in an explicit omission list; every total equals the engine field it cites; the delivery group disappears when `channelMix.delivery === 0`.

---

### T-08 — Appendix rendering · P1 · Medium

**Problem.** The appendix data needs a print-only surface that survives page breaks (F5: unbounded collections).

**Proposed solution.** `ReportAppendix.tsx`, `hidden print:block`, `break-before: page`, following §9.2's order. Repeating-row groups render as real `<table>`s for the same header-repetition reason as T-06; definition-list groups reuse the `AssumptionsList` idiom so the appendix reads as the same document. Layout per the design pass (§7.2).

**Affected.** New `components/ReportAppendix.tsx`; changed `DetailedFeasibilityPage.tsx`.

**Dependencies.** T-07, T-06. **Screen behaviour:** none — print-only. **Mobile:** none.

**Risks.** Length: 40 products make a long appendix. Correct behaviour for an auditable document; accepted, not truncated.

**Acceptance.** With 1 product and with 40: every input present, no header-less continuation page, no row split across pages.

---

### T-09 — Reconciliation bar fidelity in print · P1 · Small

**Problem.** F3: the primary visual prints as an empty rectangle with invisible white labels. L2 requires it visible.

**Proposed solution.** `print-color-adjust: exact; -webkit-print-color-adjust: exact` scoped **only** to the bar segments and the legend swatches — never the page. The palette stays the locked monotone ramp, so the printed bar is grey-scale by design and survives a monochrome printer (V1/V3 respected, not worked around).

**Affected.** `ResultBar.tsx`, `index.css`.

**Dependencies.** T-02. **Screen behaviour:** unchanged. **Mobile:** none.

**Risks.** A viewer who disables background graphics still loses it — mitigated because the reconciling table beneath carries every figure in text, so nothing exists only inside the bar.

**Acceptance.** Print preview shows all nine segments with readable in-bar labels and the legend swatches; no other element gains forced colour.

---

### T-10 — Print chart frame · P1 · Small

**Problem.** F12: at print scale the `lg` chart's axis labels land near 5.3pt. L2 requires readable labels.

**Proposed solution.** Add `print` entries to `CHART_FRAMES` sized to the page area (~703 units wide) with `labelSize: 11`, rendered inside `hidden print:block` while the `lg` chart carries `print:hidden`. No geometry logic changes — the module is already frame-parameterised.

**Affected.** `chartGeometry.ts`, `DetailedResults.tsx`.

**Dependencies.** T-01. **Screen behaviour:** unchanged. **Mobile:** none.

**Risks.** A third SVG instance in the DOM; unmounted from view, negligible.

**Acceptance.** Printed axis labels measure ≥ 7pt; neither chart splits across pages; both stay vector.

---

### T-11 — Disclaimer · P1 · Small

**Problem.** L4 requires a mandatory, professional, non-dominating limitation statement. Today only two short lines exist (`SHELL_COPY.footerNature`, `COPY.resultLimitation`), neither written for a document a bank reads.

**Proposed solution.** The design pass answers the placement question **both**, in two registers (§7.5):

- **Cover, short form** — one muted paragraph at the foot of page 1, pointing at the full text.
- **`Ek B — Kapsam ve sorumluluk sınırları`** — six short paragraphs at the end of the appendix, covering L4's six points in order, plus a meta line (engine version, report date, currency).

All copy in `labels.ts` (U4: one home per label). Register is professional and factual — no `%100`, no "sorumluluk kabul etmiyoruz". Draft copy is in §9.3.

**Affected.** `labels.ts`, `ReportCover.tsx`, `ReportAppendix.tsx`.

**Dependencies.** T-03. **Screen behaviour:** none — print-only. **Mobile:** none.

**Risks.** Legal register drift. The copy in §9.3 is a draft for review, not a legal opinion; a human should approve the final wording (§13 Q3).

**Acceptance.** Both forms present; the full text covers all six L4 points; nothing about it outweighs the analysis typographically (12px, secondary grey, no box, no rule-heavy frame).

---

### T-12 — Turkish output conformance · P1 · Small

**Problem.** L1 must be enforced, not merely intended. The failure mode is a future contributor formatting a figure inside a report component.

**Proposed solution.** Tests and guards rather than new runtime code:

- A `reportView.test.ts` block asserting Turkish output on representative values: `1.000`, `10.000`, `1.000.000`, a two-decimal price (`1.500.000,50 TL`), and a percent (`%3,59`) — all produced through the existing formatters.
- A guard test asserting the report modules contain **no** `Intl.NumberFormat`, no `toFixed`, and no `toLocaleString` — the only legal source of a formatted figure is `lib/`.
- A guard test asserting report modules import no calculation function from `core/detailed`.
- A fixture with diacritics in every free-text field (`Şişli Çiğköfte Ağır İşletme`) carried through the appendix, the cover and the filename.

**Affected.** `reportView.test.ts` and one guard test file. No runtime code.

**Dependencies.** T-07. **Screen behaviour:** none. **Mobile:** none.

**Risks.** None material; a grep-style guard can produce false positives if a legitimate future need arises, which is exactly when a human should look.

**Acceptance.** All four checks pass and are part of `npm run test:run`.

---

### T-13 — Page-break tuning · P1 · Small–Medium

**Problem.** Without break rules, sections split badly: a heading alone at a page foot, a chart cut in half, a row severed. L2 forbids each.

**Proposed solution.**

| Element | Rule |
| --- | --- |
| Cover | `break-after: page` |
| Result sections that fit a page (money flow, scenarios, payback, channel, break-even) | `break-inside: avoid` |
| Projection and appendix sections | allowed to break |
| Section headings | `break-after: avoid` |
| Charts (`svg`) | `break-inside: avoid` |
| Table rows | `break-inside: avoid`; `thead { display: table-header-group }` |
| Assumptions rows | `break-inside: avoid` |
| `Ek A` / `Ek B` | `break-before: page` |

**Affected.** `index.css`, plus per-section classes in `DetailedResults.tsx`, `ReportCover.tsx`, `ReportAppendix.tsx`.

**Dependencies.** T-03…T-11 — **this runs after all report content exists.** Tuning breaks against changing content is guaranteed rework.

**Screen behaviour:** none. **Mobile:** none.

**Risks.** Chrome and WebKit honour `break-inside` on grid children inconsistently — which is why the long collections are real tables (T-06, T-08) and the other sections are page-sized.

**Acceptance.** Three fixtures (minimal, typical, 40 products × 36 months) produce no orphan heading, no split chart, no split row and no blank page in Chrome and Safari.

---

### T-14 — PDF filename · P2 · Small

**Problem.** The saved file would be named after the marketing page title.

**Proposed solution.** F8: in `useReportPrint`, set `document.title` to `Fizibilite Raporu — {ad} — {YYYY-AA-GG}`, print, restore on `afterprint` and in a `finally` so a cancelled dialog cannot leave the tab renamed. The name is sanitised for filename-hostile characters (`/ \ : * ? " < > |`), trimmed and length-capped; Turkish characters are **kept** — every target platform accepts them. Date from `Intl.DateTimeFormat('tr-TR')`; no date library (§6.2).

**Affected.** `hooks/useReportPrint.ts`, `labels.ts`.

**Dependencies.** T-05. **Screen behaviour:** the tab title changes for the duration of the dialog. **Mobile:** same mechanism.

**Risks.** Browsers sanitise further on their own; the suggested name is a suggestion, never a guarantee.

**Acceptance.** Chrome and Safari suggest the intended filename including diacritics; the title is restored after both saving and cancelling.

---

### T-15 — Mobile print copy and fallback · P2 · Small

**Problem.** On a phone the path is print sheet → *PDF olarak kaydet* / *Dosyalar'a Kaydet*, which is not obvious; a few browsers cannot print at all.

**Proposed solution.** The dialog's hint line carries the mobile wording below `lg` (§7.4). Feature-detect `typeof window.print === 'function'`; where absent, the hint says the page must be opened in Safari or Chrome rather than an in-app browser. Details in §11.

**Affected.** `ReportNameDialog.tsx`, `labels.ts`.

**Dependencies.** T-05. **Screen behaviour:** one hint line. **Mobile:** this is the mobile path's only affordance.

**Risks.** Wording drift between the two widths; both strings live in `labels.ts`.

**Acceptance.** Verified on iOS Safari and Android Chrome; the fallback appears where `window.print` is unavailable.

---

### T-16 — Other tables to `<table>` · P2 · Medium

**Problem.** `ScenarioTable` (4×3) and `ChannelTable` (3 rows + total) are grids of `div`s.

**Analysis — the answer to "does anything besides `MonthTable` materially benefit?"** For **page breaks, no**: both fit a page and `break-inside: avoid` (T-13) handles them. The benefit is semantic and accessibility-side. Convert when next touched for another reason; do not spend a rework budget on them for v1.

**Affected.** `ScenarioTable.tsx`, `ChannelTable.tsx`. **Dependencies.** T-06. **Screen behaviour:** none visually. **Mobile:** none. **Risks:** pixel drift, as T-06. **Acceptance:** visual equality at both breakpoints.

---

## 7. Design pass — what Claude Design settled

Canvas: **https://claude.ai/code/artifact/38dbce39-14da-48e6-ac94-957b6bbb3417** — seven artboards: four A4 report pages (cover; money flow + scenarios; projection + month table; appendix + limitations), the name dialog at desktop and mobile, and the action placement.

The pass took its values from the repository, not from memory: `tailwind.config.ts` tokens (`#16181C` ink, `#5B6169` secondary, `#8A9199` muted, `#A8AEB6` subtle, rules `#E3E5E8` / `#D6D9DD` / `#EEF0F2`, accent `#1D3A5F`, the nine-stop breakdown ramp), IBM Plex Sans/Mono, 4px radii, 44px touch floor.

### 7.1 Cover

Business name as the document title, date beneath it in Mono, then the R1 verdict sentence, then **one** headline figure (`Aylık işletme sonucu`, 40px Mono accent), then three secondary figures (`Başabaş`, `Yatırım geri dönüşü`, `İlk yatırım`) in a hairline-divided three-column row that reuses the existing `BreakEvenCell` anatomy. Below them the guardrails, quiet, as muted 12px lines under a labelled rule. At the foot, the short disclaimer and a Mono colophon line.

**No KPI tiles, no cards, no icons, no colour beyond the single accent figure** — the figures separate by typography alone, which is the V1/V2/V9 reading of a cover.

**Guardrails on the cover is a decision, not an inheritance:** they are engine-derived, a reviewer benefits from seeing what the tool itself flagged, and the quiet register keeps them from reading as alarms (V3).

### 7.2 Print type ramp and page frame

Re-set for paper (F13), authored at 96px/inch:

| Role | Print | Was on screen |
| --- | --- | --- |
| Cover title (business name) | 32px / 500 | — |
| Section heading | 17px / 600 | 15px |
| Body and notes | 12px muted for notes, 15px for the verdict | 12–13px |
| Table figures | 14px Mono | 13px |
| Appendix table figures | 13px Mono | — |
| Column eyebrows | 11px uppercase, 0.08em | 11px |
| Disclaimer | 12px / 1.65 | — |
| Colophon and running head | 10px Mono | — |

Page frame: **A4 portrait, `margin: 14mm 12mm`** → a 704px content column. Every interior page carries a Mono running head (`Fizibilite Raporu · {ad}` left, `Maliyet` right) above a hairline; page numbers come from the browser (F7).

### 7.3 Name dialog anatomy

400px on desktop, centred; a full-width bottom sheet on mobile with a top hairline, echoing `MobileSummaryBar`'s anatomy. Surface `#FFFFFF`, border `1px #C3C8CE`, radius 4px (the app's control radius), **no shadow**. Backdrop `rgba(22,24,28,0.28)`.

Contents: 15px/600 title `Fizibilite raporunu indir`; a 12px muted lede explaining what the name is used for; the `TextField` (`İşletme adı`) with the app's existing 40px desktop / 44px mobile control and its focus ring (`#1D3A5F` border + `0 0 0 3px rgba(29,58,95,0.13)`); a 12px hint; a full-width primary button (46px desktop / 48px mobile) in the two states — disabled `#F1F2F4` / `#DDE0E4` / `#A8AEB6`, enabled accent `#1D3A5F` on white text, matching `CalculateButton` exactly; and a centred quiet `Vazgeç`.

**No error state exists** — the disabled button means an invalid submission cannot occur, which is also why no confirmation step is needed (L3).

### 7.4 Action placement

**One component, two call sites**, mirroring how the app already expresses the same thing twice (`SummaryPane` ↔ `MobileSummaryBar`):

- **Desktop** — foot of the summary pane, under `Tüm sonuçlar ↓`, behind a hairline.
- **Mobile** — end of the results region, after the assumptions block, where reading ends.

It is an **outlined** control, not a filled accent one: the filled accent belongs to `Hesapla`, and V2 reserves the accent for the headline figure and focus states. **The mobile sticky bar gains no third control** — it already carries the result and two navigation actions at 44px each.

Label: **`Fizibilite raporunu indir`** — of the two candidates in L3, in the app's sentence case (`Özeti kopyala`, `Baştan başla`, `Tüm sonuçlar`); title case would break the house style. The dialog's primary button is the shorter `Raporu indir`.

### 7.5 Disclaimer placement

**Both, in two registers** — short on the cover, full as `Ek B` at the end (T-11, copy in §9.3). A single long block on the cover would dominate page 1; a single block at the end would let a reader who only sees the cover miss it entirely. The short form ends by naming where the full text is.

### 7.6 Table treatment in print

Header row over a 1px ink rule, `#EEF0F2` hairlines between rows, Mono right-aligned figures, name columns in Plex Sans. The reconciliation table's result row keeps its ink rules top and bottom. The month table's header repeats per page (T-06) and the design shows the continuation note; the appendix uses the same anatomy at one step smaller.

---

## 8. Architecture / data-flow changes

No new layer, no new boundary, no change to dependency direction (`APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` R1–R7).

```
formState ──toInput──▶ DetailedInput ──validate──▶ DetailedResolvedInput
                                                        │
                                             calculateDetailed
                                                        │
                                                  DetailedResult
                                                        │
                   buildView(result, resolvedInput)  ◀───┘      ← already receives both
                                                        │
                                                  DetailedView
                                   ┌────────────────────┴──────────────────┐
                                   │                                       │
                           DetailedResults                     reportInputs (NEW)
                           (screen + print)                            │
                                                             ReportAppendix (print-only)

businessName (report-scope state, NEVER in DetailedFormState)
      │
      ├──▶ ReportCover  (print-only)
      └──▶ useReportPrint ──▶ document.title ──▶ PDF filename
              │
              └──▶ window.print()   ← after the dialog has left the DOM (F14)
```

**The rule that governs this work:** the report is a **presentation** of `DetailedView` plus one string of report metadata. It never reaches past the view model into the engine, it never computes, and it never formats a figure itself. `core/detailed/**` is not modified by any task in this plan.

**Where the business name lives, precisely.** Report-scope React state, threaded from the dialog to the cover and the print hook. It is absent from `DetailedFormState`, `toInput.ts`, `DetailedInput`, `validateDetailedInput` and every engine type — so no calculation can read it even by accident. Whether it also persists between visits is §13 Q1.

**New and changed files**, placed per `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §8.1:

```
src/features/detailed/
  reportView.ts                  NEW   resolved input -> appendix groups (pure, no DOM)     T-07
  reportView.test.ts             NEW   coverage, totals, Turkish conformance                T-07/12
  viewModel.ts                   ±     one field on DetailedView                            T-07
  labels.ts                      ±     report, dialog and disclaimer copy (U4: one home)    T-03/05/11/14/15
  hooks/
    useReportPrint.ts            NEW   title swap, DOM-settle, window.print() (DOM ⇒ here)  T-03/14
  components/
    ReportCover.tsx              NEW   print-only cover                                      T-03/11
    ReportAppendix.tsx           NEW   print-only Ek A + Ek B                                T-08/11
    ReportActionButton.tsx       NEW   the trigger, two call sites                           T-05
    ReportNameDialog.tsx         NEW   native <dialog>, required name                        T-05
    MonthTable.tsx               ±     grid -> <table>                                       T-06
    ResultBar.tsx                ±     print colour opt-in                                   T-09
    DetailedResults.tsx          ±     always-mounted month table, print chart, sections     T-04/10/13
    SummaryPane.tsx              ±     desktop call site                                     T-05
    chartGeometry.ts             ±     print frames                                          T-10
  DetailedFeasibilityPage.tsx    ±     cover, appendix, print:hidden on <main>, dialog host  T-02/03/05/08
src/app/
  AppShell.tsx                   ±     print:hidden on masthead, slogan, colophon            T-02
  index.css                      ±     @page, @media print, dialog + ::backdrop              T-02/05/09/13
tailwind.config.ts               ±     lg screen raw definition                              T-01
```

**Why `useReportPrint.ts` sits under `hooks/`:** `tsconfig.json` compiles `features/detailed/*.ts` without the DOM lib and excludes `features/**/hooks/**`; `tsconfig.app.json` supplies the DOM. Anything referencing `window` or `document` fails typecheck outside `hooks/` — the same constraint documented in `DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` A5, and the reason `reportView.ts` stays pure and testable in the existing `node` environment with no jsdom dependency.

---

## 9. Report content structure

### 9.1 Document order

| Page | Content | Source |
| --- | --- | --- |
| 1 | **Cover** — business name, date, R1 verdict sentence, headline figure, three secondary figures, guardrails, short disclaimer, colophon | `businessName`, `view.verdict`, `view.monthlyOperatingResult`, `view.breakEvenPerDay`, `view.payback`, `view.initialInvestment`, `view.guardrails` |
| 2+ | **1 Para nereye gidiyor** — bar + reconciling table | `view.breakdown` |
| | **2 Senaryolar** | `view.scenarios` |
| | **3 Aylık işletme sonucu** — chart **+ the full month table, always** | `view.projection`, `view.monthRows` |
| | **4 Yatırım geri dönüşü** — chart | `view.paybackChart`, `view.payback` |
| | **5 Kanal ekonomisi** | `view.channels`, `view.channelTotals` |
| | **6 Başabaş** | `view.breakEvenUnitsPerDay/Month`, `view.plannedUnitsPerDay` |
| | **7 Varsayımlar** — the mandatory §16.4 block, the three annual rates even at 0%, engine version | `view.assumptions` |
| new page | **Ek A — Girdiler** (§9.2) | `view.reportInputs` |
| | **Ek B — Kapsam ve sorumluluk sınırları** (§9.3) | `labels.ts` |

Result sections keep the screen's order and headings, so an owner recognises the document and a reviewer holding both sees the same analysis in the same sequence.

### 9.2 Appendix groups

Order mirrors the locked ten-section input IA (`DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §2), so the appendix can be read beside the form that produced it.

| # | Group | Contents | Engine-sourced total |
| --- | --- | --- | --- |
| 01 | Ürünler ve satış | per product: ad, normal fiyat, online fiyat*, günlük adet, birim ürün maliyeti | — |
| 02 | Satış kanalları | salon / al götür / paket payları; ambalaj bedeli per sipariş | — |
| 03 | Ödeme yöntemleri | nakit / kart / yemek kartı payları; POS ve yemek kartı komisyonu | — |
| 04 | Paket servis** | model, platform kesintisi, kendi kuryesi maliyeti | — |
| 05 | Personel | per position: ad, kişi, işveren maliyeti, yemek, yol, prim | `monthlyPayroll` |
| 06 | İşletme sahibi | aylık tutar, Bağ-Kur | `monthlyOwnerCost` |
| 07 | Kira ve aidat | kira, girdi esası (net/brüt), aidat, stopaj oranı (sistem varsayımı) | `rentCost`, `monthlyOccupancyCost` |
| 08 | Diğer giderler | per line: ad, aylık tutar | `monthlyOpex` |
| 09 | İlk yatırım | per item: ad, tutar | `totalInitialInvestment` |
| 10 | Varsayımlar | **omitted — already rendered in full as report section 7** | — |

\* `onlinePrice` only when `channelMix.delivery > 0`. \*\* group 04 renders only when `channelMix.delivery > 0`, matching the form's progressive disclosure and §15 of the financial spec.

Values are engine-resolved and formatted **only** by the existing `lib/` utilities (L1) — `1.027.350 TL`, `%3,59`, `95,00 TL`, full form, never abbreviated (§8.2 rule 5).

**Deliberately omitted:** row ids; any derived per-row figure (per-product revenue, per-position cost, `Katkı / adet`) which §4.6 **rejects**; group totals the engine does not publish, which would be UI arithmetic on financial figures; section 10 assumptions, already mandatory in report section 7; draft/UI state; empty optional collections.

### 9.3 Disclaimer copy (draft for approval)

**Short form — cover foot** (12px, `#8A9199`):

> Bu rapor, girilen verilere ve raporda listelenen varsayımlara dayanan bir ön fizibilite değerlendirmesidir. İçerdiği projeksiyonlar tahmindir ve gerçekleşme garantisi taşımaz; muhasebe, vergi, yatırım veya hukuk danışmanlığı yerine geçmez. Kapsamın tamamı için bkz. **Ek B — Kapsam ve sorumluluk sınırları**.

**Full form — `Ek B`** (12px/1.65, `#5B6169`, six paragraphs, no box):

> 1. Bu belge bir ön fizibilite çalışmasıdır; denetlenmiş bir mali tablo, değerleme raporu veya bağımsız denetim raporu değildir.
> 2. Bütün hesaplamalar, kullanıcının girdiği veriler ile raporun "Varsayımlar" bölümünde listelenen varsayımlara dayanır. Girdiler değiştiğinde sonuçlar da değişir.
> 3. Projeksiyonlar, senaryolar ve grafikler tahmindir; gerçekleşme taahhüdü içermez.
> 4. Fiili ticari, vergisel, operasyonel ve finansal sonuçlar; talep, maliyet, mevzuat ve piyasa koşullarına bağlı olarak bu raporda gösterilenlerden farklılaşabilir.
> 5. Bu rapor muhasebe, vergi, yatırım, hukuk veya finansal danışmanlık hizmeti değildir ve bu hizmetlerin yerine geçmez. Karar öncesinde ilgili alanların uzmanlarına danışılması önerilir.
> 6. Maliyet, yalnızca bu rapora dayanılarak alınan kararların sonuçlarından sorumlu tutulamaz.

Followed by a Mono meta line: `Hesap motoru {sürüm} · Rapor tarihi {tarih} · TRY · Türkiye`.

This covers L4's six required statements in order, in a professional register. **It is a copy draft, not legal advice** — §13 Q3.

---

## 10. Print layout strategy and mechanism re-validation

| Concern | Decision | Basis |
| --- | --- | --- |
| Mechanism | Browser print → Save as PDF | Re-validated below |
| Page size | **A4 portrait**, `@page { size: A4 portrait; margin: 14mm 12mm }` | §7.2 |
| Landscape | **Rejected** for v1 — mixed orientations need named pages with uneven support; the 7-column channel table fits portrait at the §7.2 ramp | F11 |
| Effective width | ~186mm ≈ 704px, `lg` forced on via T-01 | F1, F2 |
| Typography | Re-set for paper, same faces and colours | F13, §7.2 |
| Turkish characters | Ordinary text in the page's own IBM Plex faces | F9 |
| Turkish numbers | The existing `tr-TR` formatters, reused unchanged | F9 |
| Selectable / searchable text | Native — the PDF is generated from text, not pixels | F9 |
| Charts | Vector SVG; print frame for label size | F3, T-10 |
| Backgrounds | Opt-in **only** for the reconciliation bar and legend swatches | F3, T-09 |
| Page numbers | Browser header/footer checkbox; no CSS numbering exists | F7, §13 Q2 |

### Mechanism re-validation against L1–L4

L6 asks whether the more sophisticated design changes the answer. **It does not — it strengthens it.**

| Requirement | Print CSS | jsPDF / pdf-lib | Rasterisation (html2canvas) | Backend renderer |
| --- | --- | --- | --- | --- |
| **L1** diacritics | Free — the page's loaded fonts | Built-in fonts are WinAnsi: `ğ ş İ ı` **cannot render** without embedding a ~300KB Unicode TTF | Survives as pixels only | Works |
| **L1** `tr-TR` numbers, no duplicate formatter | Free — same `DetailedView`, same `lib/` formatters | Would re-implement formatting in a second place — **forbidden by L1 and `CLAUDE.md` §3** | Inherits the DOM's | Works |
| **L1** selectable / searchable text | Native | Yes | **No** — text becomes an image | Yes |
| **L2** vector charts | Native SVG | Hand-drawn a second time | **No** — rasterised | Yes |
| **L2** no layout drift from the app | Inherits the app's own CSS | A second, hand-maintained layout that drifts on every change | Inherits | Inherits |
| **L4** copy from `labels.ts` | Same components | Duplicated strings | Same | Same |
| Constraints | No dependency, no backend | +1 dependency, +font payload (E10, §6.2) | +1–2 dependencies | **§5 [LOCKED]** — forbidden |

**No concrete requirement was found that browser print cannot satisfy.** The two things a library would buy are a controlled filename and page numbers; T-14 delivers the first, and F7 shows the second does not exist in any browser-side mechanism, library or not. **Recommendation: keep print CSS.**

---

## 11. Mobile behaviour

| Platform | Behaviour | Action |
| --- | --- | --- |
| **iOS/iPadOS Safari** | `window.print()` opens the print preview; the user saves via the share sheet → **Dosyalar'a Kaydet**. Every iOS browser is WebKit, so Chrome and Firefox on iOS behave the same | Hint line (T-15) |
| **Android Chrome** | `window.print()` opens the dialog with **PDF olarak kaydet** as a destination | Hint line (T-15) |
| **Android Firefox** | Print support historically absent or partial | Feature-detect, fallback message (T-15) |
| **In-app browsers** (Instagram, Facebook, LinkedIn webviews) | `window.print()` may be missing or silently do nothing | Feature-detect, advise opening in Safari/Chrome (T-15) |

Technical notes for the mobile path:

- **The PDF is identical on every device.** After T-01, print always uses the desktop layout regardless of viewport — a decisive advantage over per-component `print:` variants, which would need duplicating for the mobile DOM.
- The dialog is a **bottom sheet** at mobile width with 44px+ targets (§7.3); the on-screen keyboard overlays the page normally, and the sheet is not tall enough to be trapped behind it.
- `MobileSummaryBar` is `print:hidden` (T-02) so it never lands mid-page.
- `afterprint` timing is less predictable on WebKit, so T-14 restores the title in a `finally` as well.
- Nothing about the report needs a network round trip after load.

---

## 12. Test / verification plan

### Automated (extends the existing 371-test suite; no new test dependency, `node` environment)

| Test | Asserts |
| --- | --- |
| `reportView.test.ts` — coverage | Every field of `DetailedResolvedInput` is rendered in a group or named in an explicit omission list |
| `reportView.test.ts` — totals | Each group total equals the engine field it cites; none is summed in the builder |
| `reportView.test.ts` — conditionals | Delivery group absent when `channelMix.delivery === 0`; empty collections drop their group |
| `reportView.test.ts` — **Turkish numbers** | `1.000`, `10.000`, `1.000.000`, `1.500.000,50 TL`, `%3,59` — via the existing formatters (L1) |
| `reportView.test.ts` — **Turkish characters** | A fixture with `ğ Ğ ş Ş ı İ ç Ç ö Ö ü Ü` survives the appendix, the cover line and the filename builder |
| Guard test | No `Intl.NumberFormat`, `toFixed` or `toLocaleString` in report modules (L1: no second formatting system) |
| Guard test | Report modules import no calculation function from `core/detailed` (no financial recomputation) |
| Guard test | No `max-lg:` utility anywhere (T-01's constraint, §14 R1) |
| Filename test | Sanitisation keeps Turkish characters and strips `/ \ : * ? " < > |`; length cap holds |
| Existing suites | `viewModel.test.ts` and the **financial golden vector** unchanged — **no task touches `core/detailed/**`** |
| Commands | `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build` all clean |

### Manual matrix

Three fixtures — **minimal** (1 product, no delivery, 12 months), **typical** (4 products, delivery on, 24 months), **stress** (40 products, 8 positions, 36 months, diacritics in every name).

| Check | Chrome desktop | Safari desktop | Firefox desktop | iOS Safari | Android Chrome |
| --- | --- | --- | --- | --- | --- |
| A4 PDF saved end to end | ✓ | ✓ | ✓ | ✓ | ✓ |
| Turkish characters correct everywhere | ✓ | ✓ | ✓ | ✓ | ✓ |
| Turkish number formatting (`1.000` … `1.500.000,50 TL`, `%3,59`) | ✓ | ✓ | ✓ | ✓ | ✓ |
| PDF text selectable and searchable | ✓ | ✓ | ✓ | — | — |
| Business-name modal: opens, focus lands in the field, `Esc` and backdrop close | ✓ | ✓ | ✓ | ✓ | ✓ |
| Button disabled on empty **and** whitespace-only; enabled on a valid name | ✓ | ✓ | ✓ | ✓ | ✓ |
| The dialog does **not** appear in the PDF | ✓ | ✓ | ✓ | ✓ | ✓ |
| PDF filename carries the business name and the date | ✓ | ✓ | — | ✓ | ✓ |
| Charts present, vector, unclipped, labels ≥ 7pt, not split across pages | ✓ | ✓ | ✓ | — | — |
| Reconciliation bar visible with readable in-bar labels | ✓ | ✓ | ✓ | ✓ | ✓ |
| 36-month table complete, header repeated on every page, no split row | ✓ | ✓ | ✓ | — | — |
| Page breaks: no orphan heading, no blank page, sections whole | ✓ | ✓ | ✓ | — | — |
| Appendix complete (`Ek A`), starts a new page | ✓ | ✓ | ✓ | — | — |
| Disclaimer present in both forms (`Ek B`) | ✓ | ✓ | ✓ | ✓ | ✓ |
| No masthead, mode switch, form, summary pane, mobile bar or colophon | ✓ | ✓ | ✓ | ✓ | ✓ |
| Save to Files / PDF olarak kaydet completes | — | — | — | ✓ | ✓ |
| Fallback message where `window.print` is unavailable | — | — | — | in-app webview | Firefox |
| Screen unchanged: 390px and 1280px screenshots before/after T-04, T-06 | ✓ | — | — | ✓ | — |

---

## 13. Open questions

Three remain. **None blocks starting work**, and none is decided silently here.

| # | Question | Recommendation |
| --- | --- | --- |
| **Q1** | **Should the business name persist locally, or exist only for the current report interaction?** A real tradeoff, so it is yours to settle. **Persisting** (an optional field beside `form` in the existing `maliyet.detailed.draft.v1` payload, prefilled into the dialog): someone preparing a KOSGEB application regenerates the report repeatedly over days and retypes the name every time otherwise; the draft already stores everything else on that device; the field stays optional in storage, so old drafts still decode with no version bump. Cost: `storage.ts`, `draftStorage.ts` and two existing tests change together, `DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` A3/A10 must be updated in the same change (§14 C2), and a name typed on a shared browser lingers. **Session-only** (report state, gone on reload): zero storage changes, zero doc changes, nothing lingers — but the name is retyped on every visit. | **Persist, prefilled, still required.** The re-generation loop is the real usage pattern, the storage cost is one optional string, and the dialog still refuses an empty name so L3 is unaffected. If you prefer session-only, T-05 gets *smaller* — no codec, test or documentation changes at all |
| **Q2** | Page numbers and a running document header | **Accept the browser's own header/footer.** CSS page numbering does not exist in Chromium or WebKit (F7); the only alternative is a PDF library, rejected in §10. The design already carries a running head of its own on every interior page |
| **Q3** | Final disclaimer wording (§9.3) | Written to L4's six points in a professional register, **but it is copy, not legal advice.** Have a human — ideally someone who has read a Turkish feasibility report — approve the final text before release |

---

## 14. Risks and contradictions

### Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | T-01's `raw` screen means no `max-lg:` variant, constraining future CSS | Nothing uses it today (F2); §12 guard test; documented fallback is per-component `print:` variants |
| R2 | The report drifts from the screen as components change | The report **reuses** the result components; only cover, appendix and disclaimer are report-only |
| R3 | `break-inside: avoid` is honoured inconsistently on grid children | Long collections are real tables (T-06, T-08); short sections are page-sized; verified in the §12 matrix |
| R4 | **The dialog prints inside the PDF** (F14) | The print call happens after the DOM update, owned by `useReportPrint`; `print:hidden` on the dialog as a second guard; explicit row in the §12 matrix |
| R5 | T-06 introduces pixel drift on screen | Acceptance is visual equality at both breakpoints, not "close" |
| R6 | A viewer disables background graphics and loses the bar | Every figure in the bar is also in the reconciling table beneath it |
| R7 | A future contributor formats a figure inside a report component, breaking L1 | T-12's guard tests fail the build |
| R8 | If Q1 chooses persistence, a codec change lands without its consumers | All five files and both draft tests change in one commit — the exact failure that broke the tree in an earlier session |
| R9 | A very long appendix produces a long document | Accepted: auditability is the point; truncation would be worse |
| R10 | Print triggered mid-animation prints a faded page | `qc-enter` / `qc-live` disabled in the print block (T-02) |
| R11 | iOS `showModal()` + text input focus quirks | Explicit row in the §12 matrix; the bottom-sheet layout keeps the field clear of the keyboard |

### Contradictions with locked documents

The earlier revision listed three. **C1 (a new form input vs. §8.2 rule 3) is dissolved by L3** — the name is never a form field (§3.3). Two remain, both recorded rather than resolved silently:

| # | Contradiction | Resolution proposed |
| --- | --- | --- |
| **C1** | `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §4.6 specifies the month table as *"collapsed by default"*; the report always includes it (T-04, L2) | Not a true contradiction — §4.6 governs the **screen**, and screen behaviour is unchanged. Record the report-only exception in §4.6 when this plan is approved |
| **C2** | `DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` A3 states *"Stored: the form only"* — **applies only if Q1 chooses persistence** | Then update A3 and A10 **in the same change**, never after. (A10's file table is already stale — it omits `hooks/draftAutosave.ts` and `hooks/draftRestore.ts`; worth fixing in that pass) |

---

## 15. Implementation order

Ordered so no task rebuilds another's output. Each step ends green (`typecheck`, `lint`, `test:run`, `build`).

| Step | Task | Why here |
| --- | --- | --- |
| 0 | Point `DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` B4 at this plan | One line; keeps the parent document from going stale the moment work starts |
| 1 | **T-01** breakpoints | Everything downstream renders through the layout this fixes. First, always |
| 2 | **T-02** print reset | Makes print preview legible enough to evaluate everything after it |
| 3 | **T-04** month table always present | Trivial, and the report is content-incomplete without it |
| 4 | **T-09** bar fidelity | Small and isolated; with T-10 it completes "the existing content prints correctly" |
| 5 | **T-10** print chart frame | Same phase, same file cluster |
| 6 | **T-03** report shell + cover | The cover needs a name, so it is built once, immediately before the dialog that supplies it |
| 7 | **T-05** action + name dialog | First point at which the feature is usable end to end. Settle Q1 before this step — it changes T-05's size, not its shape |
| 8 | **T-11** disclaimer | Cover and appendix scaffolding now exist; copy lands in both at once |
| 9 | **T-06** `MonthTable` → `<table>` | Before break tuning: table layout changes where breaks fall |
| 10 | **T-07** report view model | Pure, test-first, no UI dependency |
| 11 | **T-08** appendix rendering | Consumes T-07, reuses T-06's table idiom |
| 12 | **T-12** Turkish conformance guards | After the report modules exist, so the guards have something to guard |
| 13 | **T-13** page-break tuning | **After all content exists.** Tuning breaks against changing content is guaranteed rework |
| 14 | **T-14** filename | Small; depends on the dialog's name |
| 15 | **T-15** mobile copy + fallback | Last: the wording depends on the finished flow |
| — | **T-16** other tables | Optional, any time after step 9, or never for v1 |

**The four sequencing traps, stated explicitly:**

1. Tuning page breaks before the appendix and the real month table exist (step 13 vs. 9–11).
2. Building the cover before the name exists, then rebuilding it (why step 6 sits immediately before step 7).
3. Deciding Q1 after T-05 is written — persistence touches the codec, its consumers and two tests, and retrofitting it means re-opening the same five files.
4. Changing the draft codec before its consumers, if Q1 chooses persistence (R8).

---

## 16. Definition of Done

1. From a valid Detailed Feasibility result, a user on Chrome, Safari or Firefox (desktop) and on iOS Safari or Android Chrome can produce an A4 PDF — with **no backend, no new Cloudflare product and no new dependency**.
2. The flow is exactly L3: action → modal → required `İşletme adı` → enabled download; the name reaches the cover and the filename and **no engine input**.
3. The PDF contains, in order: cover, the seven result sections, `Ek A — Girdiler`, `Ek B — Kapsam ve sorumluluk sınırları` — with the month-by-month projection always present regardless of the screen toggle.
4. **L1 holds:** every Turkish character renders, every figure is `tr-TR`-formatted by the existing `lib/` utilities, no second formatting system exists (guard tests green), and the PDF text is selectable and searchable.
5. **L2 holds:** no clipped chart, no missing column, no mobile fallback layout, no split chart, no avoidable split row, repeated headers on the month table and the appendix tables, chart labels ≥ 7pt, vector SVG, a visible reconciliation bar, and a 36-month projection that reads correctly across pages.
6. **L4 holds:** the disclaimer is present in both registers, covers all six required statements, is professionally worded and does not dominate the page.
7. Every figure is traceable to `DetailedView`; `core/detailed/**` is unmodified and the golden vector is untouched.
8. The design matches the §7 pass: typography, spacing, table treatment, cover anatomy, dialog anatomy and action placement — no card, no colour, no KPI tile, no icon introduced.
9. Screen behaviour is unchanged except the two intended additions: the report action (+ its mobile hint) and the dialog.
10. `npm run typecheck`, `npm run lint`, `npm run test:run` and `npm run build` are clean, and the §12 manual matrix has been walked.
11. `DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` B4 points here; §14 C1 (and C2 if Q1 chooses persistence) have been recorded in the documents that own them.

---

## 17. Explicitly deferred

Out of scope for v1, with the reason. Deferring is a decision, not an oversight.

| Item | Why deferred |
| --- | --- |
| **JSON export / import** | Approved by §4.2 but not built. A `.json` file is a save-file, not a document — useful only alongside a scenario manager, and only to someone who already has this app (`DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md` A9) |
| **Named multi-scenario storage** | §4.2 approves it; the reader who needs it (an advisor juggling several businesses) is not confirmed |
| **A PDF library or headless renderer** | Rejected on merit in §10, and more decisively under L1 than before. Revisit only against a concrete requirement print CSS cannot meet |
| **CSS page numbers / running page footer** | No browser support (F7); would require the rejected library route |
| **A4 landscape or mixed orientation** | F11; portrait fits the content |
| **Per-product P&L, per-position cost table, channel × month cross tables** | Rejected by `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` §4.6 for the screen; a report is not a way around that decision |
| **Cover branding — logo upload, custom colours, letterhead** | A new input class, a new storage concern, and a direct collision with V1. Not asked for |
| **Additional report metadata** (prepared-for, address, contact, project code) | L3 locks exactly one metadata field. More is a product decision, not a formatting one |
| **Emailing or sharing the report from the app** | Requires a backend (§5 **[LOCKED]**) |
| **A report for Quick Calculation** | Out of scope; `Özeti kopyala` is its answer today |
| **English or bilingual output** | V11 **[LOCKED]** |
| **Editable report sections, custom notes, an executive-summary box** | New inputs with no confirmed reader |
| **`ScenarioTable` / `ChannelTable` conversion (T-16)** | Semantic benefit only; no page-break need |
