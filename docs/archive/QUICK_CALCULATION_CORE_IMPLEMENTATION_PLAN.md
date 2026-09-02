# Quick Calculation Core — Implementation Plan

> **Archived.** This execution plan has been carried out. It is kept for history and is **not** an active source of truth. Formulas are owned by `docs/quick-calculation-scope-v1.md`. See `docs/README.md`.

**Version:** v1.1
**Status:** Archived — execution complete
**Implementation model:** **Grok 4.6 High** (approved — no model change needed)
**Phase:** Non-visual application core — **no UI in this phase**

**Source documents (read-only — do not modify):**

- `docs/quick-calculation-scope-v1.md` — product & financial scope (**v1.4**, the authority on all formulas)
- `docs/TECH_STACK_AND_CONSTRAINTS.md` — stack, runtime, persistence, engineering constraints
- `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` — folder structure, layer boundaries, naming

**How to use this document:** it is written to be executed with minimal interpretation. Every formula, limit, guard, output field and test value needed is stated here. Where this plan and the product spec agree, either may be read. **If they ever appear to disagree, the product spec wins on financial behaviour** — stop and report the discrepancy rather than guessing.

---

## 1. Objective

Implement a **complete, deterministic, fully tested Quick Calculation core in TypeScript**, with no React and no UI.

The core must be:

- **mathematically correct** — it reproduces the approved worked example exactly;
- **deterministic** — the same input object always produces identical output;
- **total** — every valid input produces a defined result; it never throws, and never returns `NaN` or `Infinity`;
- **validated** — invalid input is rejected before any arithmetic runs;
- **tested** — golden vector, structural invariants, simulation, validation and edge cases.

Frontend and visual design are a separate later phase. Nothing in this phase may anticipate them.

---

## 2. Exact scope

### 2.1 In scope

| Area | Detail |
| --- | --- |
| Quick engine | `types.ts`, `defaults.ts`, `limits.ts`, `validate.ts`, `calculate.ts`, `simulate.ts`, `index.ts` |
| Tests | Golden vector, invariants, simulation, validation, edge cases, drift guard |
| Tooling | TypeScript, Vitest, lightweight ESLint import-boundary rules |

### 2.2 Explicitly out of scope for this phase

These were considered and **deliberately removed**. Do not create them, and do not create placeholders for them.

| Removed | Reason |
| --- | --- |
| `warnings.ts` and `warnings.test.ts` | Plausibility warnings are deferred until a researched benchmark dataset exists |
| `data/benchmarks/tr/` and placeholder ranges | No real benchmark data yet; the architecture already permits adding this later |
| Provenance / source tracking | Quick Calculation no longer benchmark-fills anything. The 8 primary inputs come from the user; secondary assumptions have defaults the user may edit. The UI can determine what a user changed without provenance logic in the engine |
| `assumptions[]` array in the result | Superseded by the removal of provenance. The caller already holds the resolved input returned by `validate` — do not echo it back in the result |
| `volumeSimulation` field inside `QuickCalculationResult` | The simulation is returned separately by `simulateQuick` (§8.0, §9). The product spec's illustrative result shape lists it inline; that is a **structural** difference only — every simulation formula, level and value is unchanged, and this plan controls code structure |
| `core/shared/` | Every division in the chain is guarded explicitly (§6.9), so a shared `safeDivide` would have no caller that needs it |
| `lib/` | `money.ts` and `percent.ts` are presentation formatting, and the engine returns raw unrounded values by design. `url.ts` belongs to a deferred decision |
| `constants.ts` | The only constant needed is the currency code, which lives in `defaults.ts` as part of the engine's meta contract (approved clarification C4) |
| Contribution and break-even values | Not outputs, and not needed by anything in this phase. **Do not compute them at all** — no `internal` block is required |

---

## 3. Files to create

Nothing exists yet except `docs/`. Every item below is a new file. **Modify nothing. Leave all three planning documents untouched.**

### 3.1 Engine

```
src/core/quick/types.ts
src/core/quick/defaults.ts
src/core/quick/limits.ts
src/core/quick/validate.ts
src/core/quick/calculate.ts
src/core/quick/simulate.ts
src/core/quick/index.ts
```

### 3.2 Tests (colocated)

```
src/core/quick/validate.test.ts
src/core/quick/calculate.test.ts
src/core/quick/simulate.test.ts
src/core/quick/edgeCases.test.ts
```

### 3.3 Project and tooling

```
package.json
tsconfig.json
vitest.config.ts
eslint.config.js
.gitignore
```

**Total: 16 files.** If you believe an additional file is genuinely required, state why before creating it.

---

## 4. Responsibility of each file

