# Draft Persistence & Report Output

**Status:** Part A (draft persistence) is **implemented and verified**. Part B (downloadable report) is a **recorded goal only — not yet specified**.
**Owns:** how a Detailed Feasibility session survives leaving the page, and where the owner's takeaway artefact is headed.
**Does not own:** the persistence *rules* themselves — `TECH_STACK_AND_CONSTRAINTS.md` §4 stays the authority. This document records what was built against them and why.

**Companion documents:**

| Document | Owns |
| --- | --- |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` | Persistence rules, stack, runtime, technical exclusions |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` | Folder structure, layer boundaries, dependency direction |
| `docs/DESIGN_DIRECTION.md` | Locked visual & UX direction (V6 recompute gate, R6 quiet-control precedent) |
| `docs/DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` | Detailed Feasibility UI |

---

## Why this exists

Detailed Feasibility is a ~40-field form. Until now nothing was kept: closing the tab, reloading, or the phone reclaiming the page destroyed the entire session. `src/app/App.tsx` even documented it — *"Nothing is persisted: a reload starts over, as it always has."*

This was never a product decision. `TECH_STACK_AND_CONSTRAINTS.md` §4.2 **[LOCKED]** had required `localStorage` for Detailed Feasibility from the start; `git log -S localStorage` shows it was simply never written.

---

# Part A — Draft persistence **[IMPLEMENTED]**

## A1. What it does

The Detailed form is written to `localStorage` as the owner types (debounced, 500 ms) and restored on the next visit to the same browser. There is no button to press and nothing to name: it is one always-current draft.

## A2. Scope

| | |
| --- | --- |
| Detailed Feasibility | **Persisted** — per §4.2 |
| Quick Calculation | **Not persisted** — §4.1 **[LOCKED]** says *Mandatory persistence: No*; Quick stays "compute, read, leave" |
| Which mode is showing | **Not persisted** — session-only, as before |

Quick was deliberately left alone. Adding a draft there would break a locked decision, and Quick's eight fields do not represent lost work in the way Detailed's forty do.

## A3. What is stored, and what is deliberately not

**Stored:** the form — the raw strings exactly as typed, plus the enum choices (delivery mode, rent basis, ramp-up preset, projection horizon) — and, since the report was built, the **business name** the report is titled with.

`businessName` sits **beside** `form` in the payload, never inside it: `DetailedFormState` is what `toInput.ts` hands the engine, and the name changes no figure, so letting it into that shape would put document metadata on the calculation path. It is optional in the stored payload, so a draft written before the report existed still decodes — with an empty name, no version bump and no draft loss. A corrupt name degrades to an empty one rather than discarding the financial inputs, which the whole-payload validation in A10 would otherwise do.

**Not stored:** the calculated result, and whether the owner has calculated at all.

That second exclusion is required, not incidental. `DESIGN_DIRECTION.md` **V6 [LOCKED]** states that *before the first calculation no result appears automatically, in any form*. A returning visitor has not pressed `Hesapla` in this session, so they get their inputs back and an empty result column, exactly as V6 describes. Restoring the result too would have been the easy thing and would have broken the rule.

Results are cheap to recompute and have exactly one source of truth in `core/detailed`. Storing them would have created a second, unverifiable copy.

## A4. Why `localStorage` and not something else

| Option | Verdict |
| --- | --- |
| **`localStorage`** | **Chosen.** Synchronous, ~5 KB payload against a ~5 MB budget, zero dependencies, zero infrastructure |
| `IndexedDB` | Rejected — asynchronous complexity for no gain at this size, and subject to the *same* WebKit eviction (A7) |
| Cloudflare KV / D1 / R2 | Rejected — on the §5 **[LOCKED]** exclusion list, and would introduce accounts, a backend and a bill |

**Nothing was needed from Cloudflare.** `localStorage` is entirely client-side; `wrangler.jsonc` is untouched, no Worker was introduced, and the deployment remains static assets. This kept the feature inside the existing architecture instead of reopening §2.2.

## A5. Architecture — the two-file split, and why it is not optional

```
src/features/detailed/storage.ts            pure codec — no browser API
src/features/detailed/hooks/draftStorage.ts every localStorage call
```

The split is forced by the build, not by taste:

- `tsconfig.json` compiles `features/detailed/*.ts` with `lib: ["ES2022"]` — **no DOM** — and excludes `features/**/hooks/**`.
- `tsconfig.app.json` supplies the DOM lib and includes `*.tsx` plus `features/**/hooks/**/*.ts`.

