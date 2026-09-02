# Detailed Feasibility — Locked Decisions

**Version:** v0.4
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

#### DF-01 — Category-based sales as the engine input **[SUPERSEDED by DF-44]**

Earlier lock: sales volume was category-based, with addable categories as the economic unit.

**v1 lock:** revenue is **product-based**. Category is no longer the financial engine's sales unit.

#### DF-44 — Revenue is product-based **[LOCKED]**

Detailed v1 revenue is **product-based**, not only category-based.

The user can add individual products / sales items. Examples (illustrative, not a locked catalogue):

- Americano
- Poğaça
- Bütün tavuk

The financial engine must calculate revenue **from products**, not from a single blended category average.

Unlike Lite, Detailed must not force the entire store into one average ticket.

#### DF-44a — Category is optional grouping only **[LOCKED]**

Category may exist only as an **optional grouping / organisation** field. Illustrative labels (not a locked default set):

- İçecek
- Pastane
- Yemek
- Diğer

Category is not the v1 revenue-calculation unit.

**DEFERRED:** whether grouping is required or optional in the UI; the default grouping list; whether users can add their own grouping labels.

#### DF-01a — Category economics fields **[SUPERSEDED by DF-45]**

Earlier lock: each category carried an average VAT-inclusive price, an average unit cost in TL, and an expected quantity.

**v1 lock:** those fields belong to **products** for revenue (DF-45). Product unit cost is locked in §5.2.

#### DF-45 — Product fields for v1 revenue **[LOCKED]**

Each product has at minimum:

- product name
- **normal** selling price
- **online / delivery** selling price
- expected sales quantity
- **unit product cost in TL** (Product COGS — DF-28; not a selling price)

All customer-facing selling prices are VAT-inclusive (DF-03).

This is not a recipe / SKU ingredient engine (DF-02). A “product” here is a selling item the owner already sells, not a bill of materials.

**DEFERRED:** quantity time basis (per day vs. per month, and similar). It is not locked. Do not invent it here.

#### DF-02 — No recipe / SKU ingredient engine in Detailed v1 **[LOCKED]**

Detailed v1 is **not** a recipe or SKU costing engine.

The user must not be required to define ingredient-level recipes such as:

- 18 g coffee
- 200 ml milk
- cup
- lid
- individual ingredient bills of materials

Product-level selling items are sufficient for v1 revenue. Ingredient-level costing remains out of v1.

#### DF-03 — Customer-facing sales prices are VAT-inclusive **[LOCKED]**

All user-entered customer-facing sales prices in Detailed are entered as **VAT-inclusive** amounts.

This includes each product's normal price and online / delivery price.

If a price is entered as 150 TL or 200 TL, the customer pays that amount.

Do **not** silently gross this value up again.

A full accounting VAT engine is **out of Detailed v1** (DF-31). Do not invent an output-VAT extraction formula here.

#### DF-04 — Three sales channels **[LOCKED]**

Detailed v1 uses three sales channels:

- salon / on-premise
- al-götür / takeaway
- paket servis / delivery

A separate "dükkan" wording was discussed earlier. The v1 channel set above is locked. Do not add a fourth channel in this update.

#### DF-04a — Channel mix is one business-level split totalling 100% **[LOCKED]**

The user enters **one business-level percentage mix**.

Example (illustrative, not a locked default):

- salon 50%
- al-götür 20%
- paket servis 30%

**The three percentages must equal 100%.**

Do **not** require a separate channel mix for every product in v1. Do **not** require a separate channel mix for every category.

**DEFERRED:** the exact default mix; how the UI enforces the 100% total; how the delivery-channel slice interacts with delivery Mode 1 vs. Mode 2.

#### DF-05 — Independent price per channel **[SUPERSEDED by DF-46]**

Earlier lock: optional channel-specific price overrides, with a possible distinct takeaway price.

**v1 lock:** only two customer-facing prices per product — normal and online (DF-46). Salon and takeaway share the normal price.

#### DF-46 — Normal price vs online price **[LOCKED]**

Each product has:

- a **normal** selling price, used by **salon** and **al-götür**;
- an **online / delivery** selling price, used by **paket servis**.

