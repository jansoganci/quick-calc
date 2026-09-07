# Product-Level Breakdown & Onboarding Help — Plan

**Status:** Proposal. Records decisions already made in conversation and lays out the
implementation plan. **Does not itself authorise implementation** — same convention as
every other document in `docs/`. Implementation starts when explicitly requested, feature
by feature (§6).
**Scope:** Detailed Feasibility only, except where §4 notes a Quick / Lite touchpoint.
**Companion documents:** `DETAILED_FEASIBILITY_DECISIONS.md` (decision log this plan adds
one entry to), `APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` (layer boundaries this plan
follows), `TECH_STACK_AND_CONSTRAINTS.md` (confirms: no backend, see §0).

---

## 0. Where does this live — backend or UI?

There is no backend. Per `TECH_STACK_AND_CONSTRAINTS.md`: no server process, no database,
no API. Everything below is one of two things in the existing client-side TypeScript app:

- **engine** (`src/core/detailed/`) — pure calculation logic, no React, no UI;
- **UI** (`src/features/detailed/`, `src/components/`) — React components and view models
  that read engine output and render it.

Both initiatives in this document touch **both** layers, in different ways. §3 and §4 say
exactly which files, per initiative.

---

## 1. Decisions made in conversation (context, not new here)

| # | Decision | Resolution |
| --- | --- | --- |
| B1 | Platform vs. own-courier delivery **volume** split (DF-77) | **Rejected, stays out.** If the merchant uses its own courier, the platform-courier option is already disabled (DF-81) — a second split would model something that cannot happen. Not revisited. |
| B2 | Product-level revenue/cost breakdown | **Approved**, in both the report and the on-screen UI (§3). Not approved as a per-product **channel mix** input — that stays out per DF-04a / DF-72 / X23. This is a new *output*, not a new input. |
| B3 | Onboarding for first-time users | **Approved**, as two additive pieces, not a separate "how to use" page: an ⓘ affordance per field (§4.1) and a one-click realistic sample fill (§4.2). |
| B4 | City / location benchmark comparison | **Explicitly shelved by the product owner** — acknowledged as valuable but too complex to take on now. Not part of this plan. Do not fold it into either initiative below. |

---

## 2. Why this doesn't reopen locked decisions

- **B1** changes nothing. It is a confirmation that the existing Mode 1 / Mode 2 model
  (DF-10, DF-81) already covers the real-world case, so DF-77 stays LATER/rejected exactly
  as `DETAILED_FEASIBILITY_DECISIONS.md` already records it.
- **B2** does not reopen DF-04a / DF-72 / X23. Those lock the **input**: one business-level
  channel mix, applied identically to every product, no per-product mix control, no
  category grouping. This plan adds a **read-only, engine-derived report/UI view** of
  numbers the engine already computes per product internally
  (`unitEconomics.ts` → `ProductUnitEconomics.byChannel`) but currently discards after
  folding them into channel totals (`calculate.ts`, `calculateMonth`). No new formula, no
  new user input. It is the same kind of addition as `ChannelTable` — a different slice of
  numbers that already exist.
- **B2 does add one new locked decision** to `DETAILED_FEASIBILITY_DECISIONS.md`, because
  DF-61's "engine-derived outputs" list does not currently mention a product-level table.
  See §3.1.
- **B3** touches no financial logic at all. It is presentation and copy.

---

## 3. Initiative A — Product-Level Contribution Breakdown

### 3.1 Decision-log addition (write first)

Add to `DETAILED_FEASIBILITY_DECISIONS.md`, in §5.2 near DF-50/DF-52, a new entry:

> **DF-8x — Product-level contribution is a derived report/UI output [LOCKED]**
> The engine-derived analysis (DF-61) includes a per-product breakdown — units, gross,
> net revenue, Product COGS, Channel Variable Cost, Payment/Platform Fee, contribution —
> aggregated across all three channels using the already-locked per-product, per-channel
> unit economics (spec §9). This is a report/UI view, not a new input: it does not add a
> per-product channel mix (DF-04a stays as-is) and does not add category grouping
> (DF-72 stays as-is).

This keeps the decision log authoritative and prevents a future pass from treating the new
table as an unreviewed surprise.

### 3.2 Engine change — `src/core/detailed/`

**Finding:** `unitEconomics.ts` already computes everything needed, per product, per
channel (`grossPerUnit`, `netPerUnit`, `unitProductCost`, `unitChannelVariableCost`,
`unitPaymentPlatformFee`, `unitContribution` — see `ProductUnitEconomics.byChannel`).
`calculate.ts`'s `calculateMonth` loops over exactly this data today (lines ~58–80) but only
accumulates it into `byChannel` totals; the per-product figures are computed and then
thrown away. **No new formula is needed — only a second accumulator next to the existing
one.**

