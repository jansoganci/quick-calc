# Quick Calculation Module — Product & Financial Scope

**Version:** v1.4 (final approved decisions applied)
**Phase:** Financial Model Definition — **not** Implementation
**Currency:** TRY · **Country:** Turkey · **Preset:** Coffee Shop / Cafe
**Status of this document:** Financial model definition **complete**. All decisions in §24.1 are approved and locked; **no blocking open decisions remain** (§24.2).

---

## 0. How to read this document

| This document IS | This document is NOT |
| --- | --- |
| A definition of Quick Calculation inputs, formulas, outputs and boundaries | An instruction to build UI, backend, or engine code |
| A record of locked decisions and the few remaining open ones | A design for the Detailed Feasibility engine |
| A single source of truth for Quick Calculation terminology | A benchmark dataset (that is a separate document) |

**Nothing in this document may be implemented until implementation is explicitly requested.**

Type definitions and formulas below are written in code-like form **for precision only**. They are a contract description, not code to ship.

Decisions marked **LOCKED** are approved product decisions. They are not to be reopened, re-optimised or re-proposed.

---

## 1. Purpose

Define the Quick Calculation module before development begins:

1. What it does.
2. Which inputs it accepts.
3. Which assumptions it uses.
4. Which outputs it produces, and exactly how each is calculated.
5. What is intentionally excluded.
6. Where its boundary with the future Detailed Feasibility module lies.

---

## 2. Product context

The product is a **financial feasibility and operating-cost simulator for food & beverage businesses**.

Initial focus: coffee shops and cafes.
Future categories: restaurants, buffets/kiosks, bakeries, fast food, other food-service formats.

Two calculation experiences will exist, each with **its own calculation logic**:

### 2.1 Quick Calculation (this document)

- **Audience:** consumers, curious users, anyone running a fast business sanity check or quickly judging whether a business looks expensive or profitable.
- **Characteristics:** a deliberately small set of inputs, simple and **approximate / directional** output, immediate result, no scenario configuration.
- **Explicit non-goals:** it does not attempt to reconstruct missing detailed financial data, it does not benchmark-fill missing required financial inputs, and it does not need to reproduce the Detailed Feasibility result.

### 2.2 Detailed Feasibility (future, out of scope here)

- **Audience:** real investors and business owners.
- **Characteristics:** detailed OPEX and CAPEX, payroll breakdown, regulatory costs, taxation, product economics, P&L, break-even, scenarios and simulations.
- **Its financial model will be designed separately, in its own document.** Nothing in this document constrains it.

---

## 3. Core architectural principle — two separate calculation engines **[LOCKED]**

**Quick Calculation and Detailed Feasibility are two separate calculation logics.** There is no shared financial engine, and Quick Calculation is **not** a wrapper around the Detailed Feasibility engine.

```
Quick Calculation Input   (8 required user inputs + secondary assumptions)
        ↓
calculateQuick(input)     ← the Quick engine: its own simple, self-contained logic
        ↓
Quick Calculation Results (approved output set + advisory warnings)
        ↓
Presentation Layer        (rounding, labels, formatting, charts)
```

Detailed Feasibility will later have its own separate input model, its own formulas and its own result model.

### 3.1 What the two engines may and may not share

| Allowed | Not allowed |
| --- | --- |
| Generic utility functions where technically useful (safe division, percentage helpers, money formatting, validation primitives) | A shared financial engine or shared business formulas |
| Shared presentation components and formatting | Quick Calculation implemented as a call into the Detailed engine |
| Shared benchmark/comparison data used for context only | Quick Calculation building a "complete detailed financial input" to hand off |
| Shared TypeScript primitives (e.g. a money type) | A requirement that the two engines produce matching results |

The two engines are permitted to disagree. Quick Calculation is **directional**; Detailed Feasibility is authoritative. Where they differ, the UI must be clear about which mode produced a number.

### 3.2 Engine purity rules

The Quick engine must be:

- **deterministic** — same input object produces byte-identical output;
- free of UI dependency;
- free of `localStorage` dependency;
- free of React state;
- free of scenario state;
- free of clock, randomness and locale dependence.

| Layer | May depend on | Must never depend on |
| --- | --- | --- |
| Quick engine | Pure math, its own input type | React, UI, localStorage, network, `Date.now()`, randomness, locale, sector presets |
| Benchmark / comparison data | Nothing (pure data) | Formulas of any kind |
| Presentation layer | Quick engine results | Recomputing or adjusting any financial value |

**Rule:** no Quick Calculation formula may live outside the Quick engine, and no country- or sector-specific number may be hard-coded inside it.

### 3.3 Planned module boundary (proposal, not to be created yet)

```
core/finance/quick/       Quick engine, its types and formulas
core/finance/shared/      generic utilities only — no business formulas
data/benchmarks/tr/       Turkey / coffee-shop comparison data (pure JSON)
features/quick-calc/      form, result screen, view models
components/               shared, reusable UI primitives
```

`core/finance/detailed/` will be added later as a sibling, not as a parent.

---

## 4. Result philosophy — what the module must answer **[LOCKED]**

Quick Calculation answers a few simple questions:

1. What does one average sale really cost?
2. Where does the customer's money go?
3. Roughly how much does the business make per month?
4. What is the approximate profit margin?
5. How long would the initial investment take to pay back?
6. How does unit cost change if daily sales volume goes up or down?

**Central concept:** fixed costs are distributed across sales volume. There is therefore **no single universal "cost of one coffee"** — the cost per sale changes with volume.

**Rules:**

- **Quick Calculation is not a P&L dashboard.** Do not expose unnecessary accounting or finance terminology.
- The result must remain readable in a few seconds (§14.2).
- Quick Calculation calculates from the information the user actually provides. It must not pretend to know detailed business economics that were never entered, and it must not silently fabricate core financial inputs.

---

## 5. Conventions

### 5.1 VAT convention **[LOCKED]**

- Turkey F&B VAT assumption: **10%**.
- This is a **system assumption**, not a primary user input, and is **not exposed** as one of the main Quick Calculation inputs.
- **The user-entered `averageTicket` is already VAT-inclusive** — it is what the customer pays in total.

Fixed convention, no flag required:

```
vatRate          = 0.10                            (system assumption)
grossTicket      = averageTicket                   (as entered — customer pays this)
netAverageTicket = averageTicket / (1 + vatRate)
vatPerSale       = averageTicket − netAverageTicket
```

Worked illustration — user enters `averageTicket = 100 TRY`:

```
Gross customer payment = 100.00 TRY
Net revenue            = 100 / 1.10 = 90.91 TRY
VAT component          = 9.09 TRY
```

**Never** compute `100 + 10% = 110`. The entered price is the gross price.

#### Cost inputs are NOT VAT-adjusted **[LOCKED]**

Cost inputs (`monthlyRent`, `averageEmployeeMonthlyCost`, `otherMonthlyOpex`, `initialCapex`, `variableCostPerSale`) are used **exactly as the user entered them**. No 10% is stripped from any cost.

