# Detailed Feasibility — Locked Decisions

**Version:** v0.1.1
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

Detailed must remain understandable to a normal business owner. It must **not** become an ERP or accounting application.

**Guiding principle:** Detailed, but usable.

Do not force the user to fill dozens of unnecessary accounting fields simply because they can be modelled.

### 2.3 What the two modes may and may not share

This restates the already-locked product and architecture boundary. It does not add a new sharing rule.

| Allowed | Not allowed |
| --- | --- |
| Generic utilities (safe division, money formatting, generic validation predicates) | A shared financial engine, or Lite formulas reused in Detailed "for convenience" |
| Shared, domain-neutral UI primitives and the established visual system | Detailed importing Quick business logic, or Quick importing Detailed business logic |
| Shared TypeScript primitives that carry no business meaning | Unifying the two modes into a generic engine |
| The same rent **net/gross withholding concept** as a product convention (see §7.6) | Implementing that concept by calling the Lite engine |

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

#### DF-01 — Category-based sales, not a single blended product cost **[LOCKED]**

Unlike Lite, Detailed must not force the entire store into one average product cost / one blended COGS number.

Detailed v1 uses a **category-based sales model**.

Illustrative examples (not a locked default set):

- Coffee / beverages
- Food
- Desserts
- Other

Categories must be addable by the user. There should be an interaction similar to:

`+ Kategori Ekle`

Each category will eventually carry the information needed to calculate **its own** sales economics.

**DEFERRED:** the exact default category list; the exact fields each category carries; volume mix vs. unit economics per category.

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

The Detailed tax layer may later derive the VAT component where necessary. This convention must remain explicit in the eventual financial specification.

**DEFERRED:** VAT rate(s), how output VAT is computed from a VAT-inclusive price, and the VAT treatment of each expense category.

#### DF-04 — Sales channel modelling exists **[LOCKED]**

Detailed distinguishes sales channels. Not every sale is treated identically.

Core channel concepts agreed for modelling:

- on-premise / salon
- takeaway / al-götür
- delivery / paket servis

A separate "dükkan" wording was discussed. The exact semantic distinction between **"dükkan"** and **"salon"** is **not** finalized.

**Do not resolve that naming issue here.** The locked decision is that channel economics exist.

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

**DEFERRED:** exact UI mechanics for base price vs. overrides; whether overrides are absolute prices or deltas; how channel mix is entered.

---

### 5.2 Payment model

Payment methods are **separate from sales channels**.

Do not confuse:

- **how the order was sold** (channel), with
- **how the customer paid** (payment method).

#### DF-06 — Payment methods modelled in Detailed **[LOCKED]**

Detailed will model:

- cash
- credit/debit card
- meal card / yemek kartı

#### DF-07 — Cash has no payment-processing commission **[LOCKED]**

Cash carries no POS or meal-card commission.

#### DF-08 — POS / card commission is a percentage **[LOCKED]**

POS cost must be modelled as an **editable percentage**.

Do **not** ask the user to estimate POS expense as a fixed monthly TL amount.

The rate is editable because commercial rates vary over time and by agreement.

**DEFERRED:** the default Detailed POS percentage. Lite's locked 3.56% default is a Lite assumption. It is **not** copied into Detailed by this document.

#### DF-09 — Meal-card commission is a percentage **[LOCKED]**

Meal-card commission follows the same principle as POS:

- percentage-based;
- editable by the user;
- not a fixed TL expense.

A provisional figure such as 15% was discussed. There is **not** yet enough confidence to lock that as the product default.

Do **not** hardcode a 15% default merely because it was mentioned in discussion.

**DEFERRED:** the approved default meal-card commission. It must be researched and approved separately.

**DEFERRED:** how payment-method mix (cash vs. card vs. meal card) is entered; whether mix is global or per channel.

---

### 5.3 Delivery / platform model

#### DF-10 — Delivery has at least two economic modes **[LOCKED]**

Detailed must distinguish at least two delivery operating models.

**Mode A — Platform only / merchant handles delivery**

The platform generates the order. Delivery is handled outside the platform courier service.

The relevant platform commission is **percentage-based and editable**.

**Mode B — Platform + platform courier**

The platform provides both marketplace / order generation and courier delivery.

The combined commercial burden is substantially higher.

This commission is also **percentage-based and editable**.

Approximate market figures discussed in planning (roughly 12–15% for one model, roughly 38% for platform + courier) are **not** approved benchmark or product defaults.

Do **not** encode them as authoritative defaults. They require separate validation.

**DEFERRED:** default rates for Mode A and Mode B; how the user chooses a mode; whether both modes can coexist; how delivery mix is entered.

