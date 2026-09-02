# Detailed Feasibility — Locked Decisions

**Version:** v0.2
**Status:** Decision log for product decisions that are **LOCKED / AGREED**. Remaining mechanics are intentionally open.
**Phase:** Planning — **not** a financial specification and **not** implementation
**Currency:** TRY · **Country:** Turkey · **Preset context:** Coffee Shop / Cafe (same product family as Quick / Lite)
**Language for v1:** Turkish-first

**Companion documents:**

| Document | Owns |
| --- | --- |
| `docs/quick-calculation-scope-v1.md` | Quick / Lite product & financial scope — inputs, formulas, outputs, terminology |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` | Stack, runtime, persistence, engineering constraints |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` | Folder structure, layer boundaries, dependency direction, reuse rules |
| `docs/DESIGN_DIRECTION.md` | Visual & UX direction established for Quick / Lite |
| `docs/design.md` | Design source-of-truth index and frame notes |
| `docs/FRONTEND_IMPLEMENTATION_SPEC.md` | Quick / Lite frontend measurements, tokens, copy |
| `docs/archive/FRONTEND_IMPLEMENTATION_PLAN.md` | Archived Quick / Lite frontend execution plan |
| `docs/archive/QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md` | Archived Quick / Lite engine execution plan |

This document records **only** the Detailed Feasibility decisions that have already been made. It does not invent formulas, defaults, schemas, or UX mechanics that have not been approved.

**Do not implement Detailed Feasibility from this document. Do not modify the Quick / Lite financial engine while planning Detailed.**

---

## 0. How to read this document

| This document IS | This document is NOT |
| --- | --- |
| A decision log and scope foundation for Detailed Feasibility | The Detailed financial specification |
| A record of locked product decisions, grouped by domain | A TypeScript schema, formula contract, or result type |
| A boundary statement: Lite stays intact; Detailed is a sibling mode | An implementation plan, component plan, or tax specification |
| An explicit list of v1 exclusions and deferred mechanics | Permission to write `core/detailed/`, UI, or calculation code |

Decisions marked **LOCKED** are settled product decisions. They are not to be reopened, redesigned, or "improved" in this planning phase.

Items marked **DEFERRED** are intentionally unresolved. Do not fill them in with a reasonable-sounding assumption.

Items marked **SUPERSEDED** were previously locked and have been replaced by a later locked decision in this file. The later decision wins.

---

## 1. Purpose

Create a reliable source of truth for the Detailed Feasibility decisions that **are** settled, so the remaining questions can be resolved one by one later.

Those later questions will eventually become:

1. a Detailed financial specification (inputs, formulas, outputs, terminology);
2. a Detailed implementation plan.

Neither of those documents is being written now.

---

## 2. Relationship to Quick / Lite **[LOCKED]**

The product has **two separate calculation experiences**. They are not two skins of one engine.

### 2.1 Quick / Lite

The existing calculation experience.

- Remains simple, directional, and fast.
- Its financial model is **not** changed by Detailed planning.
- A user who wants a fast directional estimate continues to use Lite.

This document does not reopen, extend, or reinterpret any Quick / Lite formula, input, default, or output. The authority for Lite remains `docs/quick-calculation-scope-v1.md`.

### 2.2 Detailed / Pro

A separate, deeper feasibility model. Intended to answer questions such as:

- Is this business economically viable?
- Where does the money go?
- What does the store actually earn?
- How much initial cash is required?
- At what sales level does the operation break even?
- How long does the investment take to recover?
- How does the business behave during its first months?

#### DF-00 — Detailed, but usable **[LOCKED]**

Detailed must remain **user-friendly and deliberately simplified**.

It is **not**:

- accounting software;
- an ERP;
- payroll software;
- a professional tax-advisory model.

It must remain usable by a normal café / restaurant owner who is not a financial specialist.

**Product test [LOCKED]:** if a modelling decision creates several new inputs that a normal café / restaurant owner is unlikely to know, challenge whether it belongs in v1. Detailed should be deeper than Lite, but still usable by a non-financial user.

Do not force the user to fill dozens of unnecessary accounting fields simply because they can be modelled.

### 2.3 What the two modes may and may not share

This restates the already-locked product and architecture boundary. It does not add a new sharing rule.

| Allowed | Not allowed |
| --- | --- |
| Generic utilities (safe division, money formatting, generic validation predicates) | A shared financial engine, or Lite formulas reused in Detailed "for convenience" |
| Shared, domain-neutral UI primitives and the established visual system | Detailed importing Quick business logic, or Quick importing Detailed business logic |
| Shared TypeScript primitives that carry no business meaning | Unifying the two modes into a generic engine |
| The same rent **net/gross withholding concept** as a product convention (see DF-12) | Implementing that concept by calling the Lite engine |