Accepted consequence, to be stated in the UI as an assumption: input VAT and detailed VAT accounting are outside this simplified model. Revenue is net of VAT while costs are taken as entered, so the resulting earnings figure is a **simplified, slightly conservative** number rather than a full VAT-accounted result. Detailed VAT accounting belongs to the future Detailed Feasibility model. Do not adjust cost inputs for VAT unless that is explicitly decided later.

### 5.2 Other conventions

| Convention | Rule |
| --- | --- |
| Currency | TRY only in v1. Single-currency, no FX. |
| Rounding | **No rounding inside the calculation logic.** Rounding happens only in the presentation layer. Money to 2 decimals (large monthly figures may be abbreviated, e.g. `+110K TRY`), per-sale costs to 2 decimals, percentages to 1 decimal, sales counts to whole numbers. |
| Time basis | One calendar month is the base period. `operatingDaysPerMonth` default `30`, editable. |
| Employees | `employeeCount` is employees / FTE and may be fractional (e.g. `9.5`). |
| Determinism | Same input object → byte-identical output. |
| Required inputs | All 8 primary inputs are **required**. An empty primary field is a validation error, never a benchmark lookup and never an implicit `0`. A user may deliberately enter `0` where that is real (e.g. `initialCapex = 0`). |

---

## 6. Inputs

### 6.1 The 8 primary required inputs **[LOCKED — do not expand without explicit approval]**

These 8 fields are the main Quick Calculation form. All are required and all are user-supplied.

**Costs**

| # | Field | Unit | Valid range |
| --- | --- | --- | --- |
| 1 | `monthlyRent` | TRY / month | 0 … 50,000,000 |
| 2 | `employeeCount` | employees / FTE | 0 … 500 |
| 3 | `averageEmployeeMonthlyCost` | TRY / month / employee | 0 … 1,000,000 |
| 4 | `otherMonthlyOpex` | TRY / month | 0 … 50,000,000 |
| 5 | `initialCapex` | TRY | 0 … 500,000,000 |

**Sales**

| # | Field | Unit | Valid range |
| --- | --- | --- | --- |
| 6 | `averageTicket` | TRY / sale (VAT-inclusive) | > 0 … 100,000 |
| 7 | `dailySalesVolume` | sales / operating day | 0 … 100,000 |
| 8 | `variableCostPerSale` | TRY / sale | 0 … 100,000 |

**No additional inputs are required for any output in this document, including the volume simulation (§12).**

### 6.2 Notes per primary input

**1. `monthlyRent`** — Monthly rent for the premises. Example: `450,000 TRY`. Rent withholding and rent escalation are out of scope (§21).

**2. `employeeCount` / 3. `averageEmployeeMonthlyCost`** — `averageEmployeeMonthlyCost` is the **average total monthly employer cost per employee**, kept **consolidated** in Quick Calculation. No SGK or payroll breakdown here; the user enters one blended figure. Example: `12 × 48,000 TRY`.

**4. `otherMonthlyOpex`** — Consolidated monthly OPEX **excluding rent and payroll**: energy, utilities, accounting, software, cleaning, maintenance and miscellaneous operating expenses. Example: `110,000 TRY`. No detailed OPEX breakdown in Quick Calculation. The UI should list what this covers so the user neither double-counts rent/payroll nor omits major items.

**5. `initialCapex`** — Initial investment amount: renovation, coffee equipment, kitchen equipment, furniture, POS hardware, signage, HVAC/ventilation, deposits, opening costs. Example: `10,000,000 TRY`.

**6. `averageTicket`** — Average customer/order transaction amount, **VAT-inclusive** (§5.1). Preferred over "coffee selling price" because a cafe also sells food, desserts and multi-item orders. Example: `140 TRY`.

**7. `dailySalesVolume`** — Average transactions / orders per **operating** day. One of the most sensitive inputs, because fixed-cost allocation depends directly on it, and the only input varied by the volume simulation (§12). Example: `1,000`.

**8. `variableCostPerSale`** — Consolidated direct variable cost of one average sale: coffee, milk, food ingredients, cup, lid, packaging. Accepted as **one amount**. Example: `14.50 TRY`.

**Used exactly as the user entered it [LOCKED]:**

- **no waste adjustment**,
- **no input VAT adjustment**,
- **no recipe-level costing**.

Whatever the user types is the direct variable cost of one average completed sale. Waste modelling and recipe costing belong to Detailed Feasibility (§21).

### 6.3 Secondary assumptions — defaults, editable **[LOCKED]**

Not part of the 8 primary required inputs. Each has a sensible default and is editable by the user. They are presented as adjustable assumptions, not as questions the user must answer to get a result.

| Field | Unit | Default | Editable | Default source |
| --- | --- | --- | --- | --- |
| `operatingDaysPerMonth` | days | `30` | Yes | Product decision |
| `capexRecoveryPeriodMonths` | months | `60` | Yes | Product decision |
| `posCommissionRate` | ratio | **`0.0356` (3.56%)** | Yes | Approved Turkey market assumption |
| `cardPaymentShare` | ratio | **`0.90` (90%)** | Yes | Approved Turkey market assumption |

**`operatingDaysPerMonth`** — Default `30`. Simple and explainable; editable for businesses that close one or two days a week.

**`capexRecoveryPeriodMonths`** — Default `60` months. Its purpose is simply to allocate the initial investment across a **user-selected economic recovery period** for this simplified feasibility calculation. See §6.5 and §8.6.

**`posCommissionRate` — default `3.56%` [LOCKED]** — The commission rate charged on a card transaction. Editable by the user.

**`cardPaymentShare` — default `0.90` [LOCKED]** — The share of sales collected by card rather than cash. Editable by the user.

> **These two are different things and must never be conflated.**
> `posCommissionRate` (3.56%) is *how much the payment provider charges on a card transaction*.
> `cardPaymentShare` is *what proportion of sales are paid by card at all*.
> Labels, tooltips and field names must keep them visibly distinct, because multiplying the wrong pair silently misstates the POS cost.

### 6.4 System assumption

| Field | Value | Exposed as a main input? |
| --- | --- | --- |
| `vatRate` | `0.10` | No — system assumption (§5.1) |

### 6.5 CAPEX terminology rule **[LOCKED]**

The monthly allocation of `initialCapex` must **never** be called statutory depreciation or accounting depreciation, in code, copy, labels or charts.

Approved terminology:

- **Monthly Investment Recovery Allocation**
- **CAPEX Recovery Allocation**
- **Aylık Yatırım Geri Kazanım Payı** (Turkish)

Field naming follows the same rule: `capexRecoveryPeriodMonths` and `monthlyCapexRecoveryAllocation`. The terms `useful life` and `depreciation` are retired from this module.

---

## 7. Benchmarks — context only, never completion **[LOCKED]**

Quick Calculation does **not** depend on a benchmark / default completion layer, and does not build a complete detailed financial input object. The Quick engine works directly from its own intentionally limited input model.

**Benchmarks must not silently fabricate any of the 8 core inputs.** If the user has not provided a required input, the answer is a validation prompt, not a guess.