#### DF-11 — Platform commission VAT treatment is not finalized **[DEFERRED]**

There may be VAT applied to platform service / commission invoices.

The distinction between:

- commission percentage;
- VAT on platform service;
- cash paid;
- deductible input VAT;
- P&L expense;

must eventually be handled correctly.

The precise treatment has **not** been finalized. Do not guess it in this document and do not implement an accounting rule from it.

---

### 5.4 Rent / occupancy

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

Example — net rent = 450,000 TL:

`450,000 / 0.80 = 562,500 TL`

- landlord receives 450,000 TL
- withholding = 112,500 TL
- total business cash cost = 562,500 TL

**Do not use `netRent × 1.20`.** That gross-up is mathematically incorrect for a 20% withholding applied to the gross base.

This is a **shared product convention**, not a licence to import Lite code. When the Detailed engine is specified, this treatment lives in the Detailed engine.

**DEFERRED for Detailed:** whether the 20% rate remains a non-editable system assumption (as in Lite); rent KDV; landlord-type branching; rent escalation.

#### DF-13 — Aidat is a standard occupancy expense **[LOCKED]**

Common-area / maintenance fee (**aidat**) is included as a standard occupancy-related expense.

It can start **empty**. Do not force a benchmark or default number.

---

### 5.5 Personnel

#### DF-14 — Personnel is position-based **[LOCKED]**

Detailed must not ask for only one generic employee count.

Personnel is created by **position**. Illustrative examples (not a locked default roster):

- Barista
- Kitchen
- Service
- Manager
- etc.

There must be an interaction similar to:

`+ Pozisyon Ekle`

Every business can have a different team structure.

#### DF-15 — Core personnel cost basis for v1 **[LOCKED]**

For Detailed v1, the financial model is based on:

- position
- headcount
- monthly employer cost per person

This is **not** a complete payroll / tax engine.

Do not build a full Turkish payroll engine as an unstated requirement.

**DEFERRED:** the exact relationship between displayed gross salary and employer cost, if that distinction is shown at all.

#### DF-16 — Additional personnel costs **[LOCKED]**

Detailed must support additional employee-related costs such as:

- meals
- transportation
- bonus / ikramiye

These belong in the personnel economics. They must not be silently ignored.

**DEFERRED:** exact input granularity (per person vs. per position vs. a single additional-cost total; monthly vs. annual bonus).

#### DF-17 — Owner / operator labour may be included **[LOCKED]**

The business owner's own labour should be **optionally** included as an economic cost.

The user must be able to represent:

> I work in this business myself, and my time has a cost.

This must not be ignored automatically simply because the owner is not technically an employee.

The eventual UX may use an option such as:

`İşletmecinin emeğini giderlere dahil et`

Exact presentation is **DEFERRED**.

---

### 5.6 Operating expenses

#### DF-18 — Common expenses by default, plus custom lines **[LOCKED]**

Detailed must not start with a completely blank expense sheet.

Common F&B operating expenses are provided as standard lines / categories.

Users must also be able to add expenses specific to their own operation. There should be an interaction such as:

`+ Gider Ekle`

**Principle:** common expenses provided by the product + custom expenses added by the user.

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

---

### 5.7 Tax / company structure

#### DF-21 — Company type will be modelled **[LOCKED]**

Detailed v1 will support company / business structure because tax economics differ materially.

At minimum the intended distinction is:

- şahıs işletmesi
- limited şirket

**DEFERRED:** the exact Turkish income-tax and corporate-tax formulas, rates, and brackets.

Do not invent rates. Do not implement a tax engine from this document.

#### DF-22 — VAT will be modelled **[LOCKED]**

Detailed will include a real VAT layer rather than treating VAT as invisible.

The eventual model should distinguish concepts such as:

- output VAT / hesaplanan KDV
- input / deductible VAT / indirilecek KDV
- VAT payable
- VAT cash-flow effects

VAT detail should not overwhelm the default UX. The current product direction is for tax detail to live behind an **advanced / detail layer**, rather than forcing every user to think like an accountant.

Reminder of DF-03: all customer-facing sales prices are VAT-inclusive.

**DEFERRED:** the VAT treatment of every expense category; the exact advanced-layer contents; VAT rates by category or by expense type.

---

### 5.8 Cash flow

#### DF-23 — Monthly cash flow is part of Detailed v1 **[LOCKED]**

Detailed is not intended to calculate only a single "normal month".

A **monthly cash-flow model** is part of Detailed v1.

This is one of the major differences between Lite and Detailed.

The Detailed experience should eventually be able to answer:

> How much cash do I actually need to open and survive the early months?

**DEFERRED:** the cash-flow statement shape; which lines it contains; opening cash / CAPEX timing; how VAT payable appears in cash vs. P&L.