The two engines are permitted to disagree. Lite is directional; Detailed is the deeper feasibility model. Where they differ, the UI must make the active mode obvious.

---

## 3. Architecture boundary **[LOCKED]**

Detailed is a **sibling** of Quick / Lite, not a parent and not a wrapper.

The existing architecture already reserves this placement and forbids cross-mode business imports:

```
src/core/quick/        Quick / Lite engine — do not modify for Detailed planning
src/core/detailed/     Detailed engine — not created yet
src/features/quick-calc/
src/features/detailed/ later — not created yet
```

Rules that already apply and are **not** being changed:

- Financial formulas must never live inside React components.
- A financial formula has exactly one source of truth.
- `core/detailed/` must not depend on `core/quick` business logic.
- `features/detailed/` must not import Quick Calculation business logic.
- Generic shared code may move downward into `lib/`, `components/`, or `core/shared/` only when reuse is genuine.
- Do not introduce a generic engine interface that both modes implement.

**Already locked technically** (owned by `docs/TECH_STACK_AND_CONSTRAINTS.md`, not redefined here): when Detailed is built, scenarios persist in `localStorage` with JSON export/import; no cloud sync and no user accounts in the initial version. Calculations remain client-side TypeScript.

**Not authorised by this document:** creating `core/detailed/`, `features/detailed/`, `businessModel.ts`, any Detailed UI, or any Detailed calculation engine.

---

## 4. UI / navigation **[LOCKED]**

Lite and Detailed will be accessible through **tab-style navigation**.

Detailed inherits the existing product visual system. It is not supposed to look like a completely different application.

Locked visual inheritance:

- the same general typography philosophy;
- the same quiet analytical visual language;
- the same near-monochrome approach;
- the same disciplined use of accent colour;
- the same preference for whitespace and hairlines instead of generic dashboard cards;
- the same high-quality mobile treatment;
- the same Turkish-first product language for v1.

Detailed forms and results **may** have a different structure, because the financial model is substantially deeper. Visual kinship is required; identical screen layout is not.

Exact tab labels, tab placement, routing versus in-page tabs, and the Detailed screen composition are **DEFERRED**.

---

## 5. Locked decisions by domain

Numbering below is the product decision register for Detailed. It is independent of the Quick / Lite C-series numbers.

---

### 5.1 Revenue model

#### DF-01 — Category-based sales volume **[LOCKED]**

Unlike Lite, Detailed must not force the entire store into one average product cost / one blended COGS number.

Sales volume is **category-based**. Users can add categories. There should be an interaction similar to:

`+ Kategori Ekle`

Illustrative examples (not a locked default set):

- Coffee / beverages
- Food
- Desserts
- Other

#### DF-01a — Category economics fields for v1 **[LOCKED]**

Each category uses:

- an average **VAT-inclusive** selling price;
- an average **unit cost in TL**;
- an **expected sales quantity**.

These are the v1 category fields. Do not expand them into a recipe, SKU, or ingredient model.

**DEFERRED:** the exact default category list; the exact quantity basis (per day vs. per month, and similar); labels and grouping.

#### DF-02 — No recipe / SKU engine in Detailed v1 **[LOCKED]**

Detailed v1 is **not** a recipe or SKU costing engine.

The user must not be required to define ingredient-level recipes such as:

- 18 g coffee
- 200 ml milk
- cup
- lid
- individual ingredient bills of materials

Category-based economics are sufficient for the initial version.

#### DF-03 — Customer-facing sales prices are VAT-inclusive **[LOCKED]**

All user-entered customer-facing sales prices in Detailed are entered as **VAT-inclusive** amounts.

If a product/category price is entered as 400 TL, the customer pays 400 TL.

Do **not** silently gross this value up again.

A full accounting VAT engine is **out of Detailed v1** (DF-31). Do not invent an output-VAT extraction formula here.

#### DF-04 — Sales channel modelling exists **[LOCKED]**

Detailed distinguishes sales channels. Not every sale is treated identically.

Core channel concepts agreed for modelling:

- on-premise / salon
- takeaway / al-götür
- delivery / paket servis

A separate "dükkan" wording was discussed. The exact semantic distinction between **"dükkan"** and **"salon"** is **not** finalized.

**Do not resolve that naming issue here.** The locked decision is that channel economics exist.

#### DF-04a — Channel mix is business-level **[LOCKED]**

Channel mix is **percentage-based at business level**.

It is **not** separately configured for every category in v1.