So a `localStorage` reference anywhere in the feature *except* under `hooks/` fails `npm run typecheck`. `hooks/draftStorage.ts` is therefore not a React hook; it lives there because that is the only place in the feature where `window` type-checks, and it says so in its own header.

The split pays for itself twice: it also keeps the codec testable. Vitest runs with the default `node` environment and no jsdom, so a DOM-touching module could not be tested without adding a dependency. The pure codec is tested directly; **no new dependency was added**.

## A6. The id-counter hazard (a real bug this feature would otherwise have introduced)

`formState.ts` mints row ids from a module-level counter:

```ts
let nextId = 0
function makeId(prefix: string) { nextId += 1; return `${prefix}-${nextId}` }
```

The counter restarts at 0 on every page load. Restoring a draft holding `product-1, product-2` and then adding a row would have minted a **second** `product-2`. These ids are React keys and the map key in `hooks/useNewestRowOpen.ts`, so the failure would not have been a crash — rows would quietly trade places.

**Fix:** `syncIdCounter(form)`, exported from `formState.ts` and called once by the draft loader before the restored form is used. It advances the counter past the highest id in the draft. The counter itself stays private to the module. Covered by `formState.test.ts`, and confirmed in the running app: after restoring `product-109, product-116`, the next row was issued `product-130`.

## A7. Durability limits — desktop and mobile differ, materially

| Environment | Behaviour |
| --- | --- |
| Desktop Chrome / Firefox / Edge / macOS Safari | Kept until the user clears site data |
| **iOS & iPadOS — every browser (all WebKit)** | **Cleared after 7 days without a visit to the site** (Intelligent Tracking Prevention; still in force in 2026) |
| iOS, site added to the Home Screen | Exempt from the 7-day rule — its own usage counter applies |
| Private browsing / blocked storage | `localStorage` may throw outright |

Consequences accepted:

- A draft is **per browser and per device**. It does not follow the owner to their phone, and it is not a backup.
- On iOS it is a **convenience, not an archive**. Someone preparing a KOSGEB application over three weeks can lose it.
- This is stated plainly in the UI (A8) rather than hidden, and it is the strongest argument for Part B: the durable artefact has to be a file the owner holds, not browser state.

Every storage call is wrapped in `try/catch`. When storage is unavailable the calculator works normally with no persistence at all — **losing a draft is a disappointment; a blank screen is a bug.**

## A8. UI surface

At the foot of the input column, after the last section:

```
Taslak bu cihaza kaydedildi · Baştan başla
Yalnızca bu tarayıcıda saklanır; iPhone'da uzun süre girilmezse silinebilir.
```

- Nothing renders until a draft has actually been written, so a first-time visitor is never told about storage they do not have.
- Styling follows the locked direction: hairline rule, no card (V9), no colour (V1/V3), no icon, no toast. It echoes the `Kopyalandı` affordance in `SummaryPane` (R6).
- **`Baştan başla` is required, not decorative.** Autosave removes the reload-to-clear escape hatch, so without it an owner could never get a blank form back to model a second business. Confirmation is a two-step inline exchange (`Girdiklerinizin tamamı silinecek. Evet, sil · Vazgeç`) — a browser `confirm()` dialog is not in this product's vocabulary.
- Reset clears the stored draft **and** the result state. Leaving a calculated result beside an emptied form would break V6.
- All copy lives in `labels.ts`; none is written inline in JSX.

## A9. Deferred from §4.2, with reasons

§4.2 also approves **JSON export/import** and **named multi-scenario storage**. Neither was built.

- **JSON export/import** — a `.json` file is meaningless to a cafe owner: opened outside this app it is a wall of text that cannot be read, printed, or sent to a bank or to KOSGEB. It is a save-file, not a document, and it is only useful to someone who already has this app. The artefact owners actually want is a readable report (Part B).
- **Named scenarios** — real value only appears for someone juggling several businesses at once (an advisor). Until that user is confirmed, it is a UI surface without a proven reader.

Both remain approved by §4.2 and can be built later. JSON export becomes genuinely useful *alongside* a scenario manager, framed as "backup", not as an export format anyone reads.

## A10. Files