The online price is a **fixed user-entered** selling price for that product.

The online price does **not** change based on whether the merchant uses:

1. platform only, or
2. platform + platform courier.

Example (illustrative):

Americano:

- normal price: 150 TL
- online price: 200 TL

The customer pays **200 TL** online in either delivery mode.

What changes between delivery modes is the **platform / service deduction**, not the customer-facing online price.

#### DF-47 — One expected quantity per product, split by business mix **[LOCKED]**

Each product has **one** expected sales quantity.

The same business-level channel mix is applied to that product's quantity.

Conceptual example:

Americano quantity = 100

Channel mix: salon 50% · takeaway 20% · delivery 30%

Then:

- salon quantity = 50
- takeaway quantity = 20
- delivery quantity = 30

Quantity time basis (daily vs. monthly) remains **DEFERRED**. Do not invent it here.

#### DF-48 — Product revenue by channel **[LOCKED]**

For each product, conceptual revenue is:

```
salonRevenue     = salonQuantity     × normalPrice
takeawayRevenue  = takeawayQuantity  × normalPrice
deliveryGross    = deliveryQuantity  × onlinePrice
```

Total gross customer sales are the sum of those channel revenues across products.

All of these customer sales values are **VAT-inclusive**.

Platform / service deductions are applied to delivery revenue under DF-10. They do not change `onlinePrice`.

---

### 5.2 Cost structure — Product COGS, Channel Variable Costs, Payment / Platform Fees

#### DF-50 — Keep the three cost concepts separate **[LOCKED]**

Detailed v1 must keep these three concepts **separate**:

1. **Product COGS**
2. **Channel Variable Costs**
3. **Payment / Platform Fees**

Do **not** merge them into one generic “product cost” number.

The purpose is to show the user whether margin loss comes from:

- the product itself;
- channel-specific fulfillment costs;
- or commissions / payment fees.

The v1 cost structure is intentionally limited to these three. Do not add any other standard channel-variable cost unless separately approved.

#### DF-28 — Each product has a unit product cost in TL **[LOCKED]**

Each product has a **user-entered unit cost in TL**.

Example (illustrative):

Americano:

- selling price: 150 TL
- unit product cost: 30 TL

No recipe engine. No ingredient-level costing. **No COGS percentage input.**

#### DF-29 — Product COGS follows units sold **[LOCKED]**

Conceptual formula:

```
productCOGS = unitsSold × unitProductCost
```

Unit product cost **stays constant** when sales volume changes. Total product COGS increases or decreases with units sold.

This also applies when comparing sales-volume scenarios (DF-37).

#### DF-52 — Channel Variable Costs are separate from Product COGS **[LOCKED]**

Channel-specific variable costs are **not** Product COGS.

For v1, the standard channel-variable fields are:

- takeaway packaging cost per order
- delivery packaging cost per order
- own-courier variable payment per delivery order, **if applicable**

Examples (illustrative):

- product COGS: 30 TL
- delivery packaging: 5 TL
- own courier variable payment: 40 TL

These remain **separate cost lines**.

Do **not** include in channel-variable cost:

| Cost | Where it belongs |
| --- | --- |
| Courier salary | Personnel / payroll |
| Motorcycle fuel / maintenance / insurance | OPEX |
| Motorcycle purchase | CAPEX |
| Platform commission | Payment / Platform Fees |

**DEFERRED:** the exact input placement and labels; when own-courier variable payment is shown (it is “if applicable”); whether packaging is a single business-level amount or can vary by product. Do not add further standard channel-variable fields in this update.

#### DF-56 — No extra standard channel-variable costs in v1 **[LOCKED]**

Do not add any other standard channel-variable cost unless separately approved.

Campaigns, Joker, promotional subsidies, and listing / reklam charges are out of v1 (X13).

---

### 5.3 Payment model

Payment methods are **separate from sales channels**.

Do not confuse:

- **how the order was sold** (channel), with
- **how the customer paid** (payment method).

For **direct store sales** (salon and takeaway), payment methods are cash, card, and meal card.

#### DF-06 — Payment methods modelled in Detailed **[LOCKED]**