**DEFERRED:** the exact default mix; validation when percentages do not sum to 100%; how the delivery-channel slice interacts with delivery Mode A vs. Mode B.

#### DF-05 — Channel-specific pricing is allowed **[LOCKED]**

The same category economics may have different customer-facing prices by sales channel.

Example (illustrative, not a default):

| Channel | Price |
| --- | --- |
| Base / on-premise | 400 TL |
| Takeaway | 400 TL |
| Delivery | 480 TL |

This matters because delivery commissions may require a higher delivery-menu price.

**UX principle [LOCKED]:** use a base price where possible, with optional channel-specific overrides, rather than forcing the user to re-enter every value repeatedly.

**DEFERRED:** exact UI mechanics for base price vs. overrides; whether overrides are absolute prices or deltas.

---

### 5.2 COGS

#### DF-28 — Unit COGS is entered directly in TL **[LOCKED]**

Users enter average unit product / category cost **directly in TL**.

That unit cost is not derived from a recipe engine (DF-02).

#### DF-29 — Unit COGS is constant; total COGS follows units sold **[LOCKED]**

When sales volume changes:

- **unit COGS stays constant**;
- **total COGS increases or decreases with units sold**.

This also applies when comparing sales-volume scenarios (DF-37).

---

### 5.3 Payment model

Payment methods are **separate from sales channels**.

Do not confuse:

- **how the order was sold** (channel), with
- **how the customer paid** (payment method).

#### DF-06 — Payment methods modelled in Detailed **[LOCKED]**

Detailed will model:

- cash
- credit/debit card
- meal card / yemek kartı

#### DF-06a — Payment mix is percentage-based **[LOCKED]**

Payment mix is **percentage-based**.

**DEFERRED:** the exact default mix; whether the mix is a single business-level split or can vary by channel; validation when percentages do not sum to 100%.

#### DF-07 — Cash has no payment-processing commission **[LOCKED]**

Cash carries no POS or meal-card commission.

#### DF-08 — POS / card commission is a percentage **[LOCKED]**

Card / POS cost must be modelled as an **editable percentage**.

Do **not** model POS cost as a fixed monthly TL expense.

The rate is editable because commercial rates vary over time and by agreement.

**DEFERRED:** the default Detailed POS percentage. Lite's locked 3.56% default is a Lite assumption. It is **not** copied into Detailed by this document.

#### DF-09 — Meal-card commission is a percentage **[LOCKED]**

Meal-card commission follows the same principle as POS:

- percentage-based;
- editable by the user;
- not a fixed monthly TL expense.

A provisional figure such as 15% was discussed. There is **not** yet enough confidence to lock that as the product default.

Do **not** hardcode a 15% default merely because it was mentioned in discussion.

**DEFERRED:** the approved default meal-card commission. It must be researched and approved separately.

---

### 5.4 Delivery / platform model

#### DF-10 — Delivery has two commercial modes **[LOCKED]**

Detailed must distinguish two delivery operating models.

**Mode 1 — Platform only / merchant handles delivery**

The platform generates the order. Delivery is handled outside the platform courier service.

The relevant platform cost is **percentage-based and editable**.

**Mode 2 — Platform + platform courier**

The platform provides both marketplace / order generation and courier delivery.

The combined commercial burden is substantially higher.

This cost is also **percentage-based and editable**.

Approximate market figures discussed in planning (roughly 12–15% for one model, roughly 38% for platform + courier) are **not** approved benchmark or product defaults.

Do **not** encode them as authoritative defaults. They require separate validation.

**DEFERRED:** default rates for Mode 1 and Mode 2; how the user chooses a mode; whether both modes can coexist.

#### DF-11 — Platform / courier VAT treatment is not finalized **[DEFERRED]**

Delivery-platform VAT treatment remains an **explicitly open** topic requiring research.

Do not invent:

- VAT on platform service invoices;
- how that VAT sits relative to the commission percentage;
- cash paid vs. P&L expense vs. deductible input VAT.

A full VAT-return / input-VAT accounting engine is out of v1 (DF-31). That exclusion does **not** close this research item. It only forbids guessing a treatment now.

---

### 5.5 Rent / occupancy

#### DF-12 — Rent uses the same net / gross withholding logic as Lite **[LOCKED]**

Detailed will use a Net / Gross rent control similar to Lite.

The current system withholding-rate assumption is **20%**.

The rate is applied to the **gross** withholding-tax base. The mathematical treatment must remain correct.

**Gross rent entered**

The entered rent is the gross withholding-tax base:

```
grossRent = enteredRent
withholdingTax = grossRent × 20%
landlordNet = grossRent − withholdingTax
total rent cash cost = grossRent
```