Benchmark infrastructure may still exist conceptually, for:

| Permitted benchmark use | Example |
| --- | --- |
| Contextual market comparison | "Your rent looks high compared with similar cafes." |
| Plausibility warnings (advisory only, §17) | "Your payroll / revenue ratio looks unusual." |
| Defaults for **selected secondary assumptions** only (§6.3) | Current card payment share; current POS commission assumption |

The benchmark dataset itself — values, ranges and sourcing methodology — belongs in a separate document and is not defined here.

### 7.1 Assumption transparency

The result must report which secondary assumptions were used and whether each was the default or user-edited:

```
source: 'user' | 'default'
```

This applies only to the secondary assumptions and the VAT system assumption. The 8 primary inputs are always `'user'` by definition, so no provenance tracking is needed for them.

---

## 8. Formula reference (canonical)

Evaluation order matters; each step may only use values defined above it.

**Basis reminder:** revenue is **net of VAT**; costs are **as entered** (§5.1). POS commission is charged on the **gross** amount collected.

### 8.1 Monthly sales volume

```
monthlySalesVolume = dailySalesVolume × operatingDaysPerMonth
```

### 8.2 Revenue and VAT

```
netAverageTicket        = averageTicket / (1 + vatRate)
vatPerSale              = averageTicket − netAverageTicket
monthlyGrossCollections = monthlySalesVolume × averageTicket
monthlyNetRevenue       = monthlySalesVolume × netAverageTicket
monthlyVat              = monthlyGrossCollections − monthlyNetRevenue
```

`monthlyNetRevenue` is the revenue figure used by every downstream calculation.

### 8.3 Monthly payroll

```
monthlyPayroll = employeeCount × averageEmployeeMonthlyCost
```

### 8.4 Monthly variable cost

```
monthlyVariableCost = monthlySalesVolume × variableCostPerSale
```

`variableCostPerSale` is used **exactly as entered** — no waste adjustment, no input VAT adjustment, no recipe-level costing (§6.2).

### 8.5 Transaction cost (POS / payment)

POS commission applies to the gross amount actually collected by card. `averageTicket` is already gross, so no conversion is needed.

```
posCostPerSale         = averageTicket × cardPaymentShare × posCommissionRate
monthlyTransactionCost = monthlySalesVolume × posCostPerSale
```

### 8.6 Monthly CAPEX recovery allocation **[LOCKED]**

```
monthlyCapexRecoveryAllocation = initialCapex / capexRecoveryPeriodMonths
```

Default `capexRecoveryPeriodMonths = 60`, editable by the user (§6.3). This is a **simplified economic allocation, not statutory depreciation** (§6.5).

It is charged as a cost inside monthly operating earnings (§10.1). Investment payback is kept separate from it and adds it back, so CAPEX is never counted twice (§11).

### 8.7 Monthly fixed cost

```
monthlyFixedCost = monthlyRent + monthlyPayroll + otherMonthlyOpex
                 + monthlyCapexRecoveryAllocation
```

This single definition includes the recovery allocation, which is what makes the headline cost per sale (§9.1) and the breakdown (§9.2) reconcile. The recovery-excluding variant still exists internally for the payback calculation only (§13).

### 8.8 Monthly total cost

```
monthlyTotalCost = monthlyFixedCost + monthlyVariableCost + monthlyTransactionCost
```

---

## 9. Primary outputs — per sale **[LOCKED]**

### 9.1 Estimated Total Cost Per Sale — the headline result

```
fixedCostPerSale           = monthlyFixedCost / monthlySalesVolume
estimatedTotalCostPerSale  = vatPerSale
                           + variableCostPerSale
                           + posCostPerSale
                           + fixedCostPerSale
```

Presented as:

```
Estimated total cost per sale: 124 TRY
```

This is the **main headline result**. It represents the simplified full economic cost of one average transaction under the current assumptions.

**The VAT component is included**, so the headline reconciles exactly with the breakdown below:

```
estimatedTotalCostPerSale = averageTicket − remainingProfitPerSale
```

This is a deliberate change from earlier drafts, where the equivalent figure excluded VAT. Including it is what makes the two primary outputs consistent with each other — the seven cost categories in §9.2 sum to precisely this number. (Confirmation item, §24 OPEN-1.)

### 9.2 Cost Breakdown Per Sale — where the customer's money goes

A simple breakdown of the average customer payment. **Approved categories, in this order:**

| # | Category | Formula (per sale) |
| --- | --- | --- |
| 1 | VAT | `vatPerSale` |
| 2 | Direct / Variable Product Cost | `variableCostPerSale` |
| 3 | Payroll Allocation | `monthlyPayroll / monthlySalesVolume` |
| 4 | Rent Allocation | `monthlyRent / monthlySalesVolume` |
| 5 | Other OPEX Allocation | `otherMonthlyOpex / monthlySalesVolume` |
| 6 | POS / Payment Cost | `posCostPerSale` |
| 7 | Investment Recovery Allocation | `monthlyCapexRecoveryAllocation / monthlySalesVolume` |
| 8 | **Remaining Profit** | `averageTicket − sum(1…7)` |

Illustrative structure only:

```
180 TRY average sale
VAT                         16 TRY
Product cost                32 TRY
Payroll                     28 TRY
Rent                        21 TRY
Other operating costs       11 TRY
POS                          3 TRY
Investment recovery         12 TRY
Remaining profit            57 TRY
```

Categories 1–8 always sum to `averageTicket`, which makes a single stacked bar the natural visualisation.

**Rules:**

- This breakdown is one of the two main product outputs and must remain easy to understand.
- **Do not split OPEX, payroll, tax, or product costs into more detailed categories** in Quick Calculation.
- Display TRY amounts. A category's share may be conveyed visually (bar width) but a per-category percentage must never be labelled "margin" — the only margins in Quick Calculation are the two defined in §10.2.

---

## 10. Secondary outputs — monthly **[LOCKED]**

### 10.1 Estimated Monthly Operating Earnings **[LOCKED]**

One simplified monthly earnings figure. It **includes the monthly CAPEX recovery allocation as a cost**:

```
monthlyOperatingEarnings = monthlyNetRevenue − monthlyTotalCost
```

where `monthlyTotalCost` contains `monthlyCapexRecoveryAllocation` via `monthlyFixedCost` (§8.7, §8.8).

Equivalently, and by construction identical to the breakdown:

```
monthlyOperatingEarnings = remainingProfitPerSale × monthlySalesVolume
```

Approved user-facing labels:

- **Estimated Monthly Operating Earnings**
- **Estimated Monthly Business Profit**
- **Tahmini Aylık İşletme Kazancı**

**Forbidden labels:** "money the owner takes home", "owner income", "net profit".

#### Mandatory limitation statement

This figure must be accompanied by a clear statement that Quick Calculation **does not include**:

- corporate taxes,
- income tax,
- financing costs and loan repayments,
- owner salary, drawings or dividends,
- other detailed financial obligations.

It is a simplified operating estimate, not a net result and not owner take-home income. It also does not include the owner's own labour unless the owner was counted in `employeeCount`.