Detailed will model:

- cash
- credit/debit card
- meal card / yemek kartı

#### DF-06a — Payment mix is percentage-based and totals 100% **[LOCKED]**

For **direct store sales**, the user enters a percentage payment mix across:

- cash
- card
- meal card

**The three percentages must equal 100%.**

**DEFERRED:** the exact default mix; how the UI enforces the 100% total.

#### DF-49 — Do not double-count payment commissions on platform delivery **[LOCKED]**

Do **not** apply store POS or meal-card commission again to delivery sales that are already collected through the delivery platform.

Platform-collected delivery revenue is handled through the **platform deduction** model (DF-10).

The payment mix applies to **direct store sales** such as salon and takeaway, unless a later financial specification explicitly defines another treatment.

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

**Mode 1 — Platform only / merchant courier**

The platform generates the order. Delivery is handled by the merchant (own courier), not the platform courier service.

The relevant platform cost is **percentage-based and editable**.

**Mode 2 — Platform + platform courier**

The platform provides both marketplace / order generation and courier delivery.

The combined commercial burden is substantially higher.

This cost is also **percentage-based and editable**.

The product's **online selling price stays the same** in both modes (DF-46).

What changes between modes is the **percentage-based platform / service deduction** applied to delivery revenue, not the customer-facing online price.

#### DF-10a — Default editable platform deduction rates **[LOCKED]**

Default **editable** effective total deduction rates for v1:

| Mode | Default effective rate |
| --- | --- |
| Platform only / merchant courier | **15%** |
| Platform + platform courier | **38%** |

These are **default assumptions only**. The user must be able to edit them because real contractual rates vary.

Do **not** treat these defaults as authoritative market constants.

Earlier planning figures such as “roughly 12–15%” and “roughly 38%” are superseded **as open defaults** by this table. They were never market constants, and these v1 defaults are still not market constants.

**DEFERRED:** how the user chooses a mode; whether both modes can coexist.

#### DF-53 — Platform fee is a percentage of VAT-inclusive delivery gross **[LOCKED]**

Platform commission / service cost is **not** Product COGS. It is a separate **Payment / Platform Fee**.

All online customer prices are VAT-inclusive (DF-03, DF-48).

Platform fee is calculated from **VAT-inclusive gross delivery revenue**:

```
platformFee = deliveryGrossRevenue × effectivePlatformFeeRate
```

Example (illustrative of an edited rate, not a second default):

Delivery gross revenue = 100 TL  
Effective platform fee rate = 38.40%

```
platformFee = 100 × 0.384 = 38.40 TL
```

Seller remainder **before** Product COGS and other channel costs:

```
100 − 38.40 = 61.60 TL
```

#### DF-11 — Platform commission VAT as a separate accounting split **[SUPERSEDED for v1 by DF-54]**

Earlier lock: platform / courier VAT treatment was an open research item.

**v1 lock:** the user-entered percentage is the effective total deduction, VAT included. Do not model a separate platform-VAT cash line in v1.

#### DF-54 — Effective total platform deduction is VAT-inclusive **[LOCKED]**

For Detailed v1, the percentage entered by the user represents the:

**effective total platform deduction rate, VAT included.**

Therefore:

- do **not** add another 20% VAT on top of the entered platform fee rate;
- do **not** calculate `platformFee × 1.20`;
- do **not** create a separate platform service VAT cash-cost line in v1.

Example:

If the effective rate is 38.40%:

Correct: `100 × 38.40% = 38.40 TL` total deduction.

Incorrect: `38.40 + 20% = 46.08 TL`.

The service invoice may internally split the 38.40 TL into service-base + VAT components. Detailed v1 does **not** need to expose or model that accounting decomposition.

The user-facing input should conceptually mean:

`Platform toplam kesinti oranı (KDV dahil)`

This is consistent with DF-31 (no full VAT accounting engine in v1).

#### DF-55 — Platform campaigns / Joker are out of v1 **[LOCKED]**

Platform campaigns, Joker discounts, promotional subsidies, listing / reklam charges, and similar campaign mechanics are **explicitly out of v1**.

Do not add them to the engine or the standard input set.

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

