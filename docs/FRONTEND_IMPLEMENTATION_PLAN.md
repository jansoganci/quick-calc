# Frontend implementation plan (Quick Calculation)

**Status:** planning only. Do not write React, CSS, or Worker UI code until the product owner asks.

This plan tells a later agent **how** to implement the Claude Design UI on top of the existing Quick core. It does not change financial behaviour.

## Authority

1. `docs/quick-calculation-scope-v1.md` — numbers, validation, simulation, copy meaning  
2. `docs/TECH_STACK_AND_CONSTRAINTS.md` — Vite, React, Tailwind, daisyUI, Workers Static Assets, no DB  
3. `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` — folders and import arrows  
4. `docs/QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md` — engine already shipped  
5. `docs/DESIGN_DIRECTION.md` + `docs/FRONTEND_IMPLEMENTATION_SPEC.md` + `docs/design.md` — look and screen behaviour  

If a mock number disagrees with the engine, **the engine wins**.

## What already exists

- Engine: `validateQuickInput`, `calculateQuick`, `simulateQuick` in `src/core/quick/`  
- Public re-exports: `src/core/quick/index.ts`  
- Tests: `src/core/quick/*.test.ts` (Vitest)  
- App shell: Vite + React + Tailwind + daisyUI in `src/` but **no Quick UI yet** (`App.tsx` is a placeholder)

Do not put React inside `src/core/`. Do not add `volumeSimulation` to `calculateQuick`. Do not call simulation from the calculator.

## Target shape (architecture)

```
src/features/quick-calc/
  QuickCalcPage.tsx          # page composition only
  components/                # Field, Assumptions, PrimaryButton, Summary, Bar, Table, SimTable, CopyButton
  hooks/useQuickCalc.ts      # local state, Hesapla, live recompute after first success
  viewModel.ts               # core result → display strings, bar widths, sim rows, clipboard text
  labels.ts                  # Turkish field labels and helper copy (UI-only)

src/app/                     # later: router. For v1 a single page is enough.
```

`viewModel.ts` is the **only** feature file that should import `@/core/quick` (or `src/core/quick`). Components consume view-model structs, not raw engine types, so labels and `tr-TR` formatting stay out of `core/`.

## Recompute (spec V6)

1. User fills all eight required fields. **Hesapla** stays disabled until `validateQuickInput` would succeed **and** every required visible field is non-empty.  
2. First click: `validateQuickInput` → if ok, `calculateQuick` + `simulateQuick` → show results.  
3. After that, any successful field change re-runs validate + calculate + simulate immediately.  
4. If the form becomes invalid after a first success, keep the last good result on screen; mark fields; do not invent partial maths.

Core already returns field-keyed errors. Map them onto the eight inputs. Do not invent a second validator.

## Field wiring

Visible fields bind to `QuickRawInput` keys from the spec §4:

| UI | Engine key |
| --- | --- |
| Ortalama satış tutarı | `averageTicketVatIncluded` |
| Günlük satış adedi | `dailySalesVolume` |
| Satış başına ürün maliyeti | `variableCostPerSale` |
| Aylık kira | `monthlyRent` |
| Diğer aylık giderler | `monthlyOtherOpex` |
| Çalışan sayısı | `employeeCount` |
| Kişi başı aylık maliyet | `averageEmployeeMonthlyCost` |
| Başlangıç yatırımı | `initialInvestment` |

Assumptions strip shows `QUICK_DEFAULTS` (30 / 60 / 90% / 3,56%) and the four values are **editable**, per scope §6.3 and decisions C8, C9, C10, C31 and C33. A blank field falls back to its default through `validateQuickInput`, exactly as the engine already does when the value is omitted; an edited value is marked `user` and shown in ink (§7.1). The two rate assumptions are entered as percentages and stored as ratios.

> **Superseded.** This section previously read "Editing them is **out of v1** unless scope is reopened", which contradicted five LOCKED decisions in the financial scope. The scope wins on financial behaviour, so editability was implemented.

Parse UI strings (thousand separators, comma decimals) in the feature layer **before** `validateQuickInput`, or pass numbers if inputs are controlled numerics. Either way, `core` still sees `QuickRawInput`. Do not duplicate range logic in the UI.

## View-model rules

- Format money with `tr-TR` (comma decimals, `.` thousands) in the feature layer.  
- Stacked bar widths = `shareOfTicket` from `costBreakdown` plus remaining (`1 - totalCostPerSale / averageTicketVatInclusive`). Spec §9.2 order is mandatory.  
- Headline remaining and “işletmede kalan” row use accent `#1D3A5F`. Other bar segments use the grey ladder in the design spec — **not** engine concerns.  
- Four outputs: `monthlyOperatingEarnings`, `grossProfitMargin`, `operatingProfitMargin`, `paybackPeriodMonths`. No extra metrics.  
- Simulation table: `simulateQuick` rows in engine order. Highlight `level === "current"`.  
- Clipboard: one plain-text block as spec §11. No URL, no image, no Web Share.  
- Negative earnings: minus sign in the number, same type colour as positive. No red, no badge.

## Layout

- Desktop (`lg:` and up): CSS grid `392px | 1px | 1fr`, max width `1152px`, page background `#EDEEF0`. Result column `position: sticky` (spec).  
- Below `lg`: single column, form then results, 44px controls, no horizontal scroll.  
- Empty result pane (before first Hesapla): short explanation + empty bar track only. **No sample numbers.**

Fonts: IBM Plex Sans + IBM Plex Mono via `index.html` or a small `@font-face` setup. Self-host or Google Fonts — Worker CSP must allow the chosen source (`TECH_STACK` already flags CSP as a deploy concern).

daisyUI: use it for reset/focus if it does not fight the quiet instrument look. Prefer explicit Tailwind colours from the design tokens over daisyUI “primary” palettes so navy stays `#1D3A5F`.

## What not to build in this UI pass

- Detailed Feasibility  
- Persist / restore (later; `localStorage` is allowed by stack but not in the design spec)  
- Auth, database, charts library  
- Routing beyond a single Quick page  
- Unifying Quick and Detailed  
- Changing `src/core/quick` formulas or public API  

## Suggested implementation order (when unblocked)

1. Tokens in Tailwind theme (`ink`, `muted`, `accent`, `hairline`, `error`).  
2. `labels.ts` + `viewModel.ts` with **unit tests** (format, bar shares, clipboard string, sim highlight). Feed golden core fixtures; assert display strings, not re-implemented maths.  
3. `useQuickCalc` (disabled button, first compute, live recompute).  
4. Form components (focus ring, error brick, disabled Hesapla).  
5. Result stack in spec order.  
6. Desktop / mobile layout.  
7. Manual check against `docs/design.md` frames 1a–1c for spacing and type — numbers from engine.

## Tests

- Keep existing core tests green; do not weaken them.  
- New tests live under `src/features/quick-calc/`, not under `core/`.  
- View-model tests are enough for the first UI PR; component tests optional.

## Commit policy when implementing later

Small PRs: (1) view-model + hook, (2) form, (3) results + sim + copy. Do not mix engine refactors with CSS.