Example — gross rent = 450,000 TL:

- landlord receives 360,000 TL
- withholding = 90,000 TL
- total business cash cost = 450,000 TL

**Net rent entered**

The entered value is what the landlord should receive:

```
grossRent = netRent / (1 − 0.20)
```

which is the same as:

```
grossRent = netRent / 0.80
```

Example — net rent = 450,000 TL:

`450,000 / 0.80 = 562,500 TL`

- landlord receives 450,000 TL
- withholding = 112,500 TL
- total business cash cost = 562,500 TL

**Do not use `netRent × 1.20`.** That gross-up is mathematically incorrect for a 20% withholding applied to the gross base.

This is a **shared product convention**, not a licence to import Lite code. When the Detailed engine is specified, this treatment lives in the Detailed engine.

**DEFERRED for Detailed:** whether the 20% rate remains a non-editable system assumption (as in Lite); landlord-type branching.

Rent KDV / rent escalation are not being invented here. Inflation / escalation treatment is **DEFERRED** (DF-43).

#### DF-13 — Aidat is a standard occupancy expense **[LOCKED]**

Common-area / maintenance fee (**aidat**) is included as a standard occupancy-related expense.

It can start **empty**. Do not force a benchmark or default number.

---

### 5.6 Personnel

#### DF-14 — Personnel is position-based **[LOCKED]**

Detailed must not ask for only one generic employee count.

Personnel is created by **position**. Users can add positions. There should be an interaction similar to:

`+ Pozisyon Ekle`

Illustrative examples (not a locked default roster):

- Barista
- Kitchen
- Service
- Manager
- etc.

Every business can have a different team structure.

#### DF-15 — Core personnel cost basis for v1 **[LOCKED]**

For Detailed v1, the financial input is:

**headcount × monthly employer cost per person**

(plus the position that those people belong to).

Do **not** build a gross-salary-to-employer-cost payroll engine in v1.

This is not payroll software (DF-00).

#### DF-16 — Additional personnel costs **[LOCKED]**

Detailed must support additional employee-related costs such as:

- meals
- transportation
- bonus / ikramiye

These belong in the personnel economics. They must not be silently ignored.

**DEFERRED:** exact input granularity (per person vs. per position vs. a single additional-cost total; monthly vs. annual bonus).

#### DF-17 — Owner / operator labour may be included **[LOCKED]**

The business owner's own labour can be entered as an **operating cost**.

The user must be able to represent:

> I work in this business myself, and my time has a cost.

This must not be ignored automatically simply because the owner is not technically an employee.

The eventual UX may use an option such as:

`İşletmecinin emeğini giderlere dahil et`

Exact presentation is **DEFERRED**.

#### DF-42 — Bağ-Kur is intended as an operating cost **[LOCKED intent; mechanics DEFERRED]**

Bağ-Kur is intended to be represented as an operating cost.

Exact UX, default, and whether it is a distinct line vs. folded into owner labour / another personnel line are **DEFERRED**. Do not invent a Bağ-Kur calculator.

---

### 5.7 Operating expenses

#### DF-18 — Common expenses by default, plus custom lines **[LOCKED]**

Detailed must not start with a completely blank expense sheet.

Common F&B operating expenses are provided as standard lines / categories.

Users must also be able to add expenses specific to their own operation. There should be an interaction such as:

`+ Gider Ekle`

**Principle:** common expenses provided by the product + custom expenses added by the user.

Custom expenses are supported.

**DEFERRED:** the exact standard line list, labels, grouping, and which lines start empty vs. with a suggested amount.

#### DF-19 — Utilities / facility-related standard expenses **[LOCKED]**

The standard set should include concepts such as:

- electricity
- water
- natural gas where applicable
- internet
- camera / surveillance
- alarm / security

Exact labels and grouping can be refined during UI specification.

#### DF-20 — Operational standard expenses **[LOCKED]**

The operating-expense model should support normal recurring F&B costs such as:

- accountant / mali müşavir
- cleaning
- pest-control / ilaçlama
- maintenance and repair
- water treatment / filter maintenance where applicable
- insurance
- software subscriptions
- consumables
- other normal operational expenses

Pest control is **explicitly** part of the model.

Do **not** treat cleaning as meaning pest control is automatically included.

#### DF-39 — No complex OPEX driver system in v1 **[LOCKED]**

Do not introduce an unnecessarily complex driver system in v1 (for example allocating every expense to a sales, headcount, or square-metre driver).

OPEX lines are ordinary recurring amounts unless a later decision says otherwise.

---

### 5.8 CAPEX / initial investment