| File | Responsibility (one sentence) |
| --- | --- |
| `types.ts` | Declares the raw input, resolved input, cost-line union, validation error, the calculation result type and the simulation row type. |
| `defaults.ts` | The single source of truth for secondary assumption defaults, the VAT system assumption, the currency code and the engine version. |
| `limits.ts` | Valid input ranges for primary inputs and secondary assumptions, as part of the calculation contract. |
| `validate.ts` | Converts a raw input into either a resolved valid input or a list of field-level error codes, never throwing. |
| `calculate.ts` | Calculates **one** financial case — the monthly and per-sale chain — and contains no simulation. |
| `simulate.ts` | Generates the five approved volume levels and calls `calculateQuick` once per level, returning the rows separately. |
| `index.ts` | The module's only public entry point, exporting both functions and the public types. |
| `validate.test.ts` | Verifies every documented validation condition and default application. |
| `calculate.test.ts` | Verifies the golden vector and the structural invariants. |
| `simulate.test.ts` | Verifies the five returned rows, the rounding, and that only volume varies. |
| `edgeCases.test.ts` | Table-driven coverage of the spec's edge-case conditions plus the no-`NaN`, no-`Infinity` and drift guards. |
| `package.json` | Dev dependencies and scripts. |
| `tsconfig.json` | Strict TypeScript configuration, type-check only (no emit). |
| `vitest.config.ts` | Minimal Vitest configuration. |
| `eslint.config.js` | Import-cycle and layer-boundary rules. |
| `.gitignore` | Standard Node/TypeScript ignores. |

---

## 5. Exact implementation sequence

Complete each stage and verify it before starting the next. Do not work ahead.

| Stage | Work | Verify before continuing |
| --- | --- | --- |
| **1** | Bootstrap: `package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `.gitignore`; install dev dependencies | `npm run typecheck` and `npm run test` both execute successfully (zero tests is fine) |
| **2** | `types.ts`, `defaults.ts`, `limits.ts` — the entire contract surface in one pass | `npm run typecheck` clean |
| **3** | `validate.ts` + `validate.test.ts` | All validation tests green |
| **4** | `calculate.ts` + `calculate.test.ts` (golden vector **and** invariants) | Golden vector and all invariants green. **This is the critical checkpoint — do not proceed if any value is off** |
| **5** | `simulate.ts` + `simulate.test.ts` | Simulation tests green; `calculate.ts` still has no reference to simulation |
| **6** | `edgeCases.test.ts` | All edge-case, no-`NaN`, no-`Infinity` and drift-guard tests green |
| **7** | `index.ts` — the public barrel, written last so it exports a known-good surface | `npm run typecheck` clean |
| **8** | Final pass: full test suite, type check, lint | Everything green; no `core/` file imports React |

Rationale for this order: the contract is fixed before any logic so nothing is retrofitted; validation lands before arithmetic so `calculate` may assume a valid input; simulation depends on a correct `calculate` and therefore follows it (a one-way dependency — see §8.0); the barrel is written last.

---

## 6. Formula implementation mapping

Every formula below maps to `docs/quick-calculation-scope-v1.md`. **Transcribe exactly.** Do not simplify, refactor, reorder or "improve" any expression.

**Basis rules (spec §5.1):** revenue is net of VAT; the entered `averageTicket` is **VAT-inclusive**; cost inputs are used **exactly as entered with no VAT adjustment**; POS commission applies to the **gross** ticket.

### 6.1 Monthly sales volume — spec §8.1

```
monthlySalesVolume = dailySalesVolume × operatingDaysPerMonth
```

### 6.2 Revenue and VAT — spec §8.2

```
netAverageTicket        = averageTicket / (1 + vatRate)
vatPerSale              = averageTicket − netAverageTicket
monthlyGrossCollections = monthlySalesVolume × averageTicket
monthlyNetRevenue       = monthlySalesVolume × netAverageTicket
monthlyVat              = monthlyGrossCollections − monthlyNetRevenue
```

`monthlyNetRevenue` is the revenue figure used by everything downstream.

### 6.3 Monthly payroll — spec §8.3

```
monthlyPayroll = employeeCount × averageEmployeeMonthlyCost
```

### 6.4 Monthly variable cost — spec §8.4

```
monthlyVariableCost = monthlySalesVolume × variableCostPerSale
```

**`variableCostPerSale` is used exactly as entered.** No waste adjustment, no input-VAT adjustment, no recipe costing. There is no waste concept anywhere in this codebase.

### 6.5 Transaction cost — spec §8.5

```
posCostPerSale         = averageTicket × cardPaymentShare × posCommissionRate
monthlyTransactionCost = monthlySalesVolume × posCostPerSale
```

`averageTicket` is already gross, so **no gross-up conversion**. Keep `cardPaymentShare` and `posCommissionRate` as two distinct values; never merge them.

### 6.6 Monthly CAPEX recovery allocation — spec §8.6

```
monthlyCapexRecoveryAllocation = initialCapex / capexRecoveryPeriodMonths
```

Never name this "depreciation" in any identifier, type, comment or string.

### 6.7 Monthly fixed and total cost — spec §8.7, §8.8

```
monthlyFixedCost = monthlyRent + monthlyPayroll + otherMonthlyOpex
                 + monthlyCapexRecoveryAllocation

monthlyTotalCost = monthlyFixedCost + monthlyVariableCost + monthlyTransactionCost
```

### 6.8 Per-sale outputs — spec §9

Computed **only when `monthlySalesVolume > 0`**; otherwise every per-sale output is `null` (§6.9).

```
fixedCostPerSale            = monthlyFixedCost / monthlySalesVolume
payrollPerSale              = monthlyPayroll / monthlySalesVolume
rentPerSale                 = monthlyRent / monthlySalesVolume
otherOpexPerSale            = otherMonthlyOpex / monthlySalesVolume
investmentRecoveryPerSale   = monthlyCapexRecoveryAllocation / monthlySalesVolume