Platform fee uses an effective VAT-inclusive deduction rate (DF-54). Do not add 20% on top of that rate, and do not model the service-base vs VAT split in v1.

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
| X1 | Recipe / SKU ingredient engine | Product-level selling items only; no ingredient recipes (DF-02). |
| X2 | Capacity / seat-turnover engine | Do not model seat count, table turnover, hourly capacity / throughput, or theoretical customer throughput. |
| X3 | Seasonality model | No 12-month seasonality matrix in v1 (DF-26). |
| X4 | AVM-specific rent model | Do not create a separate mall model containing turnover rent, mall marketing contribution, AVM-specific common charges, or mandatory opening-hour economics. May become a later preset / module. |
| X5 | Financing | No loans, interest, debt/equity structure, or financing schedules (DF-40). |
| X6 | Working-capital / payment-timing | No POS settlement delays, supplier terms, or daily cash timing (DF-41). |
| X7 | Income / corporate / distribution tax model | No PIT, CIT, profit-distribution withholding, or full company-tax model (DF-30). |
| X8 | Full accounting VAT engine | No per-OPEX/per-CAPEX deductible VAT, VAT carry-forward, or VAT-return machinery (DF-31). Platform fee is an effective VAT-inclusive deduction rate (DF-54); no extra 20% on top. |
| X9 | Payroll engine | No gross-salary-to-employer-cost conversion (DF-15). Detailed is not payroll software. |
| X10 | Accounting depreciation / tax useful-life machinery | CAPEX is initial investment (DF-34). |
| X11 | Complex OPEX driver system | Ordinary recurring amounts in v1 (DF-39). |
| X12 | Accounting / ERP / tax-advisory product shape | DF-00. |
| X13 | Platform campaigns / Joker / listing ads | Out of v1 (DF-55). |

---

## 7. Intentionally deferred mechanics

These are known open questions. They are listed so they are not silently closed.