#### DF-32 — CAPEX is primarily initial investment **[LOCKED]**

CAPEX is treated primarily as **initial investment**, not as an accounting asset register.

Include common items such as:

- fit-out
- equipment
- furniture
- signage
- opening stock
- setup / opening expenses
- custom investment items

#### DF-33 — Opening stock is included **[LOCKED]**

Opening stock is **explicitly** part of the CAPEX / initial-investment set. It must not be omitted.

#### DF-34 — No accounting depreciation in v1 **[LOCKED]**

Do not build accounting depreciation / amortisation, or tax useful-life machinery, in Detailed v1.

Do not use the term **depreciation** in identifiers, types, comments, or strings.

**DEFERRED:** whether Detailed presents any simplified investment-recovery allocation comparable to Lite's CAPEX recovery concept. Do not copy Lite's recovery formula into Detailed unless that is explicitly decided later.

---

### 5.9 Tax / VAT

#### DF-21 — Company-type tax engine **[SUPERSEDED for v1 by DF-30]**

Earlier intention: model şahıs işletmesi vs. limited şirket because tax economics differ.

**v1 lock:** Detailed will **not** calculate personal income tax, corporate income tax, profit-distribution withholding, or a full company-tax model.

Whether a non-calculating company-type control still appears in v1 UX is **DEFERRED**. Do not invent tax rates or brackets.

#### DF-30 — No income / corporate / distribution tax model in v1 **[LOCKED]**

Out of Detailed v1:

- personal income tax;
- corporate income tax;
- profit-distribution withholding;
- a full company-tax model.

This is part of DF-00: Detailed is not a professional tax-advisory model.

#### DF-22 — Real VAT accounting layer **[SUPERSEDED for v1 by DF-31]**

Earlier intention: a real VAT layer (output VAT, input VAT, VAT payable, VAT cash-flow effects) behind an advanced / detail UX.

**v1 lock:** that accounting VAT engine is out of scope.

#### DF-31 — No full accounting VAT engine in v1 **[LOCKED]**

A full accounting VAT engine is out of Detailed v1.

Do **not** create:

- per-OPEX deductible VAT machinery;
- per-CAPEX deductible VAT machinery;
- VAT carry-forward;
- VAT-return accounting.

Sales prices remain VAT-inclusive (DF-03).

Delivery-platform VAT treatment remains explicitly open and requires research (DF-11). Do not invent it here.

---

### 5.10 Projection

#### DF-23 — Multi-month projection is part of Detailed v1 **[LOCKED]**

Detailed is not intended to calculate only a single "normal month".

A **multi-month projection** is part of Detailed v1.

This is one of the major differences between Lite and Detailed.

The Detailed experience should eventually be able to answer:

> How much cash do I actually need to open and survive the early months?

That question is answered with initial investment plus projected operating results. It is **not** a working-capital / payment-timing model (X6).

**DEFERRED:** the projection statement shape; which lines it contains; opening-cash presentation; exact relationship between CAPEX timing and month 1.

#### DF-24 — Default projection horizon is 24 months **[LOCKED]**

Default projection horizon: **24 months**.

The projection period should be **user-editable**.

**DEFERRED:** the precise UX — free numeric input versus presets such as 12 / 24 / 36 months. Do not decide that here.

#### DF-25 — Ramp-up will exist, and it stays simple **[LOCKED]**

New stores do not necessarily reach stabilized sales immediately.

Detailed will include a **ramp-up** concept for the opening period.

It should remain **simple and preset-driven**, rather than requiring the user to enter many monthly values.

**DEFERRED:** exact ramp-up percentages, duration, curve shape / presets, and the relationship between ramp-up and scenarios. Do not invent the curves here.

#### DF-26 — Seasonality is not part of Detailed v1 **[LOCKED]**

Do not add a 12-month seasonality matrix in v1.

This was explicitly decided against for now because the model is already sufficiently complex.

Seasonality may be considered in a future version.

#### DF-43 — Inflation / escalation treatment is not decided **[DEFERRED]**

Inflation / cost-escalation / rent-escalation treatment is still open.

Do not invent an inflation engine, index, or default escalation rate in this document.

---

### 5.11 Scenarios

#### DF-27 — Detailed is scenario-based, and scenarios stay simple **[LOCKED]**

The Detailed experience will support scenario analysis.

Scenarios are **intentionally simple**.

Intended conceptual states:

- weak / bad case
- base / expected case
- strong / good case

#### DF-37 — The primary scenario variable is sales volume **[LOCKED]**

When comparing sales scenarios, the primary variable is **sales volume**.

These remain **fixed assumptions** across those sales scenarios:

- rent
- payroll
- OPEX
- CAPEX
- unit COGS

**Total COGS still changes with units sold** (DF-29).

Exact Bad / Base / Good multipliers remain **DEFERRED**. Do not invent them.

Whether ramp-up and scenarios are the same system remains **DEFERRED** (DF-25).

---

### 5.12 Break-even and payback

#### DF-35 — Simple operating break-even **[LOCKED]**

Detailed v1 will show a **simple operating break-even**.

**CAPEX is not part of operating break-even.**

The exact calculation formula will be defined later in the Detailed financial specification. Do not invent it here.

#### DF-36 — Approximate investment payback **[LOCKED]**

Detailed will show an **approximate investment payback period**.

The exact formula, and its interaction with ramp-up, will be defined later. Do not invent them here.

---

### 5.13 Financing and working capital

#### DF-40 — Financing is out of Detailed v1 **[LOCKED]**

Out of scope:

- loans;
- interest;
- debt / equity structure;
- financing schedules.

#### DF-41 — Working-capital / payment-timing modelling is out of Detailed v1 **[LOCKED]**

Out of scope:

- POS settlement delays;
- supplier payment terms;
- daily cash timing;
- other working-capital timing models.

---

## 6. Explicitly out of Detailed v1 **[LOCKED]**

These are decided exclusions, not open questions.

| # | Exclusion | Notes |
| --- | --- | --- |
| X1 | Recipe / SKU ingredient engine | Category-based economics only (DF-02). |
| X2 | Capacity / seat-turnover engine | Do not model seat count, table turnover, hourly capacity / throughput, or theoretical customer throughput. |
| X3 | Seasonality model | No 12-month seasonality matrix in v1 (DF-26). |
| X4 | AVM-specific rent model | Do not create a separate mall model containing turnover rent, mall marketing contribution, AVM-specific common charges, or mandatory opening-hour economics. May become a later preset / module. |
| X5 | Financing | No loans, interest, debt/equity structure, or financing schedules (DF-40). |
| X6 | Working-capital / payment-timing | No POS settlement delays, supplier terms, or daily cash timing (DF-41). |
| X7 | Income / corporate / distribution tax model | No PIT, CIT, profit-distribution withholding, or full company-tax model (DF-30). |
| X8 | Full accounting VAT engine | No per-OPEX/per-CAPEX deductible VAT, VAT carry-forward, or VAT-return machinery (DF-31). Platform VAT treatment remains a research item (DF-11). |
| X9 | Payroll engine | No gross-salary-to-employer-cost conversion (DF-15). Detailed is not payroll software. |
| X10 | Accounting depreciation / tax useful-life machinery | CAPEX is initial investment (DF-34). |
| X11 | Complex OPEX driver system | Ordinary recurring amounts in v1 (DF-39). |
| X12 | Accounting / ERP / tax-advisory product shape | DF-00. |

---

## 7. Intentionally deferred mechanics

These are known open questions. They are listed so they are not silently closed.

| Area | What is locked | What is not locked |
| --- | --- | --- |
| Default categories | Categories exist and are user-addable; each has VAT-inclusive price, unit cost in TL, and expected quantity | The default category list; quantity time basis |
| "Dükkan" vs. "salon" | Channel economics exist | Naming / semantic distinction |
| Channel mix | Business-level percentages, not per category | Default mix; sum-to-100% UX; interaction with delivery modes |
| Channel pricing UX | Base price + optional overrides | Exact interaction and storage |
| POS default rate | Percentage, editable; not a fixed monthly TL amount | The default percentage |
| Meal-card default rate | Percentage, editable; not a fixed monthly TL amount | The default percentage (15% was discussed only) |
| Payment mix | Percentage-based; three methods | Default mix; business-level vs. per-channel mix |
| Delivery defaults | Two percentage-based commercial modes | Approved default rates; mode-selection UX; coexistence of both modes |
| Platform / courier VAT | Must be researched; not invented here | The treatment itself (DF-11) |
| Aidat default | Standard line; may start empty | Label grouping only |
| Personnel additional costs | Meals, transport, bonus are in scope | Input granularity |
| Owner labour UX | Can be entered as an operating cost | Exact control and cost basis |
| Bağ-Kur | Intended as an operating cost | UX, default, and line placement |
| Standard OPEX list | Concepts listed in DF-19 and DF-20 | Final labels, grouping, empty vs. suggested amounts |
| Company-type control | No v1 tax engine | Whether şahıs vs. limited still appears as a non-calculating input |
| Projection internals | Multi-month model; 24-month default; editable horizon | Statement shape; CAPEX timing vs. month 1; horizon UX |
| Ramp-up | Concept exists; simple; preset-driven | Preset curves, duration, percentages; relationship to scenarios |
| Scenario multipliers | Primary variable is sales volume; other listed assumptions stay fixed; total COGS follows units | Exact Bad / Base / Good multipliers |
| Inflation / escalation | Out of invented scope for now | Whether and how prices, rent, or OPEX escalate |
| CAPEX recovery presentation | No accounting depreciation | Whether any simplified recovery allocation is shown |
| Operating break-even formula | Simple operating break-even; CAPEX excluded | Exact formula |
| Payback formula | Approximate investment payback is shown | Exact formula; interaction with ramp-up |
| Waste modelling | — | Not decided for Detailed v1 (Lite deferred it to Detailed; Detailed v1 has not accepted or excluded it) |