| File | Role |
| --- | --- |
| `src/features/detailed/storage.ts` | **new** — codec, storage key, strict whole-payload validation; carries the report's business name beside the form |
| `src/features/detailed/storage.test.ts` | **new** — round-trip and rejection cases |
| `src/features/detailed/hooks/draftStorage.ts` | **new** — the only `localStorage` calls |
| `src/features/detailed/hooks/draftAutosave.ts` | **new** — the debounce queue and the lifecycle flushes |
| `src/features/detailed/hooks/draftAutosave.test.ts` | **new** — flush on hide, and no double write |
| `src/features/detailed/hooks/draftRestore.test.ts` | **new** — restored state renders the notice |
| `src/features/detailed/components/DraftNotice.tsx` | **new** — saved notice and reset control |
| `src/features/detailed/formState.test.ts` | **new** — `syncIdCounter` |
| `src/features/detailed/formState.ts` | `syncIdCounter` added |
| `src/features/detailed/hooks/useDetailedCalc.ts` | restore on mount, debounced save, `resetForm` |
| `src/features/detailed/labels.ts` | draft copy |
| `src/features/detailed/components/DetailedForm.tsx` | renders `DraftNotice` |

**Validation is deliberately all-or-nothing.** A draft that fails any shape check — wrong version, corrupt JSON, a number where a string belongs, an unknown enum — is discarded whole and the owner gets a clean form. A half-recovered form of someone's own financial inputs is harder to trust than an empty one.

## A11. Contradiction resolved while doing this

`DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` asserted *"a reload does not (there is no persistence in this product)"*, contradicting §4.2 **[LOCKED]**. Under the authority order in `CLAUDE.md`, persistence belongs to the tech-stack document, so its rule stood and the frontend spec's line was stale rather than a competing decision. That line has been corrected in place, with a note recording why.

## A12. Verification performed

`npm run typecheck`, `npm run test:run` (367 passing, up from 347), `npm run lint` — all clean.

Confirmed in a real browser against the dev server: fill → reload → **inputs restored, result column empty**; add a row after restoring → **no duplicate ids**; `Baştan başla` → form blank, key removed from storage and *staying* removed; Quick mode → writes nothing.

---

# Part B — Downloadable report **[GOAL — NOT YET SPECIFIED]**

> **This section is not a specification.** It records the objective and the reasoning behind it so the intent is not lost.
>
> **The specification now exists: `docs/archive/DETAILED_REPORT_IMPLEMENTATION_PLAN.md`.** It owns the mechanism, the report content, the print layout, the download flow and the task order, and it answers B4's "not decided" list. Read it rather than this section for anything the report actually does; what follows is the original objective, kept for the reasoning.

## B1. The goal

Make the Detailed Feasibility result **downloadable as a report the owner can keep, print, and hand to someone else. Free — no payment, no account, no gate.**

## B2. Why

- **The document is the product, not the calculator.** Free calculators are commodities in this market. What is scarce is a Turkey-specific, tax-aware result — withholding on rent, meal-card commission, Bağ-Kur, channel-level costs — presented as something an owner can put in front of a bank, a partner, a landlord, or a grant application. None of that survives in a browser tab.
- **It closes the durability gap in Part A.** A7 is honest that a draft can disappear, especially on iOS. A file the owner holds is the answer to that, and the UI already tells them so.
- **The content already exists.** `DetailedResults` renders money flow, scenarios, projection, payback, channel economics, break-even and assumptions. That is already a feasibility report's table of contents. The missing piece is the artefact, not the analysis.

## B3. Decided

Only this: **it is free, and it covers Detailed Feasibility.** Quick Calculation already has `Özeti kopyala` and is not in scope.

## B4. Explicitly not decided

- Output mechanism. A print stylesheet driving the browser's own "Save as PDF" is the leading candidate — zero dependencies, real selectable text, correct Turkish diacritics, charts stay vector, and the report inherits the app's own CSS instead of a second layout that would drift. **This is a proposal, not a decision.** A PDF library remains on the table and must be argued on merit.
- Whether the report needs inputs restated as a table. Strongly suspected yes — a feasibility document that shows conclusions without stating what was assumed is not auditable — but the scope of that work is not yet sized.
- Cover page contents: business name, date, engine version. A business-name field does not exist in the form today; adding one is a product decision, not a formatting one.
- Page structure, breaks, and what is omitted from print.
- Filename and whether the browser print dialog is an acceptable interaction on mobile.

## B5. Constraints any specification must respect

- No backend and no new Cloudflare product (§2.2, §5 **[LOCKED]**) unless separately approved.
- Figures in the report come from the engine or the view model — never recomputed for print (`CLAUDE.md` §3).
- The locked visual direction applies to print as it does to screen.
- Turkish-only (V11).