| Area | What is locked | What is not locked |
| --- | --- | --- |
| Default product list | User can add products; revenue is calculated from products | No locked starter catalogue |
| Product quantity time basis | One expected quantity per product | Daily vs. monthly (and similar) |
| Category grouping | Optional organisation only; not the revenue engine | Whether grouping is required; default labels; user-addable groups |
| Channel mix defaults | One business-level split; must equal 100%; not per product | The default 50/20/30-style mix; 100% enforcement UX; delivery-mode interaction |
| POS default rate | Percentage, editable; not a fixed monthly TL amount; not applied again to platform-collected delivery | The default percentage |
| Meal-card default rate | Percentage, editable; not a fixed monthly TL amount; not applied again to platform-collected delivery | The default percentage (15% was discussed only) |
| Payment mix | Percentage-based; cash / card / meal card; must equal 100%; applies to direct store sales (salon and takeaway) | The default mix; 100% enforcement UX |
| Delivery defaults | Two percentage-based commercial modes; online price unchanged across modes | Mode-selection UX; whether both modes can coexist |
| Platform fee rates | Editable effective VAT-inclusive deduction; v1 defaults 15% (platform only) and 38% (platform + courier) | Nothing remaining on the rate meaning or v1 defaults. Do not treat defaults as market constants |
| Platform commission VAT | User-entered rate is the effective total deduction, KDV dahil (DF-54) | Accounting split of service-base vs VAT — out of v1, not a remaining v1 design task |
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
| Waste modelling | Not part of Product COGS, Channel Variable Costs, or Platform Fees as locked here | Whether waste is modelled at all in Detailed v1 |
| Channel-variable placement | Takeaway packaging, delivery packaging, own-courier variable payment if applicable | Whether packaging is business-level or per product; when own-courier payment is shown |

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
| DF-01 | Category as sales engine | **Superseded by DF-44.** |
| DF-44 | Sales unit | Product-based. User adds selling items. Engine calculates from products, not a blended category average. |
| DF-44a | Category | Optional grouping / organisation only. |
| DF-01a | Category price / cost / qty fields | **Superseded by DF-45** for revenue. Product unit cost is DF-28. |
| DF-45 | Product fields | Name, normal price, online price, expected quantity, unit product cost in TL. Selling prices VAT-inclusive. |
| DF-02 | Recipe / SKU engine | Out of Detailed v1. |
| DF-03 | Sales prices | VAT-inclusive as entered, including normal and online prices. Never silently grossed up. |
| DF-04 | Sales channels | Salon / on-premise, al-götür / takeaway, paket servis / delivery. |
| DF-04a | Channel mix | One business-level split. Must equal 100%. Not per product. |
| DF-05 | Independent takeaway price | **Superseded by DF-46.** |
| DF-46 | Normal vs online price | Salon and takeaway use normal price. Delivery uses online price. Online price is fixed and does not change with delivery mode. |
| DF-47 | Quantity split | One quantity per product, multiplied by the business-level channel mix. Time basis not locked. |
| DF-48 | Channel revenue | `qty × normalPrice` for salon and takeaway; `qty × onlinePrice` for delivery. Gross customer sales are VAT-inclusive. |
| DF-50 | Cost structure | Product COGS, Channel Variable Costs, and Payment / Platform Fees stay separate. |
| DF-28 | Product COGS | Per-product unit cost in TL. `productCOGS = unitsSold × unitProductCost`. No COGS %. |
| DF-29 | COGS vs. volume | Unit product cost constant; total product COGS follows units sold. |
| DF-52 | Channel variable costs | Takeaway packaging / order; delivery packaging / order; own-courier variable payment / delivery order if applicable. Not payroll, OPEX vehicle running costs, CAPEX, or platform commission. |
| DF-56 | Extra channel-variable fields | Do not add other standard channel-variable costs unless separately approved. |
| DF-06 | Payment methods | Cash, card, meal card — distinct from channels. Direct store sales. |
| DF-06a | Payment mix | Percentage-based. Must equal 100%. |
| DF-49 | No double-count | Do not apply POS / meal-card commission to platform-collected delivery. Payment mix applies to salon and takeaway. |
| DF-07 | Cash | No payment-processing commission. |
| DF-08 | POS | Editable percentage. Not a fixed monthly TL amount. Default rate not locked. |
| DF-09 | Meal card | Editable percentage. Not a fixed monthly TL amount. Default rate not locked. |
| DF-10 | Delivery modes | Mode 1 platform only / merchant courier; Mode 2 platform + courier. Online price unchanged across modes. |
| DF-10a | Platform fee defaults | Editable. v1 defaults 15% and 38%. Not market constants. |
| DF-53 | Platform fee formula | `platformFee = deliveryGrossRevenue × effectivePlatformFeeRate` on VAT-inclusive gross. Not Product COGS. |
| DF-11 | Platform VAT as open research | **Superseded for v1 by DF-54.** |
| DF-54 | Platform fee VAT | Entered rate is effective total deduction, KDV dahil. Do not add 20% on top. Do not split service-base vs VAT in v1. |
| DF-55 | Campaigns / Joker | Out of v1. |
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
| X1–X13 | v1 exclusions | See §6. |

### 9.2 SUPERSEDED

| ID | Previous lock | Replaced by |
| --- | --- | --- |
| DF-21 | Model şahıs vs. limited because tax economics differ; tax formulas to be specified later | DF-30 — no v1 income / corporate / distribution tax engine |
| DF-22 | Real VAT layer (output / input / payable / cash-flow) behind an advanced UX | DF-31 — no full accounting VAT engine in v1 |
| DF-01 | Category-based sales as the engine input | DF-44 — product-based revenue |
| DF-01a | Category average price, unit cost, and quantity | DF-45 — product name, normal price, online price, quantity. COGS left to the next step |
| DF-05 | Optional per-channel price overrides, including a distinct takeaway price | DF-46 — two prices only: normal (salon + takeaway) and online (delivery) |
| DF-10 open defaults | Exact platform percentages left open; discussed 12–15% / 38% not to be encoded as defaults | DF-10a — v1 editable defaults 15% and 38%, still not market constants |
| DF-11 | Platform / courier VAT treatment left open for research | DF-54 — entered rate is effective total deduction, VAT included; no extra 20%; no v1 VAT split line |