estimatedTotalCostPerSale   = vatPerSale + variableCostPerSale
                            + posCostPerSale + fixedCostPerSale

remainingProfitPerSale      = averageTicket − (vatPerSale + variableCostPerSale
                            + payrollPerSale + rentPerSale + otherOpexPerSale
                            + posCostPerSale + investmentRecoveryPerSale)
```

**Breakdown line order is fixed (spec §9.2) and must not change:**

```
1 vat
2 variable
3 payroll
4 rent
5 otherOpex
6 pos
7 investmentRecovery
```

followed by `remainingProfit` as the residual. The seven lines plus the residual always sum to `averageTicket`.

### 6.9 Division guards

There is no shared safe-division helper. Each division is guarded explicitly:

| Division | Guard |
| --- | --- |
| by `monthlySalesVolume` | Single branch at the top of the per-sale section: if `monthlySalesVolume === 0`, all per-sale outputs and the breakdown are `null` |
| by `capexRecoveryPeriodMonths` | Validated to 1–240 before the engine runs, so it can never be zero |
| by `monthlyNetRevenue` (margins) | Explicit branch: if `monthlyNetRevenue === 0`, both margins are `null` |
| by the payback denominator | Explicit guard sequence in §6.11 |
| by `(1 + vatRate)` | `vatRate` is a fixed non-negative system assumption, so the divisor is always ≥ 1 |

### 6.10 Monthly earnings and margins — spec §10

```
monthlyOperatingEarnings = monthlyNetRevenue − monthlyTotalCost
```

This **includes** the CAPEX recovery allocation as a cost, via `monthlyFixedCost`.

```
grossProfitMargin     = (monthlyNetRevenue − monthlyVariableCost) / monthlyNetRevenue
operatingProfitMargin = monthlyOperatingEarnings / monthlyNetRevenue
```

Both are `null` when `monthlyNetRevenue === 0` — **`null`, never `0`**.

Never name the second margin `netProfitMargin`.

### 6.11 Investment payback — spec §11

```
monthlyOperatingEarningsBeforeCapexRecoveryAllocation
    = monthlyOperatingEarnings + monthlyCapexRecoveryAllocation

paybackMonths = initialCapex / monthlyOperatingEarningsBeforeCapexRecoveryAllocation
```

**Guard order is significant — evaluate in exactly this sequence:**

1. If `initialCapex === 0` → `{ months: 0, exceedsRecoveryPeriod: false }`.
2. Else if `monthlyOperatingEarningsBeforeCapexRecoveryAllocation <= 0` → `{ available: false, reason: 'non_positive_earnings_before_recovery' }`.
3. Else → `{ months: paybackMonths, exceedsRecoveryPeriod: paybackMonths > capexRecoveryPeriodMonths }`.

The gate is on the **before-allocation** figure, not on displayed earnings. CAPEX must never be double-counted: the recovery allocation belongs to the earnings figure, and the raw `initialCapex` belongs to the payback numerator.

### 6.12 Rounding

**No rounding anywhere in the engine.** All values are returned as raw floating-point numbers. Presentation rounding belongs to a later phase.

The single exception is the simulation's daily-sales level generation (§8.2), which rounds the volume itself — not a monetary result.

---

## 7. Validation behaviour

`validate.ts` runs **before** the engine. `calculate.ts` assumes an already-valid resolved input.

### 7.1 Shape

`validate` returns a discriminated result — **it never throws**:

- success → `{ ok: true, input: <resolved input> }`
- failure → `{ ok: false, errors: [...] }`

Each error carries the `field`, an error `code`, and where relevant the `limit` that was breached. **No user-facing message strings in `core/`** — message copy belongs to the later UI phase, which maps codes to text.

### 7.2 Error codes

Use exactly these four:

| Code | Meaning |
| --- | --- |
| `required` | A primary input is missing, `null`, `undefined` or an empty string |
| `not_a_number` | Not a number, or not finite (`NaN`, `Infinity`, `-Infinity`) |
| `below_min` | Below the allowed minimum (this also covers negative money values) |
| `above_max` | Above the allowed maximum |

### 7.3 Primary inputs — all 8 required

An empty primary field is a **validation error**. It is never defaulted, never benchmark-filled, and never treated as `0`. A user may deliberately enter `0` where the range allows it.

| Field | Min | Max | Note |
| --- | --- | --- | --- |
| `monthlyRent` | 0 | 50,000,000 | |
| `employeeCount` | 0 | 500 | May be fractional (FTE) |
| `averageEmployeeMonthlyCost` | 0 | 1,000,000 | |
| `otherMonthlyOpex` | 0 | 50,000,000 | |
| `initialCapex` | 0 | 500,000,000 | `0` is valid |
| `averageTicket` | **greater than 0** | 100,000 | Strictly positive; `0` is `below_min` |
| `dailySalesVolume` | 0 | 100,000 | May be fractional |
| `variableCostPerSale` | 0 | 100,000 | |

### 7.4 Secondary assumptions — defaulted, editable (clarification C1)

If a secondary assumption is absent, **fill it from `defaults.ts`**. That is default application, not benchmark filling, and is not an error. If present, validate it against its range.

| Field | Min | Max | Default |
| --- | --- | --- | --- |
| `operatingDaysPerMonth` | 1 | 31 | `30` |
| `capexRecoveryPeriodMonths` | 1 | 240 | `60` |
| `cardPaymentShare` | 0 | 1 | `0.90` |
| `posCommissionRate` | 0 | 0.10 | `0.0356` |

`vatRate` is a **system assumption of `0.10`** taken from `defaults.ts`. It is not part of the raw user input and is not user-validated.

### 7.5 Explicitly not a validation error

- **`variableCostPerSale > netAverageTicket`** is **valid**. The spec treats it as a warned-but-legal condition, and warnings are deferred, so it simply passes and produces negative earnings.
- `initialCapex === 0` is valid.
- `dailySalesVolume === 0` is valid.
- Fractional `employeeCount` and `dailySalesVolume` are valid.

### 7.6 Behaviour

Collect **all** errors and return them together — do not stop at the first. Validation is pure: no logging, no side effects.

---

## 8. Simulation behaviour

### 8.0 Two separate functions — no recursion **[LOCKED]**

The core exposes **two independent functions**. They must not call each other in both directions.

```
calculateQuick(resolvedInput)  →  QuickCalculationResult
    Calculates ONE financial case only.
    It does NOT calculate, contain, or return volume simulation.

