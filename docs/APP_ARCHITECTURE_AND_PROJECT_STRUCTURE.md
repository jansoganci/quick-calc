# App Architecture & Project Structure

**Version:** v1.0
**Status:** All decisions in this document are **LOCKED / APPROVED**.
**Phase:** Planning — **not** Implementation
**Companion documents:**
`docs/quick-calculation-scope-v1.md` — product & financial scope
`docs/TECH_STACK_AND_CONSTRAINTS.md` — stack, runtime, persistence, engineering constraints

This document records the approved application architecture and project structure. It introduces no new patterns and authorises no code.

**Do not write implementation code until it is explicitly requested.**

---

## 0. How to read this document

| This document IS | This document is NOT |
| --- | --- |
| The approved folder structure and boundary rules | Permission to start building |
| The source of truth for where code lives and what may import what | A product or financial specification |
| A guardrail against duplication and drift | A framework, a pattern catalogue, or an abstraction layer |

**Guiding sentence for every decision below:** the architecture must be understandable by one developer opening the repository for the first time.

---

## 1. Architecture approach **[LOCKED]**

**Feature-based, three layers, nothing more.**

This application is small. It has one genuinely valuable asset — the financial calculation logic — and everything else is a form and a result screen. So the architecture protects exactly one boundary well:

> **Business and financial calculations must not live in React components.**

That single rule delivers most of what the product spec requires: engine purity, determinism, testability, and one source of truth per formula.

### 1.1 The three layers

```
core/         pure TypeScript calculation logic — React-free
features/     screens, forms, composition — one folder per product mode
components/   reusable UI primitives — domain-neutral
```

plus two leaf areas: `lib/` (generic helpers) and `data/` (pure data).

### 1.2 The one mechanically enforced constraint

**`core/` may not import React.** This is checkable by a lint rule rather than by discipline, and it is the backbone of the whole structure.

### 1.3 Deliberately excluded **[LOCKED]**

Do **not** introduce:

- repository or service layers,
- dependency injection,
- generic engine interfaces that both modes implement,
- microservices,
- state-management libraries,
- generic form frameworks,
- chart libraries,
- premature shared abstractions,
- a `utils.ts` or any other god file.

Optimise for readability and maintainability, **not** theoretical architectural purity.

---

## 2. Folder structure **[LOCKED]**

```
src/
  app/
    App.tsx                    entry composition, root error boundary
    index.css                  Tailwind entry

  core/
    quick/
      types.ts                 QuickCalculationInput, QuickCalculationResult, CostLine
      defaults.ts              operating days 30, recovery 60, POS 3.56%, card share 0.90, VAT 10%, engine version
      limits.ts                valid input ranges — part of the calculation contract
      validate.ts              input validation; returns errors, never throws
      calculate.ts             the calculation chain
      simulate.ts              volume simulation — re-runs calculate at the 5 approved levels
      warnings.ts              plausibility checks; ranges passed in, never imported
      index.ts                 the module's only public entry point
    shared/
      number.ts                generic calculation primitives (e.g. safe division)
    detailed/                  later — not built now

  features/
    quick-calc/
      QuickCalcPage.tsx        screen composition only
      useQuickCalcForm.ts      React state for the 8 inputs and the editable assumptions
      viewModel.ts             engine result → display-ready values
      labels.ts               typed EN/TR label maps
      components/              form and result components specific to this feature
    detailed/                  later — not built now

  components/                  Button, Card, NumberField, Modal, Alert, Table, StatTile, StackedBar, Collapsible
  lib/
    money.ts                   TRY formatting, large-number abbreviation
    percent.ts                 percentage formatting
    validation.ts              generic predicates (isFiniteNumber, inRange, required)
    url.ts                     query-string encode/decode (only if URL sharing is built)
  data/
    benchmarks/
      tr/                      plausibility ranges and comparison data (pure data, no logic)
  constants.ts                 global constants only — currency code, locale
```

Minor filename adjustments are acceptable where they improve clarity. **The architecture itself does not change without a real reason.**

`core/detailed/` and `features/detailed/` are placeholders in this document only. They are **not created now**.