### 9.3 DEFERRED (non-exhaustive; see §7)

DF-43 (inflation / escalation), DF-42 mechanics, break-even and payback formulas, scenario multipliers, ramp-up presets, and every other **DEFERRED** row in §7 remain open. They will be resolved in follow-up tasks, then recorded in a future Detailed financial specification.

---

## 10. Relationship to existing planning documents

This file is the active **decision log** for Detailed Feasibility. It is not the Detailed product & financial specification.

Companion indexes in `docs/README.md`, `CLAUDE.md`, the architecture document, and the tech-stack document point here.

Once a Detailed financial specification exists, the following still need a later scope-boundary update:

| Document | Remaining follow-up |
| --- | --- |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` D4 | Currently says there is no router yet; tab navigation may later require an explicit routing/navigation decision |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` §4.2 | Persistence rules already cover Detailed and should remain the technical authority |
| `docs/quick-calculation-scope-v1.md` §21 / §6.2 | Lite currently says waste modelling and recipe-level costing "belong to Detailed Feasibility". Detailed v1 has now **excluded** the recipe/SKU engine. Lite also deferred detailed VAT accounting and tax to Detailed; Detailed v1 has now **excluded** a full VAT engine and a company-tax model, and treats platform fee as an effective VAT-inclusive deduction. Waste is still undecided for Detailed. The Lite document should later distinguish "out of Lite" from "in Detailed v1" |
| `docs/DESIGN_DIRECTION.md` and `docs/FRONTEND_IMPLEMENTATION_SPEC.md` | Visual inheritance is locked; Detailed screen structure, tabs, and result hierarchy are not. The Quick masthead currently assumes no navigation |

None of the above is a reason to change Lite behaviour now.

---

## 11. Changelog

| Version | Change |
| --- | --- |
| v0.1 | Initial locked decision log for Detailed Feasibility: two-mode product structure, architecture boundary, visual inheritance, category-based revenue, VAT-inclusive prices, channels and channel pricing, payment methods, delivery modes, rent net/gross convention, aidat, position-based personnel, operating expenses, company type, VAT layer, monthly cash flow, 24-month horizon, ramp-up concept, scenario requirement, and explicit v1 exclusions. Deferred mechanics recorded without being resolved. |
| v0.1.1 | Companion paths updated after docs cleanup: finished Quick execution plans now live under `docs/archive/`. |
| v0.2 | Locked Detailed v1 simplification principle; category fields (VAT-inclusive price, unit cost in TL, quantity); business-level channel mix; percentage payment mix; COGS volume behaviour; CAPEX as initial investment including opening stock; no depreciation engine; no financing or working-capital timing; no income/corporate/distribution tax model; no full VAT accounting engine; simple operating break-even (CAPEX excluded); approximate payback; simple sales-volume scenarios with fixed cost assumptions; preset-driven ramp-up; multi-month projection. Superseded DF-21 and DF-22 for v1. Inflation/escalation and platform VAT treatment remain open. |
| v0.3 | Revenue is product-based. Category is optional grouping only. Each product has name, VAT-inclusive normal price, VAT-inclusive online price, and one expected quantity. Salon and takeaway use the normal price; delivery uses the online price. Online price does not vary by delivery mode. Business-level channel mix must equal 100% and is applied to each product's quantity. Channel revenue concept locked. Payment mix must equal 100% and applies to direct store sales; do not also apply POS/meal-card commission to platform-collected delivery. COGS, packaging, waste, and recipe costing not decided in this update. Superseded DF-01, DF-01a, and DF-05. |
| v0.4 | Locked the three-way cost structure: Product COGS, Channel Variable Costs, Payment / Platform Fees. Per-product unit cost in TL; `productCOGS = unitsSold × unitProductCost`. Standard channel-variable fields: takeaway packaging, delivery packaging, own-courier variable payment if applicable. Platform fee is a percentage of VAT-inclusive delivery gross. v1 editable defaults 15% and 38%. Entered platform rate is effective total deduction, KDV dahil; do not add 20% VAT on top. Campaigns / Joker out of v1. Superseded DF-11 and the previous “platform defaults remain open” clause of DF-10. |