simulateQuick(resolvedInput)   →  QuickSimulationRow[]
    Generates the five approved rows.
    It MAY call calculateQuick() once per generated input.
    It returns the simulation rows separately.
```

**Direction of dependency is one-way only:**

```
simulateQuick  →  calculateQuick        ✅
calculateQuick →  simulateQuick         ❌ forbidden
```

`calculateQuick` must contain no reference to simulation of any kind. This eliminates any possibility of a `calculate → simulate → calculate` recursion.

**Do not add an orchestration or service layer to combine them.** Both are exported from `src/core/quick/index.ts`, and the future frontend calls both and composes the two results itself.

### 8.1 No new inputs

The simulation takes **no additional user input**. It is generated from the same resolved input passed to `calculateQuick`.

It varies **only** `dailySalesVolume`. Everything else is held unchanged: rent, employee count, employee cost, other OPEX, CAPEX, average ticket, variable cost per sale, operating days, VAT rate, card payment share and POS commission rate.

### 8.2 The five approved levels

Always emit **exactly five labelled rows, in this order**:

| Label | Multiplier | Daily sales value |
| --- | --- | --- |
| `-50%` | 0.50 | `Math.round(dailySalesVolume × 0.50)` |
| `-25%` | 0.75 | `Math.round(dailySalesVolume × 0.75)` |
| `current` | 1.00 | the resolved `dailySalesVolume` **as entered, unrounded** |
| `+25%` | 1.25 | `Math.round(dailySalesVolume × 1.25)` |
| `+50%` | 1.50 | `Math.round(dailySalesVolume × 1.50)` |

`Math.round` applies to the four **generated** levels. The `current` row uses the entered value unchanged so that its figures always match the `calculateQuick` result exactly. (Where the entered volume is a whole number — the normal case — this distinction has no effect.)

**Tie-breaking:** JavaScript's `Math.round` rounds `.5` **upward** (`Math.round(200.5) === 201`, `Math.round(0.5) === 1`). Rely on that behaviour — do not substitute a custom rounding helper, and do not assume banker's rounding, which some other languages use and which would produce different values.

**Duplicate rounded volumes are acceptable.** At very low volumes several levels may round to the same number; still emit all five rows with their distinct labels. Never de-duplicate, never drop a row, never add a sixth.

Worked rounding examples for test expectations:

| Base | `-50%` | `-25%` | `current` | `+25%` | `+50%` |
| --- | --- | --- | --- | --- | --- |
| 1,000 | 500 | 750 | 1,000 | 1,250 | 1,500 |
| 401 | 201 | 301 | 401 | 501 | 602 |
| 1 | 1 | 1 | 1 | 1 | 2 |
| 0 | 0 | 0 | 0 | 0 | 0 |

### 8.3 Row contents

Each `QuickSimulationRow` contains: `label`, `dailySales`, `estimatedTotalCostPerSale`, `monthlyOperatingEarnings`, `isCurrent`.

`estimatedTotalCostPerSale` follows the same per-sale rule as `calculateQuick` — `null` when that level's monthly volume is `0`.

### 8.4 Implementation approach

For each of the five levels, build a copy of the resolved input with only `dailySalesVolume` replaced, call `calculateQuick` on it, and read the two figures needed for the row from that result.

**Do not duplicate any formula inside `simulate.ts`** — a financial formula has exactly one source of truth. `simulate.ts` contains level generation and row assembly only, never arithmetic from §6.

### 8.5 Boundary

This is a single-variable sensitivity view, not a scenario engine. Do not add levels, extra variables, configuration, capacity adjustment, or automatic staffing/rent changes.

---

## 9. Public result contract

Contract description below — **specification, not code to copy verbatim**. Implement it in idiomatic strict TypeScript.

There are **two separate result types**, matching the two separate functions in §8.0. `QuickCalculationResult` describes one financial case and contains **no simulation**.

```ts
type CostLine =
  | 'vat' | 'variable' | 'payroll' | 'rent' | 'otherOpex' | 'pos' | 'investmentRecovery';