Changes:

- `types.ts`: add
  ```ts
  export interface ProductLine {
    productId: string;
    name: string;
    units: number;
    grossCustomerSales: number;
    netRevenue: number;
    productCogs: number;
    channelVariableCost: number;
    paymentPlatformFee: number;
    contribution: number;
  }
  ```
  and add `byProduct: ProductLine[]` to `MonthResult` (ordered the same as `input.products`).
- `calculate.ts`: inside the existing per-product, per-channel loop, accumulate a second
  `Record<productId, ProductLine>` the same way `byChannel` is accumulated, using the same
  `channelQuantity` and `unit` values already in scope. Build the ordered array once, after
  the loop, from `unitEconomics.products` (for order and name) plus the accumulator (for
  totals).
- **Structural invariant to test:** `sum(byProduct[].contribution) === sum(byChannel[].contribution) === totalContribution`, and likewise for each of the other five figures. This is the same reconciliation property `ChannelLine`/`MonthResult` already guarantee for channels — it must hold for products too, or the two tables would visibly disagree on screen.
- No change to `unitEconomics.ts`, `monthlyCosts.ts`, `breakEven.ts`, `projection.ts`,
  `defaults.ts`, or `validate.ts`. No new user input, no new default.

### 3.3 UI + report — `src/features/detailed/`

**Finding:** `DetailedResults.tsx` is not a screen-only component — it is the shared result
tree rendered both on screen and inside the printed report (each `ResultSection` is
`qc-report-section`, and print-only/screen-only variants exist only for charts, not for
tables like `ChannelTable`). **This means one new component placed in `DetailedResults.tsx`
appears in both the UI and the downloadable report — there is no separate "add it to the
report" step.**

Changes:

- `resultView.ts`: add
  ```ts
  export type ProductRow = { productId: string; name: string; units: string; gross: string; net: string; cogs: string; variable: string; fee: string; contribution: string }
  ```
  plus `buildProductRows(month: MonthResult): ProductRow[]` and
  `buildProductTotals(month: MonthResult): Omit<ProductRow, 'productId' | 'name'>` — mirrors
  `buildChannelRows` / `buildChannelTotals` exactly, formatting through the same `formatTry`
  / `formatCount` helpers (never re-implement formatting locally — `reportGuards.test.ts`
  already forbids ad hoc `Intl.NumberFormat`/`toFixed` in this feature).
- `viewModel.ts`: add `products: ProductRow[]` and `productTotals` to `DetailedView`,
  built the same way `channels`/`channelTotals` are.
- New component `src/features/detailed/components/ProductContributionTable.tsx` — a direct
  structural copy of `ChannelTable.tsx` (same seven-column layout, same mobile transpose
  behaviour below `lg`, same hairline/typography rules), with rows = products instead of
  channels. No new visual language, no new CSS.
- `DetailedResults.tsx`: add one `ResultSection` (title e.g. "Ürün Bazlı Katkı") immediately
  after the existing `COPY.channelTitle` section, rendering `ProductContributionTable`.
  Because it sits in the shared tree, it is automatically part of the print layout — verify
  only that a long product list paginates correctly (`ReportAppendix.tsx`'s doc comment
  notes repeating-row tables already handle header repetition across pages; confirm the
  same holds here, or give the new table `className="qc-report-table"` like the appendix
  tables do).
- `labels.ts`: add the new column/section copy (`productBreakdownTitle`, `productBreakdownNote`, column headers — reuse `COPY.channelUnits`/`channelGross`/etc. where the header text is identical, add new ones only where it differs, e.g. "Ürün" instead of "Kanal").

### 3.4 Tests

- `calculate.test.ts` / `contract.test.ts`: assert the `byProduct` reconciliation invariant
  from §3.2.
- A new `resultView.test.ts` (or extend the existing one) for `buildProductRows` /
  `buildProductTotals`, mirroring the existing channel-row tests.
- `reportGuards.test.ts` already scans this feature for ad hoc formatting — no new guard
  needed, just don't violate the existing one.

---

## 4. Initiative B — Onboarding for first-time users

Two independent, additive pieces. Neither touches `core/`.

### 4.1 ⓘ info affordance per field

**Design constraint (already locked, `DESIGN_DIRECTION.md` §1/§2):** icons only where a
control genuinely needs one; no unnecessary interaction; mobile is first-class, so a
**hover-only** tooltip is not acceptable on its own — touch has no hover. The affordance
must be tap-to-reveal, not hover-only, and must not add a mode or a page.