---

## 3. Folder responsibilities **[LOCKED]**

| Folder | Owns | Must not contain |
| --- | --- | --- |
| `app/` | Application entry, root composition, error boundary, Tailwind entry | Business logic, feature internals |
| `core/quick/` | Every Quick Calculation formula, its types, defaults, limits, validation, simulation and warning logic | React, UI state, `localStorage`, network, `Date.now()`, randomness, benchmark data imports |
| `core/shared/` | Genuinely generic calculation primitives | Business formulas belonging to a specific mode. Should stay near-empty — do not pre-fill it for a future engine |
| `core/detailed/` | *(later)* Detailed Feasibility's own formulas and types | Any dependency on `core/quick` business logic |
| `features/quick-calc/` | The Quick screen: form state, composition, labels, result-to-display mapping | Financial formulas, duplicated defaults, duplicated labels |
| `features/detailed/` | *(later)* Detailed Feasibility screens, scenario storage, JSON export/import | Imports of Quick Calculation business logic |
| `components/` | Reusable UI primitives used in more than one place | Domain knowledge — it must not know what rent, VAT or payback are |
| `lib/` | Formatting and generic validation predicates | Business rules, React, financial formulas |
| `data/` | Benchmark and plausibility range data | Any logic whatsoever |
| `constants.ts` | Truly global constants (currency code, locale) | Module-specific defaults — those live with their module |

### 3.1 Two placements that need explaining

**`warnings.ts` lives in `core/quick/` but receives its ranges as an argument.** The ratio logic is business logic and belongs in `core`, but the product spec requires that sector- and country-specific numbers never live inside the engine. Passing ranges in satisfies both: the feature layer reads them from `data/` and hands them to the function.

**`limits.ts` lives in `core/quick/`, not in the form.** Input ranges are part of the calculation contract, not UI preferences (D8). The form reads them from here; it does not define its own.

---

## 4. Dependency direction and boundaries **[LOCKED]**

```
app  →  features  →  core  →  lib
              ↘  components  →  lib
              ↘  data
```

| # | Rule |
| --- | --- |
| R1 | **`core/**` must never depend on React, features, components, UI state, or `data/`.** It may import `lib` and other `core` modules only |
| R2 | **`components/**` must stay domain-neutral.** It may import `lib` and React only — never `core`, `features`, or `data` |
| R3 | **`features/**` may compose `core`, `components`, `lib` and `data`** |
| R4 | **`lib/` and `data/` are leaf modules** — they import nothing else from the project |
| R5 | **Quick Calculation and Detailed Feasibility must not import business logic from each other**, in either `core/` or `features/` |
| R6 | **Shared generic utilities may be moved downward** (into `lib`, `components`, or `core/shared`) when reuse is genuine — never upward |
| R7 | **Avoid circular dependencies.** Cross-module imports go through a module's `index.ts`; files inside a module import their siblings directly, never through their own barrel |

R7 is the practical circular-import guard: with strict layering and a `types.ts` that imports nothing from its siblings, each module's internal graph stays acyclic by construction.

### 4.1 Enforcement level **[LOCKED]**

Enforcement stays **lightweight**: ESLint rules for import cycles and for the layer boundaries above. Nothing heavier — no dependency-graph tooling, no custom build-time architecture checks. This is a small project and the rules exist to catch accidents, not to police design.

---

## 5. Shared vs. feature-specific **[LOCKED]**

### 5.1 Shared

- UI primitives in `components/` — Button, Card, NumberField, Modal, Alert, Table, StatTile, StackedBar, Collapsible
- Formatting and generic validation predicates in `lib/`
- Benchmark and plausibility data in `data/`
- Global constants (currency, locale) in `constants.ts`
- The small number of generic calculation primitives in `core/shared/`

### 5.2 Feature-specific

- The 8-input Quick form and its state
- The cost-breakdown and volume-simulation visuals
- Quick output labels and the Quick view model
- Each mode's calculation engine

### 5.3 The generalisation rule

**Build for Quick Calculation only. Generalise after real reuse appears.**