type SimulationLabel = '-50%' | '-25%' | 'current' | '+25%' | '+50%';

interface Unavailable { available: false; reason: string; }

interface QuickCalculationResult {
  monthly: {
    salesVolume; grossCollections; vat; netRevenue;
    payroll; variableCost; transactionCost; capexRecoveryAllocation;
    fixedCost; totalCost;
    operatingEarnings;
    operatingEarningsBeforeCapexRecoveryAllocation;
  };

  perSale: {
    grossTicket; netTicket; vat; variable; pos; fixed;
    estimatedTotalCost; remainingProfit;
  } | null;                                    // null when salesVolume === 0

  breakdownPerSale: {
    averageSale;
    lines: Array<{ line: CostLine; amount: number }>;   // fixed order, §6.8
    remainingProfit;
  } | null;                                    // null when salesVolume === 0

  grossProfitMargin: number | null;            // null when netRevenue === 0
  operatingProfitMargin: number | null;        // null when netRevenue === 0

  payback: { months: number; exceedsRecoveryPeriod: boolean } | Unavailable;

  meta: {
    quickEngineVersion: string;                // '1.0.0' — implements product spec v1.4
    currency: 'TRY';
    vatRate: number;
    revenueBasis: 'net';
  };

  // NOTE: no volumeSimulation field — simulation is returned separately (§8.0)
}

interface QuickSimulationRow {
  label: SimulationLabel;
  dailySales: number;
  estimatedTotalCostPerSale: number | null;    // null when that level's volume is 0
  monthlyOperatingEarnings: number;
  isCurrent: boolean;
}