**Finding:** `NumberField.tsx` / `TextField.tsx` already have a `hint` slot (a short line
of always-visible text below the field) and an `aria-describedby` wiring pattern. The ⓘ is
a **different, additive** slot — revealed on demand, not always visible — because putting
permanent explanatory text under every field of a 12-section form would work against the
"quiet instrument, readable in a few seconds" rule this app is built on.

Changes:

- New component `src/components/InfoTooltip.tsx` (domain-neutral — belongs in
  `components/`, not `features/detailed/`, because Quick could reuse it later per
  `APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` reuse rules): a small ⓘ button,
  `aria-expanded`, toggles a short text popover on click/tap (and dismiss on outside
  click/Escape); 44px touch target per the locked mobile rule.
- `NumberField.tsx` / `TextField.tsx`: add an optional `info?: string` prop that renders an
  `InfoTooltip` next to the label when present. Fields without it render exactly as today —
  this is opt-in per field, not a blanket change.
- **Content task, separate from the component:** one short Turkish sentence per field that
  needs it — what it means, and what it changes in the result. This is copywriting, not
  engineering, and should be reviewed as copy (like the rest of `docs/FRONTEND_IMPLEMENTATION_SPEC.md §5`'s "copy still to be written" list) rather than authored ad hoc inside a component. Candidates that most need it: platform fee rate (Mode 1 vs 2), rent net/gross basis, POS/meal-card commission, ramp-up preset, scenario deltas, aidat vs. OPEX (DF-80's existing guardrail could move here instead of/alongside its current copy).
- Does **not** touch Quick / Lite in this pass — Detailed's form is longer and more
  intimidating; Quick's 8-field form is a smaller ask. Reusing `InfoTooltip` in Quick later
  is possible without any rework, since the component is domain-neutral.

### 4.2 "Örnekle Dene" — realistic sample fill

**Finding:** `formState.ts` already has `initialForm()` (the blank/zeroed starting state)
and per-row constructors (`emptyProduct`, `emptyPosition`, `emptyLine`). A sample fill is a
**sibling** of `initialForm()`, not a change to it — `DETAILED_DEFAULTS` (the engine's
neutral defaults, e.g. `channelMix`, `paymentMix`) must stay neutral and untouched; a
realistic example is a separate, explicit concept.

Changes:

- New function in `formState.ts` (or a new `sampleForm.ts` alongside it), e.g.
  `sampleCafeForm(): DetailedFormState` — a fully filled-in, plausible small-cafe example
  (a few named products with realistic prices/quantities/costs, a couple of positions, the
  standard OPEX lines with plausible amounts, occupancy, CAPEX). Illustrative numbers only,
  clearly not a locked "reference example" like the Quick spec's §19 golden vector — this
  is onboarding content, not a test fixture, and should not be asserted against in tests the
  way the golden vector is.
- One button in `DetailedForm.tsx` (e.g. "Örnekle Dene"), that calls the existing
  form-replace path with `sampleCafeForm()`. **Guard against destroying in-progress work:**
  `draftAutosave.ts` already persists the form — if any field is non-empty, confirm before
  overwriting (same pattern a "clear form" action would need; check whether one already
  exists to reuse its confirmation UI).
- The button clears/resets `nextId` bookkeeping the same way `syncIdCounter` does for a
  restored draft, so ids stay consistent.

### 4.3 Tests

- A small test that `sampleCafeForm()` round-trips through `toInput.ts` + the engine
  without validation errors (it must be a valid input, not just plausible-looking strings).
- A basic interaction test (or manual QA note, if the project's test setup doesn't cover
  component interaction here) that the confirm-before-overwrite guard fires when the form
  is dirty.

---

## 5. Non-goals (explicitly not in this plan)

- City / location benchmark comparison (B4) — shelved, not designed here.
- Any change to Quick / Lite's engine or its 8 primary inputs.
- A per-product channel mix input, or category grouping — both stay locked out (DF-04a, DF-72).
- A separate "how to use this app" page/route — superseded by §4.1 + §4.2 per B3.
- Reopening DF-77 (platform vs. own-channel delivery volume split).

---

## 6. Implementation order

Independent workstreams; either can start first.

1. **A — decision-log entry** (§3.1) before any code, so the addition is reviewable on its
   own.
2. **A — engine accumulator** (§3.2), tested in isolation (the reconciliation invariant)
   before touching UI.
3. **A — view model + table + wiring** (§3.3), verified in both the on-screen result and a
   printed/exported report.
4. **B — `InfoTooltip` component**, wired into one or two fields first to validate the
   pattern, then the remaining copy filled in as a tracked content task.
5. **B — sample-fill button**, including the dirty-form confirmation guard.

Each step ends with `npm run typecheck && npm run test:run && npm run lint` per
`CLAUDE.md` §5, before moving to the next.