---

## 8. What this document does not authorise

Do **not** create, from this file:

- the Detailed calculation specification;
- the final TypeScript input / result schema;
- the formula contract;
- the implementation plan;
- the component plan;
- the tax specification;
- `businessModel.ts` or any Detailed engine module;
- any Detailed UI;
- any change to the Quick / Lite financial engine.

Generic utilities and visual primitives may be shared later when reuse is genuine. That reuse is not being designed now.

---

## 9. Decisions register

### 9.1 LOCKED

| ID | Decision | Resolution |
| --- | --- | --- |
| DF-00 | Product shape | Detailed, but usable. Not accounting, ERP, payroll, or tax-advisory software. Challenge inputs a normal owner would not know. |
| DF-UI | Navigation and visual system | Tab-style access. Detailed inherits Lite's visual language, typography philosophy, near-monochrome system, accent discipline, hairlines/whitespace, mobile quality, and Turkish-first v1 copy. Form/result structure may differ. |
| DF-01 | Sales volume | Category-based; user-addable categories. |
| DF-01a | Category fields | Average VAT-inclusive selling price, average unit cost in TL, expected sales quantity. |
| DF-02 | Recipe / SKU engine | Out of Detailed v1. |
| DF-03 | Sales prices | VAT-inclusive as entered. Never silently grossed up. |
| DF-04 | Sales channels | On-premise / salon, takeaway / al-götür, delivery / paket servis. "Dükkan" vs. "salon" unnamed. |
| DF-04a | Channel mix | Percentage-based at business level, not per category. |
| DF-05 | Channel pricing | Allowed. Base price + optional channel overrides. |
| DF-28 | Unit COGS | Entered directly in TL. |
| DF-29 | COGS vs. volume | Unit COGS constant; total COGS follows units sold. |
| DF-06 | Payment methods | Cash, card, meal card — distinct from channels. |
| DF-06a | Payment mix | Percentage-based. |
| DF-07 | Cash | No payment-processing commission. |
| DF-08 | POS | Editable percentage. Not a fixed monthly TL amount. Default rate not locked. |
| DF-09 | Meal card | Editable percentage. Not a fixed monthly TL amount. Default rate not locked. |
| DF-10 | Delivery modes | Mode 1 platform only / merchant delivery; Mode 2 platform + courier. Both percentage-based and editable. Discussed market rates are not defaults. |
| DF-12 | Rent | Same net/gross 20% withholding math as Lite. Gross-up is `net / 0.80`, never `net × 1.20`. Implemented later in the Detailed engine, not by importing Lite. |
| DF-13 | Aidat | Standard occupancy expense; may start empty; no forced default. |
| DF-14 | Personnel | Position-based; user-addable positions. |
| DF-15 | Personnel cost basis | Headcount × monthly employer cost per person. No gross-to-employer-cost payroll engine. |
| DF-16 | Additional personnel costs | Meals, transportation, bonus / ikramiye must be includable. |
| DF-17 | Owner labour | Can be entered as an operating cost. |
| DF-42 | Bağ-Kur | Intended as an operating cost. UX / default still open. |
| DF-18 | OPEX sheet | Product-provided common lines + user-added custom lines. |
| DF-19 | Facility utilities | Electricity, water, natural gas where applicable, internet, camera, alarm/security. |
| DF-20 | Operational OPEX | Includes accountant, cleaning, pest control (separate from cleaning), maintenance, water treatment, insurance, software, consumables, and other normal operating expenses. |
| DF-39 | OPEX drivers | No unnecessarily complex driver system in v1. |
| DF-32 | CAPEX | Treated primarily as initial investment. Common items include fit-out, equipment, furniture, signage, opening stock, setup/opening expenses, and custom items. |
| DF-33 | Opening stock | Explicitly included in the investment set. |
| DF-34 | Depreciation | No accounting depreciation / tax useful-life machinery in v1. |
| DF-30 | Company tax | No PIT, CIT, profit-distribution withholding, or full company-tax model in v1. |
| DF-31 | VAT engine | No full accounting VAT engine; no per-expense deductible VAT / carry-forward / VAT-return machinery. Prices stay VAT-inclusive. |
| DF-23 | Projection | Multi-month projection is in Detailed v1. Not a working-capital timing model. |
| DF-24 | Horizon | Default 24 months, user-editable. Horizon UX not locked. |
| DF-25 | Ramp-up | In v1; simple; preset-driven. Curves not locked. |
| DF-26 | Seasonality | Out of v1. |
| DF-27 | Scenarios | Required, and intentionally simple. Bad / base / good remain the conceptual states. |
| DF-37 | Scenario variable | Primary variable is sales volume. Rent, payroll, OPEX, CAPEX and unit COGS stay fixed. Total COGS follows units. Multipliers not locked. |
| DF-35 | Break-even | Simple operating break-even. CAPEX excluded. Formula later. |
| DF-36 | Payback | Approximate investment payback. Formula and ramp-up interaction later. |
| DF-40 | Financing | Out of v1. |
| DF-41 | Working-capital timing | Out of v1. |
| X1–X12 | v1 exclusions | See §6. |