### 10.2 Margins — two, and only two **[LOCKED]**

**Gross Profit Margin**

```
grossProfitMargin = (monthlyNetRevenue − monthlyVariableCost) / monthlyNetRevenue
```

Equivalently per sale: `(netAverageTicket − variableCostPerSale) / netAverageTicket`.

It deducts **only the direct variable product cost**. Nothing else — no POS cost, no payroll, no rent, no recovery allocation.

**Operating Profit Margin**

```
operatingProfitMargin = monthlyOperatingEarnings / monthlyNetRevenue
```

Presented as:

```
Gross profit margin:      68.0%
Operating profit margin:  11.8%
```

**Rules:**

- Both denominators are net revenue (VAT excluded), and the labels must make that clear.
- **The second margin must never be called "Net Profit Margin"**, because Quick Calculation does not include corporate tax, financing, owner distributions, or other full net-profit items (§10.1).
- These are the only two margins on the result surface. Contribution margin and any other internal ratio stay internal (§13).
- **Gross Profit Margin is not Contribution Margin.** Gross deducts variable product cost only; contribution also deducts the POS cost. Contribution stays internal, so the two must not be presented as alternatives to each other.

---

## 11. Secondary output — Estimated Investment Payback **[LOCKED]**

```
Estimated investment payback: 26 months
```

A simplified payback estimate based on current operating assumptions. It must be described as:

- approximate,
- **undiscounted**,
- based on current monthly performance remaining constant,
- excluding financing and detailed tax effects.

### 11.1 Formula **[LOCKED]**

**Payback is kept separate from the CAPEX recovery allocation.** The investment cannot be both charged as a monthly cost and repaid out of earnings measured after that charge, so the denominator adds the allocation back — an internal value only (§13):

```
monthlyOperatingEarningsBeforeCapexRecoveryAllocation
    = monthlyOperatingEarnings + monthlyCapexRecoveryAllocation

paybackMonths
    = initialCapex / monthlyOperatingEarningsBeforeCapexRecoveryAllocation
```

**CAPEX must never be double-counted.** The recovery allocation belongs to the earnings figure (§10.1); the raw `initialCapex` belongs to the payback numerator. Neither appears twice.

### 11.2 When payback cannot be shown

Show a clear message instead of a number:

```
At this sales level, the investment does not currently pay itself back.
```

Guards:

- `initialCapex == 0` → `paybackMonths = 0` (nothing to pay back).
- `monthlyOperatingEarningsBeforeCapexRecoveryAllocation <= 0` → the message above.

The gate is on the **before-allocation** figure, because keeping payback separate from the recovery allocation (§11.1) means the recovery allocation cannot decide whether payback exists. In the narrow band where displayed earnings are zero or negative but the before-allocation figure is still positive, the business does recover its investment — just more slowly than the chosen recovery period — so the payback number is shown together with a note that it exceeds that period. Claiming "does not pay itself back" there would be false.

**Never expose** NPV, IRR, discounted cash flow, or financing calculations in Quick Calculation.

---

## 12. Supporting analysis — Simple Sales Volume Simulation **[LOCKED]**

A very simple volume simulation showing how fixed-cost allocation changes when sales volume changes.

### 12.1 No new inputs

**The user is never asked for additional scenario inputs.** The simulation is generated automatically from the values already entered.

The system varies **only**:

```
dailySalesVolume
```

Everything else is held **unchanged**: rent, employee count, employee cost, other OPEX, CAPEX, average ticket, variable cost per sale, operating days, and the POS assumptions.

### 12.2 Approved simulation levels

Five levels, relative to the user's entered daily sales volume:

| Level | Multiplier |
| --- | --- |
| −50% | `0.50 ×` |
| −25% | `0.75 ×` |
| **Current** | `1.00 ×` |
| +25% | `1.25 ×` |
| +50% | `1.50 ×` |

Example — user enters `dailySalesVolume = 400`:

```
200 sales/day
300 sales/day
400 sales/day  ← current
500 sales/day
600 sales/day
```

The current row is always marked. No break-even row and no additional levels.

### 12.3 Table shape

Three columns only:

| Daily Sales | Estimated Cost / Sale | Estimated Monthly Earnings |
| --- | --- | --- |
| 200 | 185 TRY | −240K TRY |
| 300 | 145 TRY | −70K TRY |
| 400 | 124 TRY | +110K TRY |
| 500 | 111 TRY | +290K TRY |
| 600 | 102 TRY | +470K TRY |

Values illustrative only. Both columns are re-derived per level using §9.1 and §10.1 with only `dailySalesVolume` changed.

### 12.4 Mandatory simulation assumption

A short visible caveat must accompany the table:

```
Assumes rent, staffing and other fixed operating costs remain unchanged
as sales volume changes.
```

**Do not** automatically add employees, increase rent, expand capacity, or modify OPEX when volume increases. Those belong to Detailed Feasibility.

### 12.5 Boundary

This is **not a full Scenario Engine** — it is a simple one-variable sensitivity view inside Quick Calculation. It creates no shared abstraction with, and places no constraint on, the future Detailed Feasibility simulation engine (§22).

---

## 13. Internal values — computed but not surfaced

These may exist internally where useful for formulas, validation or warnings. **They must not appear on the Quick result screen** and must not be turned into user-facing KPIs.

| Internal value | Why it exists |
| --- | --- |
| `monthlyOperatingEarningsBeforeCapexRecoveryAllocation` | Payback denominator (§11.1) |
| `contributionPerSale` = `netAverageTicket − variableCostPerSale − posCostPerSale` | Break-even math and the negative-contribution edge case (§16). Not to be confused with Gross Profit Margin (§10.2). |
| `contributionMargin` | Diagnostic only |
| Break-even monthly / daily sales, on both a running-cost and an investment-recovery basis | Plausibility checks and internal validation. **Break-even is not shown in Quick Calculation v1 [LOCKED]** — the result surface stays simpler, and the volume simulation (§12) conveys the same intuition. |
| `monthlyGrossCollections`, `monthlyVat`, `monthlyNetRevenue`, `monthlyFixedCost`, `monthlyVariableCost`, `monthlyTransactionCost`, `monthlyTotalCost` | Intermediate steps feeding the approved outputs |
| Cash-basis operating earnings and margin | Feed payback; never shown alongside §10 as a second KPI |

### 13.1 Explicitly excluded from the Quick result surface **[LOCKED]**

Cash Operating Profit vs. Economic Profit as two separate KPIs · Contribution Margin · Contribution Per Sale · Cash Break-Even vs. Economic Break-Even · EBITDA · EBIT · NPV · IRR · detailed P&L · detailed tax reconciliation · detailed payroll breakdown · detailed OPEX categories · Scenario A / B / C configuration.

These may belong to Detailed Feasibility later.

---

## 14. Approved output set and result hierarchy **[LOCKED]**

### 14.1 The complete Quick output set