Two genuine call sites justify a shared primitive; one does not. Do **not** create abstractions for hypothetical future reuse — in particular, do not build shared abstractions now for a Detailed Feasibility engine that does not exist. The product spec already establishes that the two engines are separate and may disagree, so there is nothing to unify yet.

---

## 6. Reuse and duplication rules **[LOCKED]**

These are the rules that matter most in this project.

| # | Rule |
| --- | --- |
| U1 | **A financial formula has exactly one source of truth.** The same calculation is never written twice — not across modes, not between engine and UI, not between engine and tests |
| U2 | **Defaults are defined once.** VAT rate, operating days, CAPEX recovery period, card payment share and POS commission live in `core/quick/defaults.ts`. The form imports them; it never restates them |
| U3 | **Input limits are defined once**, in `core/quick/limits.ts` (D8) |
| U4 | **Labels are defined once**, in `features/quick-calc/labels.ts`, keyed by output. The same KPI is never labelled differently in the headline, the simulation table and the assumptions panel |
| U5 | **UI primitives are created once** when reuse is justified, and reused thereafter. Button, Card, NumberField, Modal, Alert and Table are not recreated per screen |
| U6 | **Shared types are not redefined.** Each module owns its types in its own `types.ts` and other modules import them. No global type dumping ground, and no copied interface definitions |
| U7 | **Rounding happens in one place.** The engine returns raw values; `lib/money.ts` and `lib/percent.ts` do all presentation rounding |
| U8 | **Do not wrap daisyUI for its own sake.** Wrap an element only when it is used three or more times, or when it carries app-specific behaviour (for example a `NumberField` that formats TRY and surfaces validation) |
| U9 | **Avoid both extremes:** no giant files, and no unnecessary one-function-file fragmentation |

### 6.1 Where the calculation boundary actually sits (D2)

`viewModel.ts` converts engine results into display-ready values and centralises presentation mapping. It keeps financial formulas out of components.

**This boundary is not over-enforced.** Simple, clearly visual-only arithmetic may stay in the UI:

| Allowed in a component | Must come from `core` or `viewModel` |
| --- | --- |
| Percentage width for a stacked bar segment | Any monetary amount shown to the user |
| Simple progress or proportion ratios driving layout | Any margin, cost, earnings or payback figure |
| Non-financial visual calculations | Anything derived from a financial formula |

**The test to apply:** if the number is displayed to the user as a financial figure, it comes from the engine or the view model. If it only drives pixels, the component may compute it inline.

Do not create extra files or abstractions purely to relocate trivial presentation math out of JSX.

### 6.2 Internal engine values (D7)

The Quick UI consumes only the **public result shape intended for presentation**. Internal values — contribution per sale, contribution margin, hidden break-even figures — are not exposed to the UI unless a feature genuinely needs them.

A clear public result type, or a public mapping in `viewModel.ts`, is sufficient. **Do not build multiple layers to achieve this.**

---

## 7. Testing boundaries **[LOCKED]**

**Runner:** Vitest (D3), for calculation logic and critical helpers.

### 7.1 What is tested

| Area | Priority | What to cover |
| --- | --- | --- |
| `core/quick/calculate.ts` | **High** | The full chain; the worked example from the product spec as the first golden vector, asserting the breakdown reconciles to the average sale |
| `core/quick/simulate.ts` | **High** | All five approved volume levels; only daily sales volume varies |
| `core/quick/validate.ts` | **High** | Every documented validation condition |
| Edge cases | **High** | Zero sales volume, non-positive contribution, zero revenue, zero CAPEX, non-finite input — the engine must never produce `NaN`, `Infinity`, or throw |
| `core/quick/warnings.ts` | Medium | Threshold behaviour with injected ranges; warnings never alter a number |
| `lib/**` critical helpers | Medium | Formatting and safe division |
| `features/quick-calc/viewModel.ts` | Medium | Mapping correctness, and that forbidden labels never appear |
| `components/**` and screens | **Not required in v1** | Verified manually |

### 7.2 What is not built