#### DF-24 — Default projection horizon is 24 months **[LOCKED]**

Default cash-flow horizon: **24 months**.

The projection period should be **user-editable**.

**DEFERRED:** the precise UX — free numeric input versus presets such as 12 / 24 / 36 months. Do not decide that here.

#### DF-25 — Ramp-up will exist **[LOCKED]**

New stores do not necessarily reach stabilized sales immediately.

Detailed will include a **ramp-up** concept for the opening period.

**DEFERRED:** exact ramp-up percentages, duration, curve shape, and whether ramp-up is independent of scenarios.

#### DF-26 — Seasonality is not part of Detailed v1 **[LOCKED]**

Do not add a 12-month seasonality matrix in v1.

This was explicitly decided against for now because the model is already sufficiently complex.

Seasonality may be considered in a future version.

---

### 5.9 Scenarios

#### DF-27 — Detailed is scenario-based **[LOCKED]**

The Detailed experience will support scenario analysis.

Intended conceptual states:

- weak / bad case
- base / expected case
- strong / good case

The exact scenario engine has **not** been designed.

**DEFERRED — do not resolve now:**

- which variables scenarios modify;
- exact multipliers;
- whether ramp-up and scenarios are the same system;
- whether each scenario can override individual assumptions.

Only this much is locked: scenario-based analysis is a product requirement for Detailed.

---

## 6. Explicitly out of Detailed v1 **[LOCKED]**

These are decided exclusions, not open questions.

| # | Exclusion | Notes |
| --- | --- | --- |
| X1 | Recipe / SKU ingredient engine | Category-based economics only (DF-02). |
| X2 | Capacity / seat-turnover engine | Do not model seat count, table turnover, hourly capacity, or theoretical customer throughput. May become a later location / operations feature. |
| X3 | Seasonality model | No 12-month seasonality matrix in v1 (DF-26). |
| X4 | AVM-specific rent model | Do not create a separate mall model containing turnover rent, mall marketing contribution, AVM-specific common charges, or mandatory opening-hour economics. May become a later preset / module. |

---

## 7. Intentionally deferred mechanics

These are known open questions. They are listed so they are not silently closed.