| Tier | # | Output | Source |
| --- | --- | --- | --- |
| **Primary** | 1 | Estimated Total Cost Per Sale | §9.1 |
| | 2 | Cost Breakdown Per Sale (8 categories) | §9.2 |
| **Secondary** | 3 | Estimated Monthly Operating Earnings | §10.1 |
| | 4 | Gross Profit Margin | §10.2 |
| | 5 | Operating Profit Margin | §10.2 |
| | 6 | Estimated Investment Payback | §11 |
| **Supporting** | 7 | Simple Sales Volume Simulation (5 levels) | §12 |
| **Meta** | — | Secondary assumptions used (default vs. user-edited) | §7.1 |
| | — | Plausibility warnings (advisory only) | §17 |
| | — | Limitation statement for earnings | §10.1 |
| | — | Simulation caveat | §12.4 |

**That is the entire result surface.** Nothing else is displayed.

### 14.2 Rules

- **No large KPI dashboard.** Do not expose every engine result.
- The Quick result experience must remain readable in a few seconds.
- Primary outputs lead; secondary outputs follow; the simulation is supporting analysis.
- Anything not in §14.1 is internal (§13) or belongs to Detailed Feasibility.

---

## 15. Terminology (must be enforced in code, copy and charts)

| Term | Meaning |
| --- | --- |
| **Average sale / Gross Ticket** | What the customer pays, VAT included — the `averageTicket` as entered |
| **Net Revenue** | Gross collections with the 10% VAT assumption removed |
| **Direct / Variable Product Cost** | Cost directly attached to producing or selling one average sale |
| **POS / Payment Cost** | Cost of collecting payment for one sale (commission on the card share) |
| **Payroll / Rent / Other OPEX Allocation** | The monthly cost divided by monthly sales volume |
| **Investment Recovery Allocation** | `initialCapex / capexRecoveryPeriodMonths` — **never** "depreciation" (§6.5) |
| **Estimated Total Cost Per Sale** | The seven cost categories of §9.2 summed, VAT included |
| **Remaining Profit** | Average sale minus all seven cost categories |
| **Estimated Monthly Operating Earnings** | Remaining profit × monthly sales volume, recovery allocation included as a cost — **not** net profit or owner income |
| **Gross Profit Margin** | (Net revenue − variable product cost) ÷ net revenue — deducts product cost only |
| **Operating Profit Margin** | Monthly operating earnings ÷ net revenue — **never** called "Net Profit Margin" |
| **POS Commission Rate** | What the payment provider charges on a card transaction (default 3.56%) |
| **Card Payment Share** | What proportion of sales are paid by card at all — a different assumption |

**Rules:**

- Never present Direct Product Cost, an allocation line, and Estimated Total Cost Per Sale as if they were the same concept.
- Never label the investment recovery allocation as depreciation.
- Never label monthly operating earnings as net profit, owner income, or take-home money.
- Never label Operating Profit Margin as Net Profit Margin.
- Never conflate POS Commission Rate with Card Payment Share (§6.3).
- Revenue- and margin-based figures must be marked as excluding VAT.

---

## 16. Edge cases and defined behaviour

The engine must be total: every valid input produces a defined result, never `NaN`, `Infinity`, or a thrown error.

| Condition | Required behaviour |
| --- | --- |
| `monthlySalesVolume == 0` | Per-sale outputs (§9) → `null` with `reason: 'no_sales_volume'`. Monthly costs and the resulting loss are still computed. |
| `monthlyNetRevenue == 0` | Both margins (§10.2) → `null`, not `0`. |
| `monthlyOperatingEarningsBeforeCapexRecoveryAllocation <= 0` | Payback → the message in §11.2. |
| Displayed earnings ≤ 0 but before-allocation figure > 0 | Payback is shown with a note that it exceeds the chosen recovery period (§11.2). |
| `contributionPerSale <= 0` (internal) | Each sale loses money before fixed costs. Every simulation level is loss-making; surface an advisory warning: *"At this average ticket, each sale loses money before any fixed costs. Selling more cannot make this profitable."* |
| `capexRecoveryPeriodMonths <= 0` | Reject at validation; never divide. |
| `initialCapex == 0` | Valid (e.g. leased turnkey). Recovery allocation `0`, payback `0`. |
| `variableCostPerSale > netAverageTicket` | Valid but warned (§17). |
| Negative money input | Reject at validation with a field-level message. |
| Empty primary input | Reject at validation. Never benchmark-filled, never treated as `0` (§5.2). |
| Non-finite / non-numeric | Reject at validation. |
| Simulation level rounds to a fractional sale count | Round the level's daily volume to a whole number for display; compute from the rounded value so the table is reproducible. |

Validation runs **before** the engine. The engine assumes an already-valid Quick input.

---

## 17. Plausibility warning layer — advisory only

Quick Calculation's audience does not necessarily know what a realistic number looks like, and §19.2 shows the reference example failing plausibility badly. A warning layer compares results against benchmark ranges and returns advisory notes.

| Check | Illustrative range | Warning when outside |
| --- | --- | --- |
| Rent as % of net revenue | 8–15% | "Rent looks unusually high/low for this revenue." |
| Payroll as % of net revenue | 25–35% | "Payroll looks unusually high/low." |
| Other OPEX as % of net revenue | 6–10% | "Other running costs look unusually high/low." |
| Variable cost as % of net ticket | 25–35% | "Product cost looks unusually low — did you include milk, cup and lid?" |
| Gross profit margin | 65–75% | "Your gross margin is far above/below typical — check your product cost." |
| Operating profit margin | 5–20% | "This margin is far above/below typical for this sector — check your inputs." |
| Payback months | 18–60 | "This payback is unusually fast/slow." |
| Sales per employee per day | 40–120 (format-dependent) | "This staffing level looks unusual for this sales volume." |

**Rules:**

- Warnings are **advisory only** and never alter a number.
- Warnings never block a result.
- They are ordered by severity and each links to the specific input to review.
- **The ranges above are illustrative placeholders.** Real ranges come from the benchmark dataset, vary by format and city, and must never be hard-coded in the engine.

---

## 18. Result contract (specification only)