No large UI test suite, no end-to-end infrastructure, no visual regression tooling, no snapshot sprawl. Add UI testing only if later product complexity genuinely requires it.

### 7.3 Test placement

Tests are colocated with the code they cover, named `*.test.ts`. There is no parallel `__tests__` tree.

---

## 8. Naming and file-size guidance **[LOCKED]**

### 8.1 Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Folders | kebab-case | `quick-calc` |
| React components | PascalCase `.tsx` | `QuickCalcPage.tsx`, `NumberField.tsx` |
| Non-component modules | camelCase `.ts` | `calculate.ts`, `viewModel.ts` |
| Types file | `types.ts` per module | `core/quick/types.ts` |
| Public entry point | `index.ts` at module boundaries only | `core/quick/index.ts` |
| Tests | `*.test.ts`, colocated | `calculate.test.ts` |
| Functions | verb-first | `calculateQuick`, `validateQuickInput`, `formatMoney` |
| Types and interfaces | PascalCase, **no** `I` prefix | `QuickCalculationResult` |
| Booleans | `is` / `has` / `should` prefix | `isCurrent`, `exceedsRecoveryPeriod` |

### 8.2 Domain naming follows the product spec

Field and variable names match the product spec exactly. The spec's terminology rules apply to **code identifiers**, not only to user-facing copy:

- Use `monthlyCapexRecoveryAllocation` — **never** `depreciation`.
- Use `operatingProfitMargin` — **never** `netProfitMargin`.
- Keep `posCommissionRate` and `cardPaymentShare` distinct; never merge or abbreviate them into one name.

Only the spec's own abbreviations are used: CAPEX, OPEX, POS, VAT.

### 8.3 File size

- Logic modules: split when a file exceeds roughly **200 lines** or clearly holds two responsibilities.
- React components: aim below roughly **150 lines**; extract a child component when a screen grows past comfortable reading.
- Split by **responsibility**, not by function count. One module per concept — not one file per function.

---

## 9. Architecture risks and mitigations

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | **Financial formulas drifting into components.** A result screen invites inline math | Monetary and margin figures come from the engine or view model (§6.1). Visual-only math in JSX is fine — the line is whether the number is displayed as a financial figure |
| 2 | **Duplicated defaults.** The form shows editable defaults, so a hardcoded copy would silently drift from the engine | One source in `core/quick/defaults.ts`; the form imports it (U2) |
| 3 | **Drifting labels.** The same KPI appears in the headline, simulation table and assumptions panel | One `labels.ts` keyed by output (U4), which is also where forbidden labels are prevented |
| 4 | **Internal values reaching the UI**, contradicting the product spec | The UI consumes only the public result shape (§6.2, D7) |
| 5 | **Rounding drift** — rounding twice, or rounding creeping into the engine | Engine returns raw values; all rounding in `lib/money.ts` and `lib/percent.ts` (U7) |
| 6 | **Over-splitting** into many tiny files, the opposite of a god file | File-size guidance in §8.3; split by responsibility |
| 7 | **Wrapping every daisyUI class** in a custom component, adding abstraction without benefit | The three-uses-or-behaviour rule (U8) |
| 8 | **Terminology erosion in identifiers** — banned words reappearing as variable names | §8.2 treats spec terminology as a code rule |
| 9 | **Premature abstraction for Detailed Feasibility** before it exists | Build for Quick only; generalise on real reuse (§5.3) |
| 10 | **Circular imports** as the module count grows | Layering plus the barrel rule (R7) and a lint cycle check (§4.1) |

---

## 10. Decisions register

All items are **LOCKED / APPROVED**. Not to be reopened or replaced without an explicit new decision.

### 10.1 Approved decisions