// simulateQuick returns QuickSimulationRow[] — always exactly 5 rows, in label order.
```

### 9.1 Public API surface

`src/core/quick/index.ts` exports exactly these:

| Export | Kind |
| --- | --- |
| `validateQuickInput` | function |
| `calculateQuick` | function |
| `simulateQuick` | function |
| `QUICK_DEFAULTS` (or equivalent named defaults export) | value |
| `QUICK_LIMITS` (or equivalent named limits export) | value |
| Public types: raw input, resolved input, `QuickCalculationResult`, `QuickSimulationRow`, `SimulationLabel`, `CostLine`, validation error, `Unavailable` | types |

No wrapper, orchestrator, façade or service that combines calculation and simulation.

### 9.2 Rules for this contract

- **`QuickCalculationResult` contains no simulation field.** Simulation is a separate return value from a separate function.
- **No `assumptions` array and no provenance fields.** The caller already holds the resolved input returned by validation.
- **No `internal` block.** Contribution and break-even are not computed at all in this phase.
- **No field named or containing `breakEven`, `contribution`, `netProfit`, or `depreciation`** anywhere in either type, the implementation, or any string.
- The `monthly` block is part of the contract. The product spec's rule that monthly intermediates must not be rendered as headline KPIs is a **later UI concern**, not a restriction on this type.
- Every numeric field is a raw unrounded number.

---

## 10. Test plan

Runner: **Vitest**. Tests are colocated as `*.test.ts`. Use a tolerance for floating-point comparison — roughly `1e-6` for monetary values and tighter (about `1e-9`) for structural sum invariants. Never compare floats with strict equality.

### 10.1 Golden vector — `calculate.test.ts`

**Purpose: arithmetic verification only.** These numbers exist to prove the formula chain is transcribed correctly. Do not discuss, adjust or question their realism, calibration or market plausibility — that subject is closed.

**Inputs**

```
monthlyRent                 450,000
employeeCount               12
averageEmployeeMonthlyCost  48,000
otherMonthlyOpex            110,000
initialCapex                10,000,000
averageTicket               140        (VAT-inclusive)
dailySalesVolume            1,000
variableCostPerSale          14.50
```

**Assumptions:** all defaults — `operatingDaysPerMonth 30`, `capexRecoveryPeriodMonths 60`, `cardPaymentShare 0.90`, `posCommissionRate 0.0356`, `vatRate 0.10`.

**Expected monthly values**

| Field | Expected |
| --- | --- |
| `salesVolume` | 30,000 |
| `grossCollections` | 4,200,000 |
| `vat` | 381,818.1818… |
| `netRevenue` | 3,818,181.8182… |
| `payroll` | 576,000 |
| `variableCost` | 435,000 |
| `transactionCost` | 134,568 |
| `capexRecoveryAllocation` | 166,666.6667… |
| `fixedCost` | 1,302,666.6667… |
| `totalCost` | 1,872,234.6667… |
| `operatingEarnings` | 1,945,947.15 |
| `operatingEarningsBeforeCapexRecoveryAllocation` | 2,112,613.82 |

**Expected per-sale values**

| Field | Expected |
| --- | --- |
| `netTicket` | 127.2727… |
| `vat` | 12.7273… |
| `variable` | 14.50 |
| `pos` | 4.4856 |
| `fixed` | 43.4222… |
| `estimatedTotalCost` | **75.1351** |
| `remainingProfit` | **64.8649** |

**Expected breakdown (must be in this order and sum to 140.00)**

```
vat                 12.7273
variable            14.5000
payroll             19.2000
rent                15.0000
otherOpex            3.6667
pos                  4.4856
investmentRecovery   5.5556
remainingProfit     64.8649
```

**Expected headline outputs**

| Output | Expected |
| --- | --- |
| `grossProfitMargin` | 0.88607… (88.6%) |
| `operatingProfitMargin` | 0.50965… (51.0%) |
| `payback.months` | 4.7335… |
| `payback.exceedsRecoveryPeriod` | `false` |

### 10.2 Structural invariants — `calculate.test.ts`

These catch formula errors that individual point values can miss. Assert all four:

1. The seven breakdown lines plus `remainingProfit` sum **exactly** to `averageTicket`.
2. `monthly.operatingEarnings` equals `perSale.remainingProfit × monthly.salesVolume`.
3. `monthly.operatingEarnings` equals `monthly.netRevenue − monthly.totalCost`.
4. `monthly.operatingEarningsBeforeCapexRecoveryAllocation` equals `monthly.operatingEarnings + monthly.capexRecoveryAllocation` — proving CAPEX is not double-counted.

Assert invariants 1–4 across **several** different inputs, not only the golden vector.

**Also assert the separation:** the `calculateQuick` result has **no** simulation field, and `calculate.ts` does not import `simulate.ts`.

### 10.3 Simulation — `simulate.test.ts`

Tests call `simulateQuick` directly and assert against the returned `QuickSimulationRow[]`.

| Test | Expectation |
| --- | --- |
| Return shape | `simulateQuick` returns an array of exactly 5 rows — not an object, and not part of a calculation result |
| Row count and labels | In order `-50%`, `-25%`, `current`, `+25%`, `+50%`; exactly one has `isCurrent: true` |
| Levels for base 1,000 | 500, 750, 1,000, 1,250, 1,500 |
| Golden vector rows | Cost per sale ≈ 118.5573, 89.6092, 75.1351, 66.4507, 60.6610; earnings ≈ 321,640, 1,133,794, 1,945,947, 2,758,101, 3,570,254 |
| `current` row consistency | Its `estimatedTotalCostPerSale` and `monthlyOperatingEarnings` equal the `calculateQuick` result for the same input, exactly |
| No recursion | `simulateQuick` terminates and calls `calculateQuick` exactly five times (verify by structure or a spy) |
| Rounding | Base 401 produces `Math.round`-based levels (201, 301, 401, 501, 602) |
| Duplicates tolerated | A very low base (e.g. 1) still yields 5 rows even when values repeat |
| Only volume varies | Two runs differing only in `dailySalesVolume` produce identical rent, payroll, OPEX and recovery allocation |
| Zero base | Base 0 yields 5 rows, all with `dailySales: 0` and `estimatedTotalCostPerSale: null` |
| Monotonicity | Cost per sale strictly decreases as volume rises (for a positive base) |

### 10.4 Validation — `validate.test.ts`

| Test | Expectation |
| --- | --- |
| Valid full input | `ok: true`, resolved input returned |
| Each of the 8 primary inputs missing | `required` for that field |
| Empty string, `null`, `undefined` | `required` |
| `NaN`, `Infinity`, `-Infinity`, non-numeric | `not_a_number` |
| Negative money | `below_min` |
| `averageTicket === 0` | `below_min` (strictly positive) |
| Each primary max exceeded | `above_max` |
| Secondary assumptions omitted | Defaults applied; `ok: true` |
| `operatingDaysPerMonth` 0 or 32 | `below_min` / `above_max` |
| `capexRecoveryPeriodMonths` 0 or 241 | `below_min` / `above_max` |
| `cardPaymentShare` −0.1 or 1.1 | `below_min` / `above_max` |
| `posCommissionRate` −0.01 or 0.11 | `below_min` / `above_max` |
| Multiple invalid fields | **All** errors returned together |
| `variableCostPerSale > netAverageTicket` | **Valid** — no error |
| `initialCapex === 0`, `dailySalesVolume === 0` | Valid |
| Fractional `employeeCount` (9.5) | Valid |
| Never throws | No input causes an exception |

### 10.5 Edge cases and guards — `edgeCases.test.ts`

Table-driven, from the product spec's edge-case table:

| Condition | Expectation |
| --- | --- |
| `dailySalesVolume === 0` | `perSale` and `breakdownPerSale` are `null`; both margins `null`; monthly costs still computed; `operatingEarnings` equals negative `monthlyFixedCost` |
| `monthlyNetRevenue === 0` | Both margins `null`, not `0` |
| Before-allocation earnings ≤ 0 with positive CAPEX | `payback` unavailable with reason `non_positive_earnings_before_recovery` |
| `initialCapex === 0` | `capexRecoveryAllocation` is `0`; `payback.months` is `0` |
| `initialCapex === 0` **and** earnings negative | `payback.months` is `0` — the CAPEX guard is evaluated first |
| Payback exceeding the recovery period | `exceedsRecoveryPeriod: true`, and a number is still returned |
| `variableCostPerSale > netAverageTicket` | Computes normally; earnings negative; no throw |
| **No `NaN` or `Infinity`** | Across a spread of inputs (zeros, maxima, minima, fractional values), every numeric field in the result is finite |
| **Never throws** | No valid input causes an exception |
| Determinism | Two calls with equal input produce deeply equal results |
| **Drift guard** | The serialised `calculateQuick` result contains no key or string matching `breakEven`, `contribution`, `netProfit`, `depreciation`, `waste`, `provenance`, or `volumeSimulation` |

The drift guard is deliberate: it fails loudly if a removed concept is reintroduced.

---

## 11. Dependency and tooling changes

### 11.1 Dependencies

**Zero runtime dependencies.** Dev-only:

| Package | Why |
| --- | --- |
| `typescript` | The language |
| `vitest` | Approved test runner (architecture D3). It pulls Vite transitively, which is unavoidable and harmless since Vite is the approved build tool |
| `eslint` | Base linter |
| `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` | TypeScript support for ESLint |
| `eslint-plugin-import` | Supplies the `import/no-cycle` rule |

**Do not install** React, React DOM, Tailwind, daisyUI, the Vite React plugin, a router, a chart library, an i18n library, a state-management library, or a form library. Those belong to the later UI phase.

### 11.2 `package.json` scripts

```
test       — vitest
test:run   — vitest run
typecheck  — tsc --noEmit
lint       — eslint .
```

### 11.3 `tsconfig.json`

Strict configuration, type-check only:

- `strict: true`
- `noUncheckedIndexedAccess: true` (the breakdown lines are an array)
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `noEmit: true`
- Modern target and module settings appropriate for a Vite/Vitest project
- Include `src/**/*`

### 11.4 `eslint.config.js`

Keep enforcement **lightweight** — these two rules only:

1. `import/no-cycle` as an error, project-wide.
2. For files under `src/core/**`, `no-restricted-imports` banning `react`, `react-dom`, and any path containing `features/`, `components/` or `data/`.

Do not add dependency-graph tooling, a boundaries framework, or custom architecture checks.

---

## 12. Explicit exclusions

**Do not create, install, scaffold, stub or reference any of the following in this phase.**

React · frontend screens · visual design · daisyUI · Tailwind UI work · router · charting · Detailed Feasibility engine · `localStorage` · JSON import/export · URL sharing · auth · database · Cloudflare backend services · benchmark data · plausibility warnings · provenance infrastructure · service or repository layers · dependency injection · generic engine interfaces · state management · form frameworks · i18n libraries · presentation formatting helpers · unnecessary abstractions.

**Spec-level exclusions most likely to be added by accident — do not add them:**

- **Waste adjustment** in the variable-cost path. There is no waste concept.
- **Break-even** in any form, public or internal.
- **Contribution per sale or contribution margin.**
- **A third margin**, or a margin named `netProfitMargin`.
- **The word `depreciation`** in any identifier, type, comment or string.
- **A sixth simulation level**, or configurable levels.
- **VAT stripped from any cost input.**
- **Rounding inside the engine.**
- **A `volumeSimulation` field inside `QuickCalculationResult`**, or any call to `simulateQuick` from `calculateQuick` (§8.0).
- **An orchestration, façade or service function** that combines calculation and simulation — the frontend composes them itself.

If you believe something on this list is genuinely required, **stop and report it** rather than implementing it.

---

## 13. Definition of done

The phase is complete when **all** of the following hold:

1. Exactly the 16 files in §3 exist. No extra files, no stubs for excluded features.
2. `npm run typecheck` passes with zero errors under strict mode.
3. `npm run lint` passes with zero errors, including `import/no-cycle`.
4. `npm run test:run` passes with every test green.
5. The golden vector matches every value in §10.1 within tolerance.
6. All four structural invariants in §10.2 hold across multiple inputs.
7. All validation cases in §10.4 behave as specified, and `validate` never throws.
8. All edge cases in §10.5 behave as specified; no result field is ever `NaN` or `Infinity`; the engine never throws.
9. The drift guard passes — no `breakEven`, `contribution`, `netProfit`, `depreciation`, `waste`, `provenance` or `volumeSimulation` anywhere in the result.
10. No file under `src/core/` imports React, `features/`, `components/` or `data/`.
11. `package.json` has **zero runtime dependencies**.
12. The three planning documents are unmodified.
13. Every formula appears exactly once in the codebase.
14. **`calculateQuick` and `simulateQuick` are separate (§8.0):** `QuickCalculationResult` has no simulation field, `calculate.ts` does not import `simulate.ts`, `simulateQuick` returns `QuickSimulationRow[]`, and no orchestration layer combines them.

---

## 14. Step-by-step execution checklist for Grok 4.6 High

Work through this in order. Do not skip a verification.

**Stage 1 — Bootstrap**

- [ ] Read `docs/quick-calculation-scope-v1.md` sections §5, §6, §8–§12, §16 and §19 before writing anything.
- [ ] Create `package.json` with the dev dependencies in §11.1 and the scripts in §11.2. No runtime dependencies.
- [ ] Create `tsconfig.json` per §11.3, `vitest.config.ts`, `eslint.config.js` per §11.4, and `.gitignore`.
- [ ] Install dependencies.
- [ ] **Verify:** `npm run typecheck` and `npm run test` both execute without error.

**Stage 2 — Contract**

- [ ] Create `src/core/quick/types.ts` per §9 — raw input, resolved input, `CostLine`, `SimulationLabel`, validation error, `Unavailable`, `QuickCalculationResult` (no simulation field), `QuickSimulationRow`.
- [ ] Create `src/core/quick/defaults.ts` — `operatingDaysPerMonth 30`, `capexRecoveryPeriodMonths 60`, `cardPaymentShare 0.90`, `posCommissionRate 0.0356`, `vatRate 0.10`, `currency 'TRY'`, `quickEngineVersion '1.0.0'`.
- [ ] Create `src/core/quick/limits.ts` — the ranges in §7.3 and §7.4.
- [ ] **Verify:** `npm run typecheck` clean. Confirm no default value is written down anywhere else.

**Stage 3 — Validation**

- [ ] Create `src/core/quick/validate.ts` per §7. Collect all errors; never throw; apply secondary defaults; no message strings.
- [ ] Create `src/core/quick/validate.test.ts` covering every row of §10.4.
- [ ] **Verify:** all validation tests green.

**Stage 4 — Calculation (critical checkpoint)**

- [ ] Create `src/core/quick/calculate.ts` exporting `calculateQuick`, transcribing §6.1 → §6.11 in that order. It calculates one case only and must not import or reference simulation.
- [ ] Create `src/core/quick/calculate.test.ts` with the golden vector (§10.1) and the four invariants (§10.2).
- [ ] **Verify:** every golden-vector value matches within tolerance and all invariants hold. **If any value is off, fix it before continuing — do not build on a wrong engine.**

**Stage 5 — Simulation**

- [ ] Create `src/core/quick/simulate.ts` exporting `simulateQuick` per §8 — generate the five levels, call `calculateQuick` once per level, return `QuickSimulationRow[]`. Duplicate no formula.
- [ ] Create `src/core/quick/simulate.test.ts` covering every row of §10.3.
- [ ] **Verify:** simulation tests green; the `current` row matches the `calculateQuick` result exactly; nothing calls `simulateQuick` from inside `calculateQuick`.

**Stage 6 — Edge cases**

- [ ] Create `src/core/quick/edgeCases.test.ts` covering every row of §10.5, including the no-`NaN`/no-`Infinity` sweep and the drift guard.
- [ ] **Verify:** all edge-case tests green.

**Stage 7 — Public surface**

- [ ] Create `src/core/quick/index.ts` exporting exactly the surface in §9.1 — both `calculateQuick` and `simulateQuick`, plus defaults, limits and public types. No wrapper that combines the two functions.
- [ ] **Verify:** `npm run typecheck` clean.

**Stage 8 — Final check**

- [ ] Run `npm run test:run`, `npm run typecheck`, `npm run lint` — all clean.
- [ ] Walk the §13 definition-of-done list and confirm every item.
- [ ] Confirm no file on the §12 exclusion list was created.
- [ ] Confirm the three planning documents are unmodified.
- [ ] Report: files created, test counts, and anything you had to interpret.

**If anything is ambiguous, stop and ask rather than guessing.** Every formula, limit and expected value you need is in this document or in the product spec.

---

## 15. Blockers

**No genuine blocker remains.** Every previously open clarification is resolved:

| Item | Resolution |
| --- | --- |
| C1 — secondary assumption limits | Specified in §7.4 |
| C2 — provenance and assumption sources | Removed from this phase entirely (§2.2) |
| C3 — warnings placement and copy | Warnings deferred; no benchmark data (§2.2) |
| C4 — currency location | In `defaults.ts` as part of the engine meta (§14, Stage 2) |
| C5 — simulation rounding and zero volume | Specified in §8.2 and §8.3 |

The scope, formulas, limits, guards, contract, tests and tooling are fully specified. Implementation may begin.

---

## 16. Changelog

| Version | Change |
| --- | --- |
| v1.0 | Initial implementation plan for the Quick Calculation core: 16 files, 8-stage sequence, full formula mapping to product spec v1.4, validation and simulation behaviour, public result contract, test plan with golden vector and invariants, dev-only dependencies, explicit exclusions, definition of done, and an execution checklist for Grok 4.6 High |
| v1.1 | Structural correction only — no financial formula changed. Locked `calculateQuick` (one case, no simulation) and `simulateQuick` (five rows, may call `calculateQuick`) as two separate one-way functions (§8.0); removed `volumeSimulation` from `QuickCalculationResult` and defined `QuickSimulationRow[]` as its own return type (§9); documented the exact public API surface and banned any combining orchestration layer (§9.1); updated simulation tests, exclusions, definition of done and the execution checklist to match |