```ts
// Contract description for the QUICK engine only. NOT to be implemented yet.
// Detailed Feasibility will define its own separate input and result types.

interface QuickCalculationInput {
  // 8 primary required inputs (§6.1)
  monthlyRent; employeeCount; averageEmployeeMonthlyCost; otherMonthlyOpex; initialCapex;
  averageTicket;              // VAT-inclusive
  dailySalesVolume; variableCostPerSale;

  // secondary assumptions, defaulted and editable (§6.3)
  operatingDaysPerMonth; capexRecoveryPeriodMonths; cardPaymentShare; posCommissionRate;

  // system assumption (§6.4)
  vatRate;
}

type CostLine =
  | 'vat' | 'variable' | 'payroll' | 'rent' | 'otherOpex' | 'pos' | 'investmentRecovery';

interface Unavailable { available: false; reason: string; }

interface QuickCalculationResult {
  // ---- Primary (§9) ----
  estimatedTotalCostPerSale: number | null;                 // null when no sales volume
  breakdownPerSale: {
    averageSale: number;
    lines: Array<{ line: CostLine; amount: number }>;        // ordered, §9.2
    remainingProfit: number;
  } | null;

  // ---- Secondary (§10, §11) ----
  monthlyOperatingEarnings: number;                          // recovery allocation included
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;                      // never labelled "net profit margin"
  payback: { months: number; exceedsRecoveryPeriod: boolean } | Unavailable;

  // ---- Supporting (§12) ----
  volumeSimulation: Array<{
    label: '-50%' | '-25%' | 'current' | '+25%' | '+50%';
    dailySales: number;
    estimatedTotalCostPerSale: number | null;
    monthlyOperatingEarnings: number;
    isCurrent: boolean;
  }>;

  // ---- Meta ----
  assumptions: Array<{ field; value; source: 'user' | 'default'; label }>;
  warnings:    Array<{ code; severity; message; relatedField? }>;
  meta:        { quickEngineVersion; currency: 'TRY'; vatRate; revenueBasis: 'net' };

  // ---- Internal (§13): may exist on the object but must not be rendered ----
  internal?: {
    /* contributionPerSale, contributionMargin, break-even (not shown in v1),
       monthly cost lines, monthlyOperatingEarningsBeforeCapexRecoveryAllocation */
  };
}
```

`quickEngineVersion` matters: a shared result must be reproducible, and a formula change must be detectable as a version difference rather than a silent change in the numbers. It is scoped to the Quick engine and independent of any Detailed Feasibility version.

---

## 19. Worked example (arithmetic reference)

### 19.1 Inputs

Primary: `monthlyRent 450,000` · `employeeCount 12` · `averageEmployeeMonthlyCost 48,000` · `otherMonthlyOpex 110,000` · `initialCapex 10,000,000` · `averageTicket 140 (VAT-incl.)` · `dailySalesVolume 1,000` · `variableCostPerSale 14.50`.

Assumptions (all approved defaults): `operatingDaysPerMonth 30` · `capexRecoveryPeriodMonths 60` · `vatRate 0.10` · `posCommissionRate 0.0356` · `cardPaymentShare 0.90`.

POS cost per sale = `140 × 0.90 × 0.0356 = 4.4856 TRY`.

### 19.2 Approved outputs

**1. Estimated Total Cost Per Sale — 75.14 TRY**

**2. Cost Breakdown Per Sale**

```
140.00 TRY average sale
VAT                         12.73 TRY
Product cost                14.50 TRY
Payroll                     19.20 TRY
Rent                        15.00 TRY
Other operating costs        3.67 TRY
POS                          4.49 TRY
Investment recovery          5.56 TRY
Remaining profit            64.86 TRY
```

Cost lines sum to 75.14; 75.14 + 64.86 = 140.00 ✓

**3. Estimated Monthly Operating Earnings — 1,945,947 TRY**
(64.8649 × 30,000, identical to `monthlyNetRevenue 3,818,181.82 − monthlyTotalCost 1,872,234.67`) ✓

**4. Gross Profit Margin — 88.6%** ((3,818,181.82 − 435,000) ÷ 3,818,181.82)

**5. Operating Profit Margin — 51.0%** (1,945,947 ÷ 3,818,181.82)

**6. Estimated Investment Payback — 4.7 months**
(10,000,000 ÷ (1,945,947 + 166,666.67) = 10,000,000 ÷ 2,112,613.85)

**7. Simple Sales Volume Simulation**

| Daily Sales | Estimated Cost / Sale | Estimated Monthly Earnings |
| --- | --- | --- |
| 500 (−50%) | 118.56 TRY | +321,640 TRY |
| 750 (−25%) | 89.61 TRY | +1,133,794 TRY |
| **1,000 (current)** | **75.14 TRY** | **+1,945,947 TRY** |
| 1,250 (+25%) | 66.45 TRY | +2,758,101 TRY |
| 1,500 (+50%) | 60.66 TRY | +3,570,254 TRY |

Supporting figures: monthly fixed cost 1,302,666.67 TRY (rent 450,000 + payroll 576,000 + other OPEX 110,000 + recovery allocation 166,666.67); variable + POS per sale 18.99 TRY; net average ticket 127.27 TRY.

### 19.3 Scope of this example **[CLOSED]**

**This example exists to validate formula arithmetic, nothing else.** It is the reference vector for checking that the chain in §8–§12 is internally consistent: that the breakdown sums to the average sale, that earnings computed two ways agree, and that payback does not double-count CAPEX.

It is **not** a claim about market economics, and it does not need to be. Its input values were chosen for arithmetic clarity, not realism, so its margins are not representative of a real cafe.

**Realism is a separate concern, handled later through actual benchmark data.** Calibration, plausibility ranges and example credibility are therefore **not blockers** for Quick Calculation v1 and must not be raised as such.

The only requirement on this example is that every figure in §19.2 reconciles exactly. It does.

### 19.4 Retired figure

The original v1 scope stated *"approximately 421 sales per day to break even"*. That figure was never reproducible from its own inputs, and **break-even is no longer a Quick Calculation output** (§13). The figure is retired and must not appear in copy, tests, or examples.

---

## 20. Changes applied in v1.4

Driven by the final approved decisions.

| # | Change | Sections |
| --- | --- | --- |
| 1 | Monthly operating earnings confirmed as **including the CAPEX recovery allocation as a cost**, stated explicitly at the formula. | §10.1 |
| 2 | CAPEX recovery allocation formula, `60`-month default, editability and "not statutory depreciation" locked in one place. | §8.6 |
| 3 | Payback denominator renamed to `monthlyOperatingEarningsBeforeCapexRecoveryAllocation`; the "keep separate / do not double-count CAPEX" rule made explicit. | §11.1 |
| 4 | Payback gate moved to the **before-allocation** figure, resolving the arithmetic conflict flagged in v1.3. | §11.2, §16 |
| 5 | `variableCostPerSale` locked as used **exactly as entered** — no waste, no input VAT, no recipe costing. | §6.2, §8.4 |
| 6 | Break-even confirmed as **not shown in v1**, retained internally only. | §13 |
| 7 | `posCommissionRate` default set to **3.56%**, editable. | §6.3 |
| 8 | `cardPaymentShare` kept as an unresolved but editable assumption, with an explicit warning against conflating it with the POS commission rate. | §6.3, §15 |
| 9 | Margins changed from one to **two** — Gross Profit Margin and Operating Profit Margin — with "Net Profit Margin" forbidden and a note distinguishing gross margin from contribution margin. | §10.2, §13.1, §15 |
| 10 | Output set grew from 6 to 7 items to carry both margins. | §14.1 |
| 11 | Result contract, edge cases and plausibility ranges updated for two margins and the new payback gate. | §16, §17, §18 |
| 12 | Worked example recomputed with the 3.56% POS rate. | §19 |
| 13 | `cardPaymentShare` default set to **`0.90`**, editable; OPEN-1 closed. Worked example recomputed again with the final defaults. | §6.3, §19 |
| 14 | Worked-example realism **closed as a non-issue**: the example validates formula arithmetic only, realism comes later from benchmark data, and plausibility/recalibration/credibility are explicitly not blockers. | §19.3 |
| 15 | Planning phase marked **complete** — no blocking open decisions; the former definition-of-done checklist replaced by a status table plus copy/data tasks. | §0, §24.2, §25 |