| Area | What is locked | What is not locked |
| --- | --- | --- |
| Default categories | Categories exist and are user-addable | The default category list |
| Category economics fields | Each category has its own sales economics | Which fields, units, and mix drivers |
| "Dükkan" vs. "salon" | Channel economics exist | Naming / semantic distinction |
| Channel pricing UX | Base price + optional overrides | Exact interaction, storage, mix entry |
| POS default rate | Percentage, editable | The default percentage |
| Meal-card default rate | Percentage, editable | The default percentage (15% was discussed only) |
| Payment mix | Three methods exist | How mix is entered; global vs. per channel |
| Delivery defaults | Two percentage-based modes | Approved default rates; mode selection UX |
| Platform commission VAT | Must eventually be correct | Cash vs. P&L vs. deductible input VAT treatment |
| Aidat default | Standard line; may start empty | Label grouping only |
| Personnel additional costs | Meals, transport, bonus are in scope | Input granularity |
| Owner labour UX | Optional inclusion | Exact control and cost basis |
| Standard OPEX list | Concepts listed in DF-19 and DF-20 | Final labels, grouping, empty vs. suggested amounts |
| Company tax | Şahıs vs. limited is in scope | Rates, formulas, brackets |
| VAT layer | Real VAT layer; advanced/detail UX | Expense-by-expense VAT spec |
| Cash-flow internals | Monthly model; 24-month default; editable horizon | Statement shape, CAPEX timing, horizon UX |
| Ramp-up | Concept exists | Percentages, duration, mechanics |
| Scenarios | Weak / base / strong is required | Engine design, variables, multipliers, overlap with ramp-up |
| CAPEX / opening cash | Detailed should answer cash-required and payback questions | CAPEX input model, recovery allocation, deposits |
| Break-even | Detailed should answer the sales-level break-even question | Formula, cash vs. economic basis, presentation |
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
| DF-00 | Product structure | Two modes: Quick / Lite (unchanged) and Detailed / Pro (separate deeper model). Guiding principle: detailed, but usable. |
| DF-UI | Navigation and visual system | Tab-style access. Detailed inherits Lite's visual language, typography philosophy, near-monochrome system, accent discipline, hairlines/whitespace, mobile quality, and Turkish-first v1 copy. Form/result structure may differ. |
| DF-01 | Sales economics | Category-based; user-addable categories; not one blended store COGS. |
| DF-02 | Recipe / SKU engine | Out of Detailed v1. |
| DF-03 | Sales prices | VAT-inclusive as entered. Never silently grossed up. |
| DF-04 | Sales channels | On-premise / salon, takeaway / al-götür, delivery / paket servis. "Dükkan" vs. "salon" unnamed. |
| DF-05 | Channel pricing | Allowed. Base price + optional channel overrides. |
| DF-06 | Payment methods | Cash, card, meal card — distinct from channels. |
| DF-07 | Cash | No payment-processing commission. |
| DF-08 | POS | Editable percentage. Not a fixed monthly TL amount. Default rate not locked. |
| DF-09 | Meal card | Editable percentage. Not a fixed TL amount. Default rate not locked. |
| DF-10 | Delivery modes | At least Mode A (platform only / merchant delivery) and Mode B (platform + courier). Both percentage-based and editable. Discussed market rates are not defaults. |
| DF-12 | Rent | Same net/gross 20% withholding math as Lite. Gross-up is `net / (1 − 0.20)`, never `net × 1.20`. Implemented later in the Detailed engine, not by importing Lite. |
| DF-13 | Aidat | Standard occupancy expense; may start empty; no forced default. |
| DF-14 | Personnel | Position-based; user-addable positions. |
| DF-15 | Personnel cost basis | Position + headcount + monthly employer cost per person. No full payroll engine in v1. |
| DF-16 | Additional personnel costs | Meals, transportation, bonus / ikramiye must be includable. |
| DF-17 | Owner labour | Optionally included as an economic cost. |
| DF-18 | OPEX sheet | Product-provided common lines + user-added custom lines. |
| DF-19 | Facility utilities | Electricity, water, natural gas where applicable, internet, camera, alarm/security. |
| DF-20 | Operational OPEX | Includes accountant, cleaning, pest control (separate from cleaning), maintenance, water treatment, insurance, software, consumables, and other normal operating expenses. |
| DF-21 | Company type | At least şahıs işletmesi vs. limited şirket. Tax formulas not locked. |
| DF-22 | VAT | Real VAT layer; default UX must not be accountant-first; detail behind an advanced layer. |
| DF-23 | Cash flow | Monthly cash-flow model is in Detailed v1. |
| DF-24 | Horizon | Default 24 months, user-editable. Horizon UX not locked. |
| DF-25 | Ramp-up | Concept is in v1. Mechanics not locked. |
| DF-26 | Seasonality | Out of v1. |
| DF-27 | Scenarios | Weak / base / strong is required. Engine design not locked. |
| X1–X4 | v1 exclusions | No recipe engine; no capacity/seat-turnover; no seasonality; no AVM-specific rent model. |

### 9.2 DEFERRED (non-exhaustive; see §7)

DF-11 (platform commission VAT treatment) and every **DEFERRED** row in §7 remain open. They will be resolved in follow-up tasks, then recorded in a future Detailed financial specification.

---

## 10. Relationship to existing planning documents

This file is the active **decision log** for Detailed Feasibility. It is not the Detailed product & financial specification.

Companion indexes in `docs/README.md`, `CLAUDE.md`, the architecture document, and the tech-stack document now point here.

Once a Detailed financial specification exists, the following still need a later scope-boundary update:

| Document | Remaining follow-up |
| --- | --- |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` D4 | Currently says there is no router yet; tab navigation may later require an explicit routing/navigation decision |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` §4.2 | Persistence rules already cover Detailed and should remain the technical authority |
| `docs/quick-calculation-scope-v1.md` §21 / §6.2 | Lite currently says waste modelling and recipe-level costing "belong to Detailed Feasibility". Detailed v1 has now **excluded** the recipe/SKU engine. Waste is still undecided for Detailed. The Lite document should later distinguish "out of Lite" from "in Detailed v1" |
| `docs/DESIGN_DIRECTION.md` and `docs/FRONTEND_IMPLEMENTATION_SPEC.md` | Visual inheritance is locked; Detailed screen structure, tabs, and result hierarchy are not. The Quick masthead currently assumes no navigation |

None of the above is a reason to change Lite behaviour now.

---

## 11. Changelog

| Version | Change |
| --- | --- |
| v0.1 | Initial locked decision log for Detailed Feasibility: two-mode product structure, architecture boundary, visual inheritance, category-based revenue, VAT-inclusive prices, channels and channel pricing, payment methods, delivery modes, rent net/gross convention, aidat, position-based personnel, operating expenses, company type, VAT layer, monthly cash flow, 24-month horizon, ramp-up concept, scenario requirement, and explicit v1 exclusions. Deferred mechanics recorded without being resolved. |
| v0.1.1 | Companion paths updated after docs cleanup: finished Quick execution plans now live under `docs/archive/`. |