| # | Decision | Resolution |
| --- | --- | --- |
| D1 | Core path | **`core/quick/`.** No unnecessary `finance/` level |
| D2 | View model | **Keep `viewModel.ts`** — converts engine results to display-ready values, keeps financial formulas out of components, centralises presentation mapping. **Not over-enforced:** trivial visual-only math (stacked-bar widths, progress ratios, non-financial visual calculations) may stay in the UI. The rule is that **business and financial calculations must not live in React components**. No extra files purely to relocate trivial presentation math |
| D3 | Tests and enforcement | **Vitest** for calculation logic and critical helpers, plus a **lightweight lint/import-boundary rule** against invalid dependency direction and circular imports. No large testing framework, no extensive UI test infrastructure |
| D4 | Routing | **No router yet.** The initial product is a single-screen Quick Calculation experience. Routing is added only when a second real screen requires it. React Router is not installed preemptively |
| D5 | Charts | **No chart library.** The stacked cost breakdown and volume simulation visual are built with Tailwind and ordinary HTML/CSS |
| D6 | Language labels | **No i18n library yet.** Typed label maps / simple structured translation data for EN/TR. An i18n library only if the surface grows enough to justify it |
| D7 | Internal engine values | The UI consumes only the **public result shape**. Internal values (contribution, hidden break-even) are not exposed unless a feature genuinely needs them. A clear public result type or public mapping is enough — **no extra layers** |
| D8 | Input limits | **`core/quick/limits.ts`** — part of the calculation contract, not arbitrary UI preferences |

### 10.2 Approved architecture rules

| # | Area | Resolution |
| --- | --- | --- |
| A1 | Structure | Feature-based structure as specified in §2. Minor filename clarity adjustments allowed; no architectural change without a real reason |
| A2 | Layers | Three layers — `core`, `features`, `components` — plus `lib` and `data` as leaves. No additional layers |
| A3 | Dependency direction | `app → features → core → lib`, with `features → components → lib` and `features → data` (§4) |
| A4 | Core purity | `core` never depends on React, features, components, or UI state (R1) |
| A5 | Component neutrality | `components` stays domain-neutral (R2) |
| A6 | Mode separation | Quick and Detailed never import business logic from each other (R5) |
| A7 | Utility movement | Shared generic utilities move downward when genuinely reusable, never upward (R6) |
| A8 | Cycles | Circular dependencies avoided; enforcement stays lightweight (R7, §4.1) |
| A9 | Reuse | One source of truth per formula, default, limit, label and type (§6) |
| A10 | Abstraction timing | No abstractions for hypothetical reuse; generalise after real reuse (§5.3) |
| A11 | File sizing | Neither giant files nor one-function-file fragmentation (§8.3) |
| A12 | Testing focus | Calculation logic, simulation, validation, edge cases and critical pure helpers. No large UI suite (§7) |
| A13 | Excluded patterns | No repository/service layers, dependency injection, generic engine interfaces, microservices, state-management libraries, generic form frameworks, chart libraries, or premature shared abstractions (§1.3) |
| A14 | Optimisation target | Readability and maintainability for a single developer, not theoretical purity |

### 10.3 Relationship to other planning documents

| Document | Owns |
| --- | --- |
| `docs/quick-calculation-scope-v1.md` | Quick Calculation product scope, inputs, formulas, outputs, terminology |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` | Stack, runtime, deployment, persistence, exclusions, engineering constraints |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` (this file) | Folder structure, layer boundaries, dependency direction, reuse rules, testing boundaries, naming |
| `docs/DETAILED_FEASIBILITY_DECISIONS.md` | Detailed Feasibility locked decisions (not yet a full financial specification) |
| `docs/README.md` | Index of active vs archived documentation |

On disagreement: the product spec wins on **financial behaviour**; the tech stack document wins on **stack, runtime and persistence**; this document wins on **code organisation and boundaries**.

---

## 11. Blocking decisions

**No blocking architecture decisions remain.** The structure, boundaries, reuse rules, testing focus and naming conventions are fully specified, and no genuine architectural contradiction exists between this document, the product scope, and the tech stack constraints.

---

## 12. Changelog

| Version | Change |
| --- | --- |
| v1.0 | Initial locked architecture: feature-based three-layer structure, `core/quick/` path, view model with a pragmatic (non-over-enforced) calculation boundary, Vitest plus lightweight import-boundary linting, no router, no chart library, no i18n library, public-only result shape for the UI, limits as part of the calculation contract, reuse and duplication rules, testing boundaries, naming and file-size guidance |