---

## 21. Out of scope for Quick Calculation

Quick Calculation is deliberately simplified. These belong to the future Detailed Feasibility model, which is designed separately.

**Removed from Quick by decision:** waste rate and waste modelling; benchmark completion of core financial inputs; `pricesIncludeVat`; any shared financial engine with Detailed Feasibility; break-even as a user-facing output; multiple margin definitions; user-configurable scenarios.

**Payroll & tax:** detailed SGK calculations, employee-level payroll, income tax brackets, corporate tax, Bağ-Kur, rent withholding, input VAT and detailed VAT accounting.

**Regulatory:** municipal licenses, fire department fees, music copyright fees.

**Product & inventory:** recipe-level costing, SKU-level inventory, waste modelling, different VAT rates by SKU.

**Channels:** multiple sales channels, delivery platform commissions.

**Accounting & finance:** statutory depreciation, financing and loan repayments, inflation simulation, detailed cash-flow statement, NPV / IRR, EBITDA / EBIT, detailed P&L.

**Simulation:** Base / Scenario A / B / C, multi-variable scenarios, pricing simulations, cost inflation, CAPEX scenarios, automatic capacity or staffing adjustment as volume changes.

**Product surface:** authentication, database, multi-currency, multi-location, user accounts.

Quick Calculation does not need to grow into any of these. Where a user needs them, the answer is Detailed Feasibility, not a more complex Quick mode.

---

## 22. Boundary with Detailed Feasibility

**This document does not design Detailed Feasibility and must not constrain it.**

Detailed Feasibility will have its own calculation logic and will later support: Base scenario, Scenario A/B/C, sensitivity analysis, pricing simulations, rent changes, staffing changes, volume changes, cost inflation and CAPEX scenarios. Its financial model, input set and result contract will be specified in a separate document, with no obligation to match Quick Calculation's structure, formulas, field names or output set.

Quick Calculation's simple volume simulation (§12) is not that simulation engine and creates no shared abstraction with it.

The only expectation across the boundary is a **product** one, not an architectural one: a user who outgrows Quick Calculation should be able to move to Detailed Feasibility. How input data is carried across, if at all, is a separate design question.

---

## 23. Technology direction (informational)

Planned stack: React · Vite · TypeScript · Tailwind CSS · daisyUI · Cloudflare Workers / Static Assets.
Planned architecture: no authentication, no database, no Supabase, no separate Python backend.

Detailed Feasibility scenarios are expected to use `localStorage` + JSON export/import. Quick Calculation itself may not require persistence.

### 23.1 Shareable state (proposal, OPEN-4)

Quick Calculation needs no persistence, but it does need **shareability** — its output is a number users want to send to someone. Encoding the input set into the URL query string gives shareable, bookmarkable results with zero backend, consistent with the no-database decision. Include `quickEngineVersion` so an old link is not silently re-scored by new formulas.

---

## 24. Decisions register

### 24.1 CLOSED — approved and locked

Not to be reopened, reconsidered or re-proposed.

**Architecture, inputs and conventions**

| # | Decision | Resolution |
| --- | --- | --- |
| C1 | Single vs. two calculation engines | **Two separate engines.** Quick is not a wrapper around Detailed. Generic utilities may be shared; financial logic may not. (§3) |
| C2 | Does Quick depend on benchmark completion? | **No.** Benchmarks provide context, comparison, warnings and defaults for selected secondary assumptions only. (§7) |
| C3 | Quick primary input set | **Frozen at 8 inputs** (§6.1). No expansion without explicit approval. |
| C4 | VAT convention | **`averageTicket` is VAT-inclusive; `vatRate = 0.10` is a system assumption, not a main input.** Net revenue = gross / 1.10. (§5.1) |
| C5 | Are cost inputs VAT-adjusted? | **No.** Costs are used exactly as entered; input VAT is out of scope. (§5.1) |
| C6 | Waste rate in Quick | **Removed** — input, formulas and defaults all deleted. (§21) |
| C7 | CAPEX terminology | **Recovery period / recovery allocation.** Never depreciation. (§6.5) |
| C8 | Operating days default | **30, editable.** (§6.3) |
| C9 | CAPEX recovery period default | **60 months, editable.** (§6.3) |
| C10 | Card payment share & POS commission | **Secondary editable assumptions**, not primary inputs, and never conflated with each other. (§6.3) |
| C11 | Does Quick constrain Detailed Feasibility's architecture? | **No.** Detailed is designed separately. (§22) |
| C12 | Rounding, currency, determinism, presentation-layer-only rounding, TRY-only v1, Turkey / Coffee Shop first preset | **Retained as previously defined.** (§5.2, §26) |

**Outputs**

| # | Decision | Resolution |
| --- | --- | --- |
| C13 | Quick result philosophy | **Six simple questions; not a P&L dashboard**; no unnecessary accounting terminology. (§4) |
| C14 | Headline output | **Estimated Total Cost Per Sale.** (§9.1) |
| C15 | Cost breakdown per sale | **8 approved categories in the approved order.** No further splitting of OPEX, payroll, tax or product cost. (§9.2) |
| C16 | Monthly earnings figure | **One figure — Estimated Monthly Operating Earnings**, with approved labels, forbidden labels, and a mandatory limitation statement. (§10.1) |
| C17 | Margins shown | ~~Exactly one~~ → **superseded by C29 below: two margins.** |
| C18 | Investment payback | **Shown**, described as approximate, undiscounted, constant-performance, excluding financing and detailed tax. Zero/negative → approved message. No NPV, IRR or DCF. (§11) |
| C19 | Volume simulation | **Included**, automatic, **no new user inputs**, varies only `dailySalesVolume`, at **−50 / −25 / current / +25 / +50**, three columns, current row marked. (§12) |
| C20 | Simulation assumption | **Fixed costs unchanged** as volume changes, with the approved visible caveat. No automatic staffing, rent, capacity or OPEX adjustment. (§12.4) |
| C21 | Result hierarchy | **Primary → Secondary → Supporting**, no large KPI dashboard, readable in a few seconds. (§14) |
| C22 | Break-even on the Quick surface | **Removed.** Retained internally only; the volume simulation conveys the same intuition. (§13) *(closes the former open item on break-even labelling)* |
| C23 | VAT presentation | **Shown as an explicit breakdown category.** (§9.2) *(closes the former open item on the VAT slice)* |
| C24 | Cash vs. economic profit, contribution, EBITDA, EBIT, NPV, IRR, detailed P&L, detailed breakdowns, Scenario A/B/C | **Not on the Quick result surface.** May exist internally. (§13.1) |

**Final decisions (this revision)**