### 9.2 SUPERSEDED

| ID | Previous lock | Replaced by |
| --- | --- | --- |
| DF-21 | Model şahıs vs. limited because tax economics differ; tax formulas to be specified later | DF-30 — no v1 income / corporate / distribution tax engine |
| DF-22 | Real VAT layer (output / input / payable / cash-flow) behind an advanced UX | DF-31 — no full accounting VAT engine in v1 |

### 9.3 DEFERRED (non-exhaustive; see §7)

DF-11 (platform / courier VAT treatment), DF-43 (inflation / escalation), DF-42 mechanics, break-even and payback formulas, scenario multipliers, ramp-up presets, and every other **DEFERRED** row in §7 remain open. They will be resolved in follow-up tasks, then recorded in a future Detailed financial specification.

---

## 10. Relationship to existing planning documents

This file is the active **decision log** for Detailed Feasibility. It is not the Detailed product & financial specification.

Companion indexes in `docs/README.md`, `CLAUDE.md`, the architecture document, and the tech-stack document point here.

Once a Detailed financial specification exists, the following still need a later scope-boundary update:

| Document | Remaining follow-up |
| --- | --- |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` D4 | Currently says there is no router yet; tab navigation may later require an explicit routing/navigation decision |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` §4.2 | Persistence rules already cover Detailed and should remain the technical authority |
| `docs/quick-calculation-scope-v1.md` §21 / §6.2 | Lite currently says waste modelling and recipe-level costing "belong to Detailed Feasibility". Detailed v1 has now **excluded** the recipe/SKU engine. Lite also deferred detailed VAT accounting and tax to Detailed; Detailed v1 has now **excluded** a full VAT engine and a company-tax model. Waste is still undecided for Detailed. The Lite document should later distinguish "out of Lite" from "in Detailed v1" |
| `docs/DESIGN_DIRECTION.md` and `docs/FRONTEND_IMPLEMENTATION_SPEC.md` | Visual inheritance is locked; Detailed screen structure, tabs, and result hierarchy are not. The Quick masthead currently assumes no navigation |

None of the above is a reason to change Lite behaviour now.

---

## 11. Changelog

| Version | Change |
| --- | --- |
| v0.1 | Initial locked decision log for Detailed Feasibility: two-mode product structure, architecture boundary, visual inheritance, category-based revenue, VAT-inclusive prices, channels and channel pricing, payment methods, delivery modes, rent net/gross convention, aidat, position-based personnel, operating expenses, company type, VAT layer, monthly cash flow, 24-month horizon, ramp-up concept, scenario requirement, and explicit v1 exclusions. Deferred mechanics recorded without being resolved. |
| v0.1.1 | Companion paths updated after docs cleanup: finished Quick execution plans now live under `docs/archive/`. |
| v0.2 | Locked Detailed v1 simplification principle; category fields (VAT-inclusive price, unit cost in TL, quantity); business-level channel mix; percentage payment mix; COGS volume behaviour; CAPEX as initial investment including opening stock; no depreciation engine; no financing or working-capital timing; no income/corporate/distribution tax model; no full VAT accounting engine; simple operating break-even (CAPEX excluded); approximate payback; simple sales-volume scenarios with fixed cost assumptions; preset-driven ramp-up; multi-month projection. Superseded DF-21 and DF-22 for v1. Inflation/escalation and platform VAT treatment remain open. |