| # | Decision | Resolution |
| --- | --- | --- |
| C25 | Does monthly operating earnings include the CAPEX recovery allocation? | **Yes — included as a cost.** (§10.1) |
| C26 | CAPEX recovery allocation | **`initialCapex / capexRecoveryPeriodMonths`**, default `60` months, editable, a simplified economic allocation and **not statutory depreciation**. (§8.6) |
| C27 | Investment payback | **Kept separate from the recovery allocation.** `paybackMonths = initialCapex / monthlyOperatingEarningsBeforeCapexRecoveryAllocation`. **CAPEX is never double-counted.** (§11.1) |
| C28 | `variableCostPerSale` treatment | **Exactly as entered** — no waste adjustment, no input VAT adjustment, no recipe-level costing. (§6.2, §8.4) |
| C29 | Margins shown | **Two:** Gross Profit Margin = `(netRevenue − variableProductCost) / netRevenue`, and Operating Profit Margin = `monthlyOperatingEarnings / netRevenue`. The second must **never** be called "Net Profit Margin". Supersedes C17. (§10.2) |
| C30 | Break-even in v1 | **Not shown.** The result surface stays simpler. Retained internally only. (§13) |
| C31 | POS commission rate | **Default `3.56%`, editable.** (§6.3) |
| C33 | Card payment share | **Default `0.90`, editable.** Distinct from the commission rate. (§6.3) |
| C34 | Worked-example realism | **Closed.** The example validates formula arithmetic only; it need not represent realistic market economics. Realism comes later from actual benchmark data. Plausibility, recalibration and example credibility are **not blockers**. (§19.3) |
| C32 | Payback gating band *(resolved by C27)* | Gate on `monthlyOperatingEarningsBeforeCapexRecoveryAllocation <= 0`. Keeping payback separate from the recovery allocation means the allocation cannot decide whether payback exists; in the band where displayed earnings are ≤ 0 but the before-allocation figure is positive, the payback number is shown with a note that it exceeds the recovery period. (§11.2) |

### 24.2 OPEN — non-blocking only

> **There are no blocking open decisions remaining for Quick Calculation v1.**
> Every input, assumption, formula and output needed to compute a result is decided. The items below are refinements that do not prevent implementation.

| # | Open item | Status | Blocking implementation? |
| --- | --- | --- | --- |
| OPEN-1 | Confirm that **Estimated Total Cost Per Sale includes VAT** | Default applied (§9.1). It is the only definition under which the headline and the locked breakdown reconcile, and the approved illustrative figures imply it (`180 − 57 = 123 ≈ 124`). Reversible with a one-line instruction. | No |
| OPEN-2 | Plausibility **warning ranges** per format and city | To come from the benchmark dataset. §17 values are placeholders; warnings are advisory and can ship disabled. | No |
| OPEN-3 | Are refundable **deposits** counted inside `initialCapex`? | Currently included. Deposits are recoverable, so this slightly overstates the recovery allocation and shortens payback. Minor. | No |
| OPEN-4 | URL-encoded **shareable state** in v1? | Cheap and high value, but not yet decided. (§23.1) | No |

**No mathematical contradictions remain.** The v1.3 payback-gating conflict is resolved by C27/C32: because payback is explicitly kept separate from the recovery allocation, the allocation can no longer gate it.

---

## 25. Planning phase status — complete

**The financial model definition for Quick Calculation v1 is complete.** There are no blocking open decisions (§24.2).

| Requirement | Status |
| --- | --- |
| All 8 primary inputs frozen and defined | Done (§6.1) |
| All secondary assumptions have approved defaults and are editable | Done (§6.3) |
| Formula chain has no undefined term and no unstated assumption | Done (§8–§12) |
| All 7 approved outputs defined with formulas | Done (§9–§12, §14.1) |
| Worked example reconciles exactly, serving as the first acceptance vector | Done (§19) |
| Edge-case behaviour defined for every listed condition | Done (§16) |
| No mathematical contradictions | Confirmed (§24.2) |

### 25.1 Remaining pre-build work (not financial decisions)

These are copy and data tasks, not model decisions, and none blocks the engine:

1. Final user-facing labels for the seven outputs, in English and Turkish.
2. Approved final copy for the earnings limitation statement (§10.1) and the simulation caveat (§12.4).
3. The benchmark dataset for plausibility ranges (§17), which are advisory and may ship disabled.

**Implementation may begin when explicitly requested. Do not write calculation code until then.**

---

## 26. Product boundary

First version: **Turkey**, preset **Coffee Shop / Cafe**.

The Quick engine's formulas stay country- and sector-neutral. Country and sector specifics — the VAT assumption value, card payment share, POS commission, and all comparison and plausibility ranges — live in data outside the engine:

```
Quick Engine (formulas)  +  Turkey assumptions (data)  +  Coffee Shop comparison data (data)
```

**Test of correctness for this separation:** adding a "Bakery, İstanbul" comparison preset must require **only** a new data file, with zero changes to the Quick engine. If it requires a formula change, the boundary has been violated.

This separation keeps hard-coded numbers out of the engine. It is **not** a benchmark completion mechanism: preset data never supplies any of the 8 primary inputs (§7).

---

## 27. Changelog

| Version | Change |
| --- | --- |
| v1 | Original Quick Calculation product & financial scope |
| v1.1 | Planning refinement: VAT basis question raised; cash vs. economic fixed cost and break-even; waste and POS formulas; CAPEX payback formula proposed; cost allocation breakdown; edge-case and plausibility layers; result contract; worked example with calibration findings; open decisions register |
| v1.2 | Two separate calculation engines replacing the single-engine requirement; benchmark completion removed as a Quick dependency; 8 primary inputs frozen; VAT-inclusive ticket convention with a fixed 10% system assumption and no cost-side VAT adjustment; waste removed; CAPEX recovery-period terminology; secondary editable assumptions defined; per-sale allocation on a gross-ticket basis; decisions register split into CLOSED and OPEN |
| v1.3 | Approved output decisions applied: result philosophy and hierarchy; Estimated Total Cost Per Sale as the VAT-inclusive headline; 8-category Cost Breakdown Per Sale; single Estimated Monthly Operating Earnings figure with mandatory limitation statement; single Estimated Profit Margin; Estimated Investment Payback with required qualifiers; automatic −50/−25/current/+25/+50 volume simulation with no new inputs; break-even, contribution and cash-vs-economic profit demoted to internal; result contract and worked example rebuilt around the six approved outputs; `421 sales/day` figure retired |
| v1.4 | Final approved decisions applied, planning phase closed: `cardPaymentShare` default `0.90` (editable) and worked-example realism closed as a non-issue, leaving no blocking open decisions; monthly operating earnings confirmed as recovery-inclusive; CAPEX recovery allocation formula, 60-month default and non-depreciation status locked; payback kept separate from the allocation with the no-double-counting rule and the gate moved to the before-allocation figure (resolving the v1.3 conflict); `variableCostPerSale` locked as entered with no waste, input-VAT or recipe adjustment; break-even confirmed out of v1; POS commission default set to 3.56% and card payment share to 0.90, kept explicitly distinct from each other; margins changed from one to two (Gross and Operating, with "Net Profit Margin" forbidden); output set grown to seven; worked example recomputed |
