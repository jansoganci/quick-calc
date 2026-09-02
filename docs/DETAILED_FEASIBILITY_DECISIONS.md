# Detailed Feasibility — Locked Decisions

**Version:** v0.9
**Status:** Decision log. The six calculation-model review blockers remain **RESOLVED**. This pass **removes** unused v1 complexity and records reviewer ideas as **LATER**, not as missing requirements. This file is still **not** a financial specification and **not** implementation.
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

Items marked **LATER** are explicitly **out of Detailed v1**. They are not missing requirements. Do not add them to the financial specification or implementation just because they would be more realistic.

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

#### DF-00a — External-review “later” ideas are not missing v1 requirements **[LOCKED]**

External review suggestions marked **LATER** in this file must **not** be treated as missing v1 requirements.

The v1 goal remains:

- materially deeper than Lite;
- simple enough for a normal small F&B operator;
- no unnecessary repeat inputs;
- no enterprise-style modelling;
- no feature expansion just because a more realistic model is theoretically possible.

Do **not** add a reviewer idea to the specification or implementation unless this log later locks it as in-scope.

### 2.3 What the two modes may and may not share

This restates the already-locked product and architecture boundary. It does not add a new sharing rule.

| Allowed | Not allowed |
| --- | --- |
| Generic utilities (safe division, money formatting, generic validation predicates) | A shared financial engine, or Lite formulas reused in Detailed "for convenience" |
| Shared, domain-neutral UI primitives and the established visual system | Detailed importing Quick business logic, or Quick importing Detailed business logic |
| Shared TypeScript primitives that carry no business meaning | Unifying the two modes into a generic engine |
| The same rent **net/gross withholding concept** as a product convention (see DF-12) | Implementing that concept by calling the Lite engine |
| The same **basic sales-VAT netting** convention as Lite (see DF-65): remove VAT from VAT-inclusive gross sales. Detailed's default rate is editable; Lite's remains a system assumption. | A shared VAT-accounting engine, deductible-VAT machinery, or importing Lite code |

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

**Not authorised by this document:** creating `core/detailed/`, `features/detailed/`, `businessModel.ts`, any Detailed UI, or any Detailed calculation engine **in this planning pass**. When implementation is requested, see §3.1.

---

### 3.1 Implementation and design responsibility **[LOCKED]**

| Work | Owner |
| --- | --- |
| Calculation engine / financial logic | **Cursor**, when implementation is requested |
| UI / UX for Detailed | **Separate Claude Design pass**, after financial behaviour is sufficiently locked |

Cursor must document the financial behaviour and required outputs clearly enough that the later Claude Design task can design the interface around them.

**Do not let UI decisions change the locked financial logic.**

The Claude Design pass should receive:

- the locked financial definitions;
- required inputs (already entered elsewhere in the business description — not extra finance fields for these outputs);
- required outputs (see DF-61);
- edge states such as unreachable break-even / unavailable payback / payback not reached within the horizon;
- scenario behaviour;
- ramp-up behaviour.

This document is the handoff source for those items. It is not a screen layout.

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

Detailed v1 revenue is **product-based**.

The user can add individual products / sales items. Examples (illustrative, not a locked catalogue):

- Americano
- Poğaça
- Bütün tavuk

The financial engine must calculate revenue **from products**, not from a single blended category average.

Unlike Lite, Detailed must not force the entire store into one average ticket.

**Product name is sufficient for v1.** Do not require a category field on each product.

#### DF-44a — Category is optional grouping only **[SUPERSEDED by DF-72]**

Earlier lock: category could exist as optional grouping / organisation, with the grouping UX left deferred.

**v1 lock:** category grouping is **out of Detailed v1** (DF-72).

#### DF-72 — No category grouping in v1 **[LOCKED]**

Remove category grouping as a calculation or input requirement.

- Revenue is product-based (DF-44).
- Product name is sufficient for v1.
- Do **not** add category management, default category lists, or user-addable grouping labels in v1.

Category grouping may become a purely presentational future feature. That is **LATER**. It is not a missing v1 requirement. Do not put it in the financial specification as an input.

#### DF-01a — Category economics fields **[SUPERSEDED by DF-45]**

Earlier lock: each category carried an average VAT-inclusive price, an average unit cost in TL, and an expected quantity.

**v1 lock:** those fields belong to **products** for revenue (DF-45). Product unit cost is locked in §5.2.

#### DF-45 — Product fields for v1 revenue **[LOCKED]**

Each product has at minimum:

- product name
- **normal** selling price
- **online / delivery** selling price
- expected **daily** sales quantity (stabilized / target — DF-66)
- **unit product cost in TL** (Product COGS — DF-28, DF-68; not a selling price)

All customer-facing selling prices are VAT-inclusive (DF-03). Net operating revenue is derived from those gross amounts (DF-65).

This is not a recipe / SKU ingredient engine (DF-02). A “product” here is a selling item the owner already sells, not a bill of materials.

Quantity time basis is locked in DF-66. Do **not** add a second quantity input.

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

A full accounting VAT engine remains **out of Detailed v1** (DF-31). The **basic** sales-VAT netting needed so operating revenue does not include collected sales VAT is locked in DF-65.

#### DF-65 — Sales VAT is netted from gross customer sales **[LOCKED]**

Detailed v1 uses the same **basic** VAT treatment already established in Lite.

This decision exists **only** to prevent operating revenue / profit from incorrectly including sales VAT. It does **not** turn Detailed into a VAT-accounting engine.

**Default sales VAT rate: 10%.** The rate is **editable by the user**.

All customer-facing sales prices remain VAT-inclusive as entered (DF-03). Gross customer sales are VAT-inclusive. Net revenue is derived by removing VAT from those gross sales:

```
netRevenue = grossCustomerSales / (1 + vatRate)
vatAmount  = grossCustomerSales − netRevenue
```

Example:

Gross selling price = 150 TL  
VAT rate = 10%

```
netRevenue = 150 / 1.10 = 136.36 TL
vatAmount  = 13.64 TL
```

Do **not** calculate VAT as `150 × 10%`.

Payment / platform commissions that are defined as percentages of customer gross sales continue to use **VAT-inclusive gross sales** as their fee base. That includes:

- platform commission (DF-53);
- card / POS commission;
- meal-card commission.

Do **not** add:

- deductible VAT by OPEX line;
- deductible VAT by CAPEX line;
- VAT carry-forward;
- VAT-return logic;
- full VAT accounting.

This is a shared **product convention** with Lite, not a licence to import Lite code. Lite's `vatRate` remains a **non-editable system assumption** in the Lite spec. Detailed's editable 10% default does **not** change Lite.

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

Do **not** require a separate channel mix for every product in v1.

Per-product salon / takeaway / delivery percentages were a reviewer suggestion, not an existing v1 requirement. They may be more realistic. They are **LATER** / out of v1 (DF-00a). Detailed v1 uses **one** business-level mix and applies that same mix across product quantities.

**DEFERRED:** the exact default mix; how the UI enforces the 100% total.

Do **not** invent a delivery-volume split inside the delivery channel (DF-77).

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

Each product has **one** expected **daily** sales quantity (stabilized / target — DF-66).

The same business-level channel mix is applied to that product's quantity.

Conceptual example:

Americano daily quantity = 100

Channel mix: salon 50% · takeaway 20% · delivery 30%

Then:

- salon quantity = 50
- takeaway quantity = 20
- delivery quantity = 30

Those channel quantities are **units**. For v1 they are also treated as order counts where a cost is defined per order (DF-67).

#### DF-66 — Sales quantity is daily; monthly uses operating days **[LOCKED]**

Each product's entered sales quantity is a **daily** stabilized / target sales quantity.

Detailed v1 also has:

`operatingDaysPerMonth`

**Default: 30.** Editable by the user.

Monthly stabilized quantity:

```
monthlyProductQuantity = dailyProductQuantity × operatingDaysPerMonth
```

This same daily → monthly basis must be used consistently for:

- revenue
- Product COGS
- Channel Variable Costs
- Payment / Platform Fees
- break-even daily / monthly conversions
- scenarios
- ramp-up
- projection

Do **not** leave daily vs monthly quantity ambiguous. Do **not** add a second quantity input (daily *and* monthly).

When scenario and ramp-up apply, they first change the **effective daily** quantity (DF-69); then that effective daily quantity is multiplied by `operatingDaysPerMonth`.

#### DF-67 — Per-order equals per-unit in v1 **[LOCKED]**

Detailed v1 does **not** introduce basket-size or items-per-order modelling.

For this simplified feasibility model:

- the product sales quantity distributed to delivery is also treated as delivery **order count**;
- the product sales quantity distributed to takeaway is also treated as takeaway **order count**.

Example:

Americano daily sales quantity = 100  
Delivery mix = 30%

Delivery quantity = 30  
For v1, this is treated as **30 delivery orders**.

Therefore:

```
deliveryOrderCount  = deliveryUnitCount
takeawayOrderCount  = takeawayUnitCount
```

This is an **intentional simplification**.

Basket size / items per order / customer count were mentioned in external review. They are **LATER** / out of v1. They are not missing v1 requirements (DF-00a).

Do **not** add:

- average basket size;
- products per order;
- customer count;
- order composition.

If an own-courier variable payment is 40 TL per delivery order:

```
deliveryCourierVariableCost = deliveryOrderCount × 40 TL
```

Under the v1 simplification, that is equivalent to:

```
deliveryUnitCount × 40 TL
```

The same equivalence applies to takeaway packaging (per takeaway order = per takeaway unit) and delivery packaging (per delivery order = per delivery unit).

#### DF-48 — Product revenue by channel **[LOCKED]**

For each product, conceptual revenue is:

```
salonRevenue     = salonQuantity     × normalPrice
takeawayRevenue  = takeawayQuantity  × normalPrice
deliveryGross    = deliveryQuantity  × onlinePrice
```

Total gross customer sales are the sum of those channel revenues across products.

All of these customer sales values are **VAT-inclusive**.

Net operating revenue is derived from that gross total (DF-65). Do **not** treat VAT-inclusive gross as operating revenue.

Platform / service deductions are applied to **VAT-inclusive** delivery revenue under DF-10 / DF-53. They do not change `onlinePrice`.

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

`unitProductCost` means the **direct base cost of the product itself**.

It excludes channel-specific fulfillment costs and payment / platform fees. The boundary is locked in DF-68.

Example (illustrative):

Americano:

- selling price: 150 TL
- unit product cost: 30 TL

No recipe engine. No ingredient-level costing. **No COGS percentage input.**

#### DF-68 — Product COGS excludes channel and payment costs **[LOCKED]**

Lock the definition of Product COGS clearly.

`unitProductCost` is the direct base cost of the product itself.

Product COGS does **not** include:

- takeaway packaging;
- delivery packaging;
- own-courier variable payment;
- platform commission;
- card commission;
- meal-card commission.

Those remain separate:

```
Product COGS
+
Channel Variable Costs
+
Payment / Platform Fees
```

The UI copy later must make this distinction clear to prevent double-entry. Do **not** ask the user to fold packaging, courier, or commissions into `unitProductCost`.

This does not add new cost fields. It restates the DF-50 split so the later specification and UI cannot collapse it.

#### DF-29 — Product COGS follows units sold **[LOCKED]**

Conceptual formula:

```
productCOGS = unitsSold × unitProductCost
```

Unit product cost **stays constant** when sales volume changes. Total product COGS increases or decreases with units sold.

This also applies when comparing sales-volume scenarios (DF-37).

Time-based **annual COGS increase** in the projection is a separate mechanism (DF-43). It does not reopen this volume rule.

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

For v1, “per order” on these lines uses the DF-67 simplification: order count equals the matching channel unit count.

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

#### DF-62 — Waste / fire modelling is out of Detailed v1 **[LOCKED]**

Waste / fire modelling is **out of Detailed v1**.

Do **not** add:

- waste percentage;
- spoilage percentage;
- recipe loss;
- waste-adjusted COGS.

If needed later, it will be a separate feature.

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

**v1 editable default: 3.59%.**

This is a default only. Do **not** hardcode it as an immutable constant.

The commission is applied to **VAT-inclusive gross** direct-store card sales, not to net-of-VAT revenue (DF-65).

Lite's locked POS default remains **3.56%** in the Lite spec. Detailed's 3.59% default does **not** change Lite.

#### DF-09 — Meal-card commission is a percentage **[LOCKED]**

Meal-card commission follows the same principle as POS:

- percentage-based;
- editable by the user;
- not a fixed monthly TL expense.

**v1 editable default: 10%.**

This is a default only. Do **not** hardcode it as an immutable constant.

The commission is applied to **VAT-inclusive gross** direct-store meal-card sales, not to net-of-VAT revenue (DF-65).

A provisional 15% figure was discussed earlier. It is **not** the v1 default.

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

#### DF-77 — No platform vs own-channel delivery volume split **[LOCKED]**

Do **not** add a separate split of delivery volume such as:

- 60% platform delivery
- 40% phone / WhatsApp / own-site delivery

That was a reviewer suggestion, not an existing v1 requirement. It is **LATER** / out of v1 (DF-00a).

Detailed v1 keeps the already locked simple delivery-mode model (DF-10):

- the delivery **quantity** is the delivery slice of the one business-level channel mix;
- Mode 1 vs Mode 2 chooses the **platform / service deduction** applied to that delivery quantity;
- there is no second mix inside the delivery channel.

#### DF-10a — Default editable platform deduction rates **[LOCKED]**

Default **editable** effective total deduction rates for v1:

| Mode | Default effective rate |
| --- | --- |
| Platform only / merchant courier | **15%** |
| Platform + platform courier | **38%** |

These are **default assumptions only**. The user must be able to edit them because real contractual rates vary.

Do **not** treat these defaults as authoritative market constants.

Earlier planning figures such as “roughly 12–15%” and “roughly 38%” are superseded **as open defaults** by this table. They were never market constants, and these v1 defaults are still not market constants.

**DEFERRED:** how the user chooses a mode; whether both modes can coexist. That does not reopen a delivery-volume split (DF-77).

#### DF-53 — Platform fee is a percentage of VAT-inclusive delivery gross **[LOCKED]**

Platform commission / service cost is **not** Product COGS. It is a separate **Payment / Platform Fee**.

All online customer prices are VAT-inclusive (DF-03, DF-48).

Platform fee is calculated from **VAT-inclusive gross delivery revenue**:

```
platformFee = deliveryGrossRevenue × effectivePlatformFeeRate
```

The fee base is **gross customer sales**, not net-of-VAT revenue (DF-65). Do **not** switch this base to `netRevenue`.

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

This update does **not** change the rent model. DF-12 and DF-13 remain as locked.

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

Rent KDV is not being invented here. Any rent increase over the projection uses the **fixed operating cost annual increase** (DF-43), not a separate rent-inflation input.

#### DF-13 — Aidat is a standard occupancy expense **[LOCKED]**

Common-area / maintenance fee (**aidat**) is included as a standard occupancy-related expense.

It can start **empty**. Do not force a benchmark or default number.

---

### 5.6 Personnel

#### DF-14 — Personnel is position-based **[LOCKED]**

Detailed v1 personnel is **position-based**.

Users can add positions with an interaction such as:

`+ Pozisyon Ekle`

Illustrative examples (not a locked default roster):

- Barista
- Kitchen
- Service
- Manager
- etc.

Every business can have a different team structure.

Owner / operator economics are **not** an employee position (DF-59).

#### DF-15 / DF-16 / DF-60 — Position fields and monthly cost **[LOCKED]**

Each position contains:

- position name
- headcount
- monthly employer cost per person
- monthly meal cost per person
- monthly transportation cost per person
- monthly average bonus / ikramiye per person

Do **not** build a gross-salary-to-employer-cost payroll engine in v1.

The user enters the **monthly employer cost directly**.

Bonus / ikramiye is entered as an **average monthly amount**. Do **not** add annual / quarterly bonus frequency logic.

Conceptual formula:

```
positionMonthlyCost = headcount × (employerCostPerPerson + mealPerPerson + transportPerPerson + averageBonusPerPerson)
```

Total payroll is the **sum of all position monthly costs**.

This extends the earlier DF-15 / DF-16 locks: meals, transportation, and bonus are per-person monthly fields on each position, not a later unspecified granularity.

**DEFERRED:** default position roster; which per-person cost fields may start empty / zero; exact Turkish field labels.

#### DF-59 — Owner / operator section is separate **[LOCKED]**

Owner / operator economics are **separate from employee positions**.

Include a separate owner / operator section with:

- owner monthly salary / amount allocated to the owner
- Bağ-Kur monthly cost

Both are treated as **monthly operating costs**.

Do **not** calculate personal income tax. Do **not** create a payroll engine for the owner.

This replaces the earlier deferred UX for DF-17 / DF-42 (optional toggle vs. line placement). The v1 shape is this separate section with those two monthly amounts.

Do not invent Bağ-Kur rates, brackets, or a Bağ-Kur calculator. The user enters the monthly Bağ-Kur cost.

**DEFERRED:** exact Turkish labels; whether either amount may start empty / zero; whether more than one owner is modelled.

---

### 5.7 Operating expenses

#### DF-57 — OPEX is a simple monthly model **[LOCKED]**

Detailed v1 uses a simple **monthly** OPEX model.

Do **not** add:

- annual frequency;
- quarterly frequency;
- per-sqm drivers;
- stepped costs;
- semi-variable driver systems;
- complex recurrence logic.

All OPEX values are entered as **average monthly amounts**.

If the real expense occurs annually or occasionally, the user enters its **average monthly equivalent**.

Example:

Annual pest-control cost = 24,000 TL

User enters:

`2,000 TL / month`

The calculation engine uses that monthly amount. This is the same scope principle as DF-00: deeper than Lite, without accounting-style recurrence rules.

#### DF-18 / DF-19 / DF-20 — Standard monthly OPEX lines **[LOCKED]**

Detailed must not start with a completely blank expense sheet.

Provide common monthly expense lines such as:

- electricity
- water
- natural gas
- internet
- security (alarm / camera / surveillance as **one** line)
- software subscriptions
- accountant / mali müşavir
- cleaning
- maintenance / repair
- insurance
- consumables
- pest control / ilaçlama

Pest control is **explicitly** part of the model. Do **not** treat cleaning as meaning pest control is automatically included.

Do **not** expose unnecessary micro-lines.

Camera / alarm / security are **one** simple security-related OPEX line. Do **not** split them.

Do **not** create a separate water-treatment / filter line. If needed, that cost falls under **maintenance / repair** or a custom OPEX line (DF-58).

This supersedes the earlier DF-20 note that water treatment / filter maintenance was a distinct applicable facility line.

Exact Turkish UI labels can be refined later.

**DEFERRED:** which standard lines start empty vs. with a suggested amount; grouping / section headings in the UI. Do not add further standard micro-lines to fill that deferred row.

#### DF-58 — Custom OPEX **[LOCKED]**

Users can add additional operating expenses with:

`+ Gider Ekle`

Keep this for anything specific to the business, including costs that used to look like extra standard micro-lines.

A custom expense only needs:

- expense name
- average monthly amount

Do **not** create a complex expense-driver system for custom expenses in v1.

#### DF-39 — No complex OPEX driver system in v1 **[LOCKED]**

Do not introduce an unnecessarily complex driver system in v1.

All regular operating expenses ultimately resolve to a **simple monthly amount** used by the calculation engine.

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

#### DF-21 — Company-type tax engine **[SUPERSEDED for v1 by DF-30 and DF-70]**

Earlier intention: model şahıs işletmesi vs. limited şirket because tax economics differ.

**v1 lock:** Detailed will **not** calculate personal income tax, corporate income tax, profit-distribution withholding, or a full company-tax model.

There is also **no** company-type input in v1 (DF-70).

#### DF-30 — No income / corporate / distribution tax model in v1 **[LOCKED]**

Out of Detailed v1:

- personal income tax;
- corporate income tax;
- profit-distribution withholding;
- a full company-tax model.

This is part of DF-00: Detailed is not a professional tax-advisory model.

#### DF-70 — No company-type input in v1 **[LOCKED]**

Remove şahıs / limited as a v1 input.

Company type currently has **no calculation effect**, because Detailed v1 does not calculate personal income tax, corporate tax, profit-distribution withholding, or a full company-tax model (DF-30).

Do **not** keep a non-calculating company-type control “just in case”.

**Bağ-Kur** and **owner / operator cost** remain separately modelled (DF-59). Removing company type does not remove those fields and does not create a tax-calculation gap.

This closes the earlier deferred question of whether a non-calculating şirket türü control still appears in v1 UX. It does not.

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

Sales prices remain VAT-inclusive as **entered** (DF-03). Operating revenue uses **net-of-VAT** sales (DF-65). That basic netting is **not** a full VAT engine.

Platform fee uses an effective VAT-inclusive deduction rate (DF-54). Do not add 20% on top of that rate, and do not model the service-base vs VAT split in v1.

Percentage commissions continue to use VAT-inclusive **gross** as their fee base (DF-65).

---

### 5.10 Projection and ramp-up

#### DF-23 — Simple monthly projection **[LOCKED]**

Detailed includes a **simple monthly projection**.

Default horizon: **24 months**, chosen from locked presets (DF-71).

The projection exists to show how the business may evolve from opening toward stabilized operations, and to support approximate investment payback (DF-36).

This is **not**:

- a working-capital model;
- a payment-settlement timing model;
- a supplier-credit model;
- a daily cash-flow model;
- financing schedules;
- seasonality.

**DEFERRED:** the projection statement shape and line list; opening-cash presentation; exact CAPEX timing vs. month 1. Horizon control is locked in DF-71.

#### DF-24 — Default projection horizon is 24 months **[LOCKED; control superseded by DF-71]**

Default projection horizon: **24 months**.

#### DF-71 — Projection horizon is a preset, not a free number **[LOCKED]**

Do **not** let the user enter an arbitrary month count.

Use only these projection presets:

- **12 months**
- **24 months** — default
- **36 months**

No free numeric horizon input in v1.

Payback “not reached within the projection period” uses whichever preset is selected.

#### DF-25 — Ramp-up presets **[LOCKED]**

Opening-period ramp-up is part of Detailed v1.

It must remain **simple and preset-driven**.

The product sales quantities entered by the user represent the **stabilized / target daily** sales volume of the business (DF-66).

The user should **not** enter a month-by-month sales table. Do **not** create custom monthly ramp-up editing in v1.

The percentages below are applied to the **scenario-adjusted** stabilized quantity (DF-69), not to the original base quantity after the scenario has already been applied.

Use these three presets:

**Slow / Yavaş**

| Month | % of scenario-adjusted stabilized quantity |
| --- | --- |
| 1 | 40% |
| 2 | 55% |
| 3 | 70% |
| 4 | 80% |
| 5 | 90% |
| 6+ | 100% |

**Normal**

| Month | % of scenario-adjusted stabilized quantity |
| --- | --- |
| 1 | 60% |
| 2 | 75% |
| 3 | 85% |
| 4 | 95% |
| 5+ | 100% |

**Fast / Hızlı**

| Month | % of scenario-adjusted stabilized quantity |
| --- | --- |
| 1 | 80% |
| 2 | 90% |
| 3+ | 100% |

Ramp-up changes **sales volume only**.

It does **not** change selling prices. It does **not** change unit costs.

It should naturally flow through:

- revenue
- Product COGS
- Channel Variable Costs
- Payment / Platform Fees
- operating result
- multi-month projection
- estimated payback

Ramp-up is always relative to the **scenario-adjusted** stabilized quantity. The order of operations is locked in DF-69.

#### DF-69 — Scenario, then ramp-up **[LOCKED]**

Lock the order explicitly:

```
base stabilized quantity
→ scenario multiplier
→ monthly ramp-up multiplier
```

Formula concept:

```
effectiveDailyQuantity = stabilizedDailyQuantity × scenarioMultiplier × rampUpMultiplier
monthlyQuantity        = effectiveDailyQuantity × operatingDaysPerMonth
```

Example:

Stabilized daily quantity = 100  
Bad scenario multiplier = 0.75  
Month 1 Normal ramp-up = 0.60

```
100 × 0.75 × 0.60 = 45 effective daily units
```

Ramp-up is always relative to the scenario-adjusted stabilized level.

Do **not**:

- apply the scenario multiplier twice;
- apply ramp-up twice;
- let ramp-up affect selling prices;
- let ramp-up affect unit costs;
- let Month 6 of a Bad scenario jump back to 100% of the original base quantity.

At 100% ramp-up, the Bad scenario remains at **75%** of the original stabilized quantity.

`operatingDaysPerMonth` is applied **after** those two multipliers (DF-66).

#### DF-26 — Seasonality is not part of Detailed v1 **[LOCKED]**

Do not add a 12-month seasonality matrix in v1.

This was explicitly decided against for now because the model is already sufficiently complex.

Seasonality, including a monthly seasonality matrix or seasonal coefficients, is **LATER** / out of v1. It is not a missing v1 requirement (DF-00a).

#### DF-43 — Three annual increase assumptions **[LOCKED model; default rates OPEN]**

Detailed v1 will **not** use one generic inflation percentage for everything.

Use **three separate annual assumptions**:

1. Sales price annual increase
2. Product COGS annual increase
3. Fixed operating cost annual increase

The third group includes concepts such as:

- payroll
- owner / operator cost
- Bağ-Kur
- rent
- aidat
- regular OPEX

Do **not** split that third group into separate inflation assumptions in v1.

**CAPEX** is an initial investment and **does not escalate** after opening.

For the monthly projection, annual rates are converted using this timing:

```
valueAtMonthM = baseValue × (1 + r) ^ ((m − 1) / 12)
```

Therefore:

- Month 1 exponent = 0
- Month 1 value = the exact values entered by the user
- escalation begins **after** the initial month

Do **not** apply one month of escalation immediately to Month 1.

This applies independently to the three locked annual escalation groups:

- sales price increase
- Product COGS increase
- fixed operating cost increase

The equivalent monthly compound factor is still:

```
monthlyFactor = (1 + annualRate) ^ (1 / 12)
```

That factor is used to step **from** month `m` **to** month `m+1`. It is **not** applied before Month 1.

Conceptual treatment:

- selling prices follow Sales Price Annual Increase
- unit Product COGS follows Product COGS Annual Increase
- payroll / rent / OPEX follow Fixed Operating Cost Annual Increase
- CAPEX remains unchanged

**Exact default percentages for these three annual assumptions are not locked.** Keep them user-editable. Do not invent defaults here.

Do **not** add more escalation categories in v1.

These three rates remain part of the **financial model**. They must **not** be prominent in the primary input flow. In the later UI they belong to a **secondary / advanced assumptions** area (DF-74).

#### DF-74 — Escalation inputs are secondary / advanced **[LOCKED]**

The three annual escalation assumptions stay in the model (DF-43).

They are **not** primary business-description fields.

The later Claude Design pass must place them in a secondary / advanced assumptions area. Do not put them in the main product / cost / personnel flow.

This is a placement rule, not a new calculation.

---

### 5.11 Scenarios

#### DF-27 — Three simple scenarios **[LOCKED]**

Detailed v1 uses a deliberately simple scenario model.

Three scenarios:

- Bad / Kötü
- Base / Baz
- Good / İyi

Do **not** create per-input scenario overrides in v1.

#### DF-37 — The primary scenario variable is sales volume **[LOCKED]**

The primary scenario variable is **sales volume**.

Scenario changes apply **proportionally to product sales quantities**.

They apply to the **stabilized daily** quantity **before** ramp-up (DF-69).

The following assumptions remain **fixed** across scenarios:

- product mix
- normal prices
- online prices
- channel mix
- payment mix
- unit Product COGS
- packaging / channel-variable unit costs
- platform commission rates
- card / meal-card commission rates
- payroll
- owner / operator cost
- Bağ-Kur
- rent
- aidat
- OPEX
- CAPEX

Total Product COGS and other variable costs still change naturally because sales quantity changes.

#### DF-37a — Editable scenario volume defaults **[LOCKED]**

v1 editable defaults:

| Scenario | Sales-volume change vs. entered stabilized quantities |
| --- | --- |
| Bad / Kötü | **−25%** |
| Base / Baz | **0%** |
| Good / İyi | **+25%** |

These are **editable defaults**, not immutable constants.

Scenario multipliers apply **proportionally to product sales quantities**, then ramp-up applies to that scenario-adjusted level (DF-69).

Do **not** create per-field scenario override machinery.

---

### 5.12 Break-even and payback

#### DF-35 — Operating break-even is derived automatically **[LOCKED]**

Detailed v1 will calculate **operating break-even automatically**.

The user should **not** enter a separate break-even input. The calculation uses the financial information already entered elsewhere.

**CAPEX is not included** in operating break-even.

Do **not** mix operating break-even with investment payback.

Fixed monthly costs include concepts such as:

- payroll
- owner / operator cost
- Bağ-Kur
- rent
- aidat
- monthly OPEX

Variable costs that move with sales include:

- Product COGS
- Channel Variable Costs
- Payment Fees
- Platform Fees

The engine should derive a **weighted contribution per sale** from the current product mix, prices, channel mix, payment mix, and variable costs.

Conceptual formula:

```
breakEvenMonthlySalesCount = monthlyFixedCosts / weightedContributionPerSale
```

If weighted contribution per sale is **less than or equal to zero**, break-even is **unavailable / unreachable** under the current assumptions.

Primary user-facing break-even outputs:

- approximate **units / day** required to break even
- approximate **units / month** required to break even

A TL revenue equivalent may exist **only as a secondary derived value** if the later design benefits from it.

Do **not** make break-even revenue another primary KPI. Do **not** make it an input.

Daily break-even conversion uses the same `operatingDaysPerMonth` basis as sales quantity (DF-66).

**DEFERRED:** the exact weighting algebra for contribution per sale (belongs in the eventual financial spec, following this concept). Do not invent that algebra here.

#### DF-36 — Investment payback from the projection **[LOCKED]**

Detailed will calculate investment payback **automatically**.

The user should **not** enter a separate payback assumption.

Total initial investment is the **sum of the approved CAPEX / opening investment items** (DF-32, DF-33), including:

- fit-out
- equipment
- furniture
- signage
- opening stock
- setup / opening expenses
- custom investment items

The preferred payback calculation uses the **multi-month projection**:

- calculate monthly operating profit;
- accumulate operating profit month by month;
- the estimated payback month is the **first month** where cumulative operating profit **equals or exceeds** total initial investment.

Opening ramp-up therefore affects payback **without extra user inputs**.

If cumulative operating profit **never** reaches the investment within the modelled horizon, show that payback is **not reached within the projection period**.

If operating economics remain **non-positive**, payback is **unavailable**.

Do **not** add accounting depreciation / useful-life machinery for this.

#### DF-61 — Engine-derived analysis, not extra finance fields **[LOCKED]**

These outputs should require little or no additional financial input from the user.

The user describes the business once. The engine derives:

- monthly operating result
- break-even **units / day** and **units / month**
- total initial investment
- estimated payback
- Bad / Base / Good scenario results
- multi-month projection

Break-even revenue is not a primary derived output (DF-35).

The only extra calculation defaults locked for quantity / VAT netting remain:

- sales VAT rate (default 10%, editable — DF-65);
- `operatingDaysPerMonth` (default 30, editable — DF-66).

They are not extra analysis worksheets. Do **not** add further finance fields for these outputs.

**Product principle:** Detailed should provide deeper analysis through the engine, not by forcing the user to fill more finance fields.

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
| X8 | Full accounting VAT engine | No per-OPEX/per-CAPEX deductible VAT, VAT carry-forward, or VAT-return machinery (DF-31). Basic sales-VAT netting from gross customer sales is **in** v1 (DF-65). Platform fee is an effective VAT-inclusive deduction rate (DF-54); no extra 20% on top. Percentage commissions stay on VAT-inclusive gross. |
| X9 | Payroll engine | No gross-salary-to-employer-cost conversion (DF-15). Detailed is not payroll software. |
| X10 | Accounting depreciation / tax useful-life machinery | CAPEX is initial investment (DF-34). |
| X11 | Complex OPEX driver / recurrence system | Monthly amounts only (DF-39, DF-57). No annual/quarterly/per-sqm/stepped drivers. |
| X12 | Accounting / ERP / tax-advisory product shape | DF-00. |
| X13 | Platform campaigns / Joker / listing ads | Out of v1 (DF-55). |
| X14 | Per-input scenario overrides | Scenarios scale sales quantities only (DF-37). |
| X15 | Month-by-month ramp-up sales table | Preset-driven ramp-up only (DF-25). |
| X16 | Extra break-even or payback inputs | Derived automatically from the business description (DF-35, DF-36, DF-61). |
| X17 | Waste / fire / spoilage / waste-adjusted COGS | Out of Detailed v1 (DF-62). |
| X18 | Basket size / items-per-order / customer-count modelling | Out of v1. Per-order channel costs use unit counts (DF-67). **LATER**, not a missing requirement. |
| X19 | Company-type input (şahıs / limited) | No v1 input (DF-70). No tax engine (DF-30). Owner / Bağ-Kur remain. |
| X20 | Free-form projection horizon | Presets only: 12 / 24 / 36 months; default 24 (DF-71). |
| X21 | Category grouping / category management | Out of v1. Product name is sufficient (DF-72). Presentational grouping is **LATER**. |
| X22 | Platform vs own-channel delivery volume split | Out of v1 (DF-77). Delivery mode stays DF-10. |
| X23 | Per-product channel mix | Out of v1. One business-level mix only (DF-04a). **LATER**, not a missing requirement. |
| X24 | Extra standard OPEX micro-lines | Camera/alarm/security are one line; no separate water-treatment line (DF-18/19/20). Use `+ Gider Ekle`. |

---

## 6.1 LATER — reviewer ideas that must not enter v1 **[LOCKED]**

These were mentioned in external review. They were **not** requested as part of Detailed v1. Record them so they cannot accidentally enter the specification or implementation.

| Idea | v1 status | Notes |
| --- | --- | --- |
| Seasonality / monthly seasonal coefficients | **LATER** / already excluded | DF-26, X3. No matrix in v1. |
| Basket size / items per order / customer count | **LATER** / already excluded | DF-67, X18. `deliveryUnitCount = deliveryOrderCount`; same for takeaway. |
| Delivery split between platform and own channel (phone / WhatsApp / own-site) | **LATER** / never a v1 requirement | DF-77, X22. Keep the locked Mode 1 / Mode 2 model. |
| Per-product salon / takeaway / delivery mix | **LATER** / never a v1 requirement | DF-04a, X23. One business-level mix applied to all products. |
| Category grouping as a product-organisation feature | **LATER** | DF-72, X21. Not an input in v1. |

External review suggestions marked **LATER** must not be treated as missing v1 requirements (DF-00a).

---

## 7. Intentionally deferred mechanics

These are known open questions. They are listed so they are not silently closed.

| Area | What is locked | What is not locked |
| --- | --- | --- |
| Default product list | User can add products; revenue is calculated from products | No locked starter catalogue |
| Product quantity time basis | Entered quantity is **daily** stabilized / target; `operatingDaysPerMonth` default **30**, editable; `monthly = daily × operatingDaysPerMonth` (DF-66) | — |
| Per-order vs per-unit | `deliveryOrderCount = deliveryUnitCount`; `takeawayOrderCount = takeawayUnitCount` (DF-67) | No basket size, products per order, customer count, or order composition |
| Sales VAT netting | Gross customer sales are VAT-inclusive; `netRevenue = gross / (1 + vatRate)`; default **10%**, editable (DF-65) | Full VAT accounting — out of v1 (DF-31) |
| Product COGS boundary | `unitProductCost` is the product itself only; excludes packaging, courier, platform/card/meal-card fees (DF-68) | UI copy that prevents double-entry (later Claude Design pass) |
| Category grouping | **Out of v1.** Product name is sufficient (DF-72) | Presentational grouping only — **LATER**, not a missing v1 input |
| Channel mix defaults | One business-level split; must equal 100%; **not** per product (DF-04a) | The default 50/20/30-style mix; 100% enforcement UX |
| Delivery volume split | Delivery quantity is the delivery slice of the business mix; Mode 1 / Mode 2 is the deduction model (DF-10, DF-77) | No platform vs own-channel volume split — **LATER** |
| POS default rate | Editable percentage; v1 default **3.59%**; not an immutable constant; not applied again to platform-collected delivery | — |
| Meal-card default rate | Editable percentage; v1 default **10%**; not an immutable constant; not applied again to platform-collected delivery | — |
| Payment mix | Percentage-based; cash / card / meal card; must equal 100%; applies to direct store sales (salon and takeaway) | The default mix; 100% enforcement UX |
| Delivery defaults | Two percentage-based commercial modes; online price unchanged across modes | Mode-selection UX; whether both modes can coexist |
| Platform fee rates | Editable effective VAT-inclusive deduction; v1 defaults 15% (platform only) and 38% (platform + courier) | Nothing remaining on the rate meaning or v1 defaults. Do not treat defaults as market constants |
| Platform commission VAT | User-entered rate is the effective total deduction, KDV dahil (DF-54) | Accounting split of service-base vs VAT — out of v1, not a remaining v1 design task |
| Aidat default | Standard line; may start empty | Label grouping only |
| Personnel additional costs | Per-person monthly meal, transport, and average monthly bonus on each position | Default roster; which fields start empty / zero; Turkish labels |
| Owner / operator | Separate section: owner monthly amount + Bağ-Kur monthly cost; both operating costs; no owner PIT / payroll engine | Exact labels; empty/zero start; more than one owner |
| Standard OPEX list | Merged security line; no separate camera or water-treatment lines; monthly average amounts; `+ Gider Ekle` for business-specific costs | Exact Turkish labels; which remaining lines start empty vs suggested |
| Custom OPEX | `+ Gider Ekle`; name + average monthly amount | — |
| Company-type control | **Removed.** No şahıs / limited input (DF-70). Owner / Bağ-Kur remain | — |
| Projection internals | Simple monthly projection; presets **12 / 24 / 36**; default **24**; not working-capital / settlement / supplier-credit / daily cash | Statement shape; CAPEX timing vs. month 1 |
| Ramp-up | Locked Slow / Normal / Fast monthly % of scenario-adjusted stabilized quantity; sales volume only; no custom monthly table | — |
| Scenario multipliers | Bad −25% / Base 0% / Good +25%; editable defaults; proportional to product quantities; listed assumptions stay fixed | — |
| Scenario × ramp-up order | `stabilizedDaily × scenarioMultiplier × rampUpMultiplier`, then × `operatingDaysPerMonth` (DF-69) | — |
| Inflation / escalation | Three annual assumptions stay in the **model**; Month 1 = entered values; CAPEX does not escalate; **not** prominent in the primary input flow (DF-74) | **Default percentages** for the three rates; exact advanced-area UI |
| CAPEX recovery presentation | No accounting depreciation; payback uses cumulative operating profit vs. investment | Whether any other recovery-allocation figure is shown |
| Operating break-even | Automatic; `fixed / weightedContributionPerSale`; CAPEX excluded; primary outputs **units/day** and **units/month**; daily conversion uses `operatingDaysPerMonth`; unreachable if contribution ≤ 0 | Exact contribution weighting algebra; whether a secondary TL revenue figure is shown |
| Payback | Automatic from projection; first month cumulative operating profit ≥ total CAPEX; ramp-up affects it; not reached / unavailable edge states | — |
| Waste modelling | Out of Detailed v1 (DF-62) | — |
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
- any Detailed UI (that is a later Claude Design pass — §3.1);
- any Detailed calculation engine **until implementation is explicitly requested**;
- any change to the Quick / Lite financial engine.

Generic utilities and visual primitives may be shared later when reuse is genuine. That reuse is not being designed now.

---

## 9. Decisions register

### 9.1 LOCKED

| ID | Decision | Resolution |
| --- | --- | --- |
| DF-00 | Product shape | Detailed, but usable. Not accounting, ERP, payroll, or tax-advisory software. Challenge inputs a normal owner would not know. |
| DF-00a | Reviewer “later” ideas | Not missing v1 requirements. Do not add them because they are more realistic. |
| DF-UI | Navigation and visual system | Tab-style access. Detailed inherits Lite's visual language, typography philosophy, near-monochrome system, accent discipline, hairlines/whitespace, mobile quality, and Turkish-first v1 copy. Form/result structure may differ. |
| DF-01 | Category as sales engine | **Superseded by DF-44.** |
| DF-44 | Sales unit | Product-based. User adds selling items. Product name is sufficient. Engine calculates from products, not a blended category average. |
| DF-44a | Category grouping | **Superseded by DF-72.** |
| DF-72 | No category grouping | Out of v1. No category management. Presentational grouping is LATER. |
| DF-01a | Category price / cost / qty fields | **Superseded by DF-45** for revenue. Product unit cost is DF-28. |
| DF-45 | Product fields | Name, normal price, online price, expected **daily** quantity, unit product cost in TL. Selling prices VAT-inclusive. Net revenue via DF-65. No category field. |
| DF-02 | Recipe / SKU engine | Out of Detailed v1. |
| DF-03 | Sales prices | VAT-inclusive as entered, including normal and online prices. Never silently grossed up. |
| DF-65 | Sales VAT netting | Default 10%, editable. `netRevenue = grossCustomerSales / (1 + vatRate)`. Never `price × vatRate`. Percentage commissions stay on VAT-inclusive gross. Not a full VAT engine. |
| DF-04 | Sales channels | Salon / on-premise, al-götür / takeaway, paket servis / delivery. |
| DF-04a | Channel mix | One business-level split. Must equal 100%. Not per product. Per-product mix is LATER. |
| DF-05 | Independent takeaway price | **Superseded by DF-46.** |
| DF-46 | Normal vs online price | Salon and takeaway use normal price. Delivery uses online price. Online price is fixed and does not change with delivery mode. |
| DF-47 | Quantity split | One **daily** quantity per product, multiplied by the business-level channel mix. |
| DF-66 | Quantity time basis | Daily stabilized quantity. `operatingDaysPerMonth` default 30, editable. `monthly = daily × operatingDaysPerMonth`. Same basis everywhere listed in DF-66. |
| DF-67 | Per-order simplification | `deliveryOrderCount = deliveryUnitCount`; `takeawayOrderCount = takeawayUnitCount`. Basket size is LATER. |
| DF-48 | Channel revenue | `qty × normalPrice` for salon and takeaway; `qty × onlinePrice` for delivery. Gross customer sales are VAT-inclusive; operating revenue is net of VAT (DF-65). |
| DF-50 | Cost structure | Product COGS, Channel Variable Costs, and Payment / Platform Fees stay separate. |
| DF-28 | Product COGS | Per-product unit cost in TL. `productCOGS = unitsSold × unitProductCost`. No COGS %. Direct product cost only (DF-68). |
| DF-68 | Product COGS boundary | Excludes takeaway/delivery packaging, own-courier variable payment, platform/card/meal-card commissions. |
| DF-29 | COGS vs. volume | Unit product cost constant; total product COGS follows units sold. |
| DF-52 | Channel variable costs | Takeaway packaging / order; delivery packaging / order; own-courier variable payment / delivery order if applicable. Per-order = per-unit (DF-67). Not payroll, OPEX vehicle running costs, CAPEX, or platform commission. |
| DF-56 | Extra channel-variable fields | Do not add other standard channel-variable costs unless separately approved. |
| DF-06 | Payment methods | Cash, card, meal card — distinct from channels. Direct store sales. |
| DF-06a | Payment mix | Percentage-based. Must equal 100%. |
| DF-49 | No double-count | Do not apply POS / meal-card commission to platform-collected delivery. Payment mix applies to salon and takeaway. |
| DF-07 | Cash | No payment-processing commission. |
| DF-08 | POS | Editable percentage. v1 default **3.59%**. Applied to VAT-inclusive gross direct-store card sales. Not an immutable constant. Does not change Lite's 3.56%. |
| DF-09 | Meal card | Editable percentage. v1 default **10%**. Applied to VAT-inclusive gross direct-store meal-card sales. Not an immutable constant. Earlier 15% discussion is not the default. |
| DF-10 | Delivery modes | Mode 1 platform only / merchant courier; Mode 2 platform + courier. Online price unchanged across modes. |
| DF-77 | Delivery volume split | No platform vs own-channel (phone / WhatsApp / own-site) split. LATER, not a v1 requirement. |
| DF-10a | Platform fee defaults | Editable. v1 defaults 15% and 38%. Not market constants. |
| DF-53 | Platform fee formula | `platformFee = deliveryGrossRevenue × effectivePlatformFeeRate` on VAT-inclusive gross. Not Product COGS. |
| DF-11 | Platform VAT as open research | **Superseded for v1 by DF-54.** |
| DF-54 | Platform fee VAT | Entered rate is effective total deduction, KDV dahil. Do not add 20% on top. Do not split service-base vs VAT in v1. |
| DF-55 | Campaigns / Joker | Out of v1. |
| DF-12 | Rent | Same net/gross 20% withholding math as Lite. Gross-up is `net / 0.80`, never `net × 1.20`. Implemented later in the Detailed engine, not by importing Lite. |
| DF-13 | Aidat | Standard occupancy expense; may start empty; no forced default. |
| DF-14 | Personnel | Position-based; user-addable positions. Owner is not an employee position. |
| DF-15 / DF-16 / DF-60 | Position cost | Name, headcount, monthly employer cost, meal, transport, average monthly bonus — all per person. `positionMonthlyCost = headcount × (employer + meal + transport + bonus)`. No payroll engine. No bonus frequency logic. |
| DF-59 | Owner / operator | Separate section: owner monthly amount + Bağ-Kur monthly cost. Both operating costs. No owner PIT or payroll engine. |
| DF-17 / DF-42 | Owner UX / Bağ-Kur placement | **Superseded in shape by DF-59.** |
| DF-57 | OPEX timing | Simple monthly amounts only. Annual/occasional costs entered as monthly equivalents. No annual/quarterly/per-sqm/stepped/recurrence logic. |
| DF-18 / DF-19 / DF-20 | Standard OPEX | Utilities, **one** security line (alarm/camera/surveillance), software, accountant, cleaning, maintenance/repair (covers water treatment if needed), insurance, consumables, pest control. No extra micro-lines. |
| DF-58 | Custom OPEX | `+ Gider Ekle`; name + average monthly amount. Use this for business-specific costs. |
| DF-39 | OPEX drivers | No complex driver system. Engine uses simple monthly amounts. |
| DF-32 | CAPEX | Treated primarily as initial investment. Common items include fit-out, equipment, furniture, signage, opening stock, setup/opening expenses, and custom items. |
| DF-33 | Opening stock | Explicitly included in the investment set. |
| DF-34 | Depreciation | No accounting depreciation / tax useful-life machinery in v1. |
| DF-30 | Company tax | No PIT, CIT, profit-distribution withholding, or full company-tax model in v1. |
| DF-70 | Company-type input | Removed. No şahıs / limited field. Owner / Bağ-Kur remain. |
| DF-31 | VAT engine | No full accounting VAT engine; no per-expense deductible VAT / carry-forward / VAT-return machinery. Prices stay VAT-inclusive as entered; operating revenue is net of sales VAT (DF-65). |
| DF-23 | Projection | Simple monthly projection. Not working-capital, settlement, supplier-credit, or daily cash. Supports payback. |
| DF-24 | Horizon default | Default 24 months. Control is DF-71. |
| DF-71 | Horizon control | Presets only: 12 / 24 / 36 months. Default 24. No free numeric input. |
| DF-25 | Ramp-up | Slow / Normal / Fast presets with locked monthly % of scenario-adjusted stabilized quantity. Sales volume only. No custom monthly table. |
| DF-69 | Scenario → ramp-up order | `effectiveDaily = stabilizedDaily × scenarioMultiplier × rampUpMultiplier`, then × `operatingDaysPerMonth`. Ramp-up does not change prices or unit costs. At 100% ramp-up, Bad stays at 75% of original. |
| DF-26 | Seasonality | Out of v1. LATER, not a missing requirement. |
| DF-43 | Annual increase | Three user-editable annual rates (sales price, product COGS, fixed opex). `valueAtMonthM = base × (1+r)^((m−1)/12)`. Month 1 = entered values. CAPEX does not escalate. **Default % OPEN.** No extra escalation categories. |
| DF-74 | Escalation placement | Stay in the model; secondary / advanced assumptions area in later UI; not prominent in the primary flow. |
| DF-27 | Scenarios | Bad / Kötü, Base / Baz, Good / İyi. No per-input overrides. |
| DF-37 | Scenario variable | Sales volume, proportional to product quantities, applied before ramp-up (DF-69). Listed prices/mixes/rates/fixed costs stay fixed. Variable totals follow quantity. |
| DF-37a | Scenario defaults | Editable: Bad −25%, Base 0%, Good +25%. |
| DF-35 | Break-even | Automatic operating break-even. `fixed / weightedContributionPerSale`. CAPEX excluded. Primary outputs **units/day** and **units/month**. TL revenue only secondary if design needs it. Unreachable if contribution ≤ 0. |
| DF-36 | Payback | Automatic. Cumulative projected operating profit vs. total CAPEX. First month ≥ investment. Ramp-up affects it. Horizon / non-positive edge states locked. |
| DF-61 | Analysis UX principle | User describes the business once; engine derives operating result, break-even, investment, payback, scenarios, projection. |
| DF-62 | Waste / fire | Out of v1. |
| DF-40 | Financing | Out of v1. |
| DF-41 | Working-capital timing | Out of v1. |
| X1–X24 | v1 exclusions | See §6. LATER reviewer ideas in §6.1. |

### 9.2 SUPERSEDED

| ID | Previous lock | Replaced by |
| --- | --- | --- |
| DF-21 | Model şahıs vs. limited because tax economics differ; tax formulas to be specified later | DF-30 — no v1 tax engine; **DF-70** — no company-type input |
| DF-22 | Real VAT layer (output / input / payable / cash-flow) behind an advanced UX | DF-31 — no full accounting VAT engine in v1 |
| DF-01 | Category-based sales as the engine input | DF-44 — product-based revenue |
| DF-01a | Category average price, unit cost, and quantity | DF-45 — product name, normal price, online price, quantity. COGS left to the next step |
| DF-44a | Optional category grouping / organisation | DF-72 — no category grouping in v1 |
| DF-05 | Optional per-channel price overrides, including a distinct takeaway price | DF-46 — two prices only: normal (salon + takeaway) and online (delivery) |
| DF-10 open defaults | Exact platform percentages left open; discussed 12–15% / 38% not to be encoded as defaults | DF-10a — v1 editable defaults 15% and 38%, still not market constants |
| DF-11 | Platform / courier VAT treatment left open for research | DF-54 — entered rate is effective total deduction, VAT included; no extra 20%; no v1 VAT split line |
| DF-16 granularity | Meals / transport / bonus in scope, input grain left open | DF-60 — per-person monthly fields on each position; bonus is average monthly |
| DF-17 / DF-42 | Optional owner-labour UX and Bağ-Kur line placement left open | DF-59 — separate owner section with owner monthly amount and Bağ-Kur monthly cost |
| DF-20 water-treatment line | Water treatment / filter as a distinct applicable facility line | DF-18/19/20 — falls under maintenance/repair or custom OPEX |
| DF-24 free horizon | User-editable horizon; free number vs presets left open | DF-71 — presets 12 / 24 / 36 only; default 24 |

### 9.3 DEFERRED (non-exhaustive; see §7)

DF-43 **default percentages**, break-even contribution-weighting algebra, and every other **DEFERRED** row in §7 remain for the Detailed Financial Specification. They do not reopen locked product decisions. Company type, category grouping, free-form horizon, and extra OPEX micro-lines are **no longer deferred** — they are removed or simplified as locked above.

---

## 10. Relationship to existing planning documents

This file is the active **decision log** for Detailed Feasibility. It is not the Detailed product & financial specification.

Companion indexes in `docs/README.md`, `CLAUDE.md`, the architecture document, and the tech-stack document point here.

Once a Detailed financial specification exists, the following still need a later scope-boundary update:

| Document | Remaining follow-up |
| --- | --- |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` D4 | Currently says there is no router yet; tab navigation may later require an explicit routing/navigation decision |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` §4.2 | Persistence rules already cover Detailed and should remain the technical authority |
| `docs/quick-calculation-scope-v1.md` §21 / §6.2 | Lite currently says waste modelling and recipe-level costing "belong to Detailed Feasibility". Detailed v1 has now **excluded** the recipe/SKU engine **and** waste/fire modelling (DF-62). Lite also deferred detailed VAT accounting and tax to Detailed; Detailed v1 has now **excluded** a full VAT engine and a company-tax model. Detailed v1 **does** use Lite-style basic sales-VAT netting (DF-65), with an **editable** 10% default; Lite's rate remains a system assumption. Platform fee is an effective VAT-inclusive deduction. The Lite document should later distinguish "out of Lite" from "in Detailed v1" |
| `docs/DESIGN_DIRECTION.md` and `docs/FRONTEND_IMPLEMENTATION_SPEC.md` | Visual inheritance is locked; Detailed screen structure is a later Claude Design pass (§3.1). The Quick masthead currently assumes no navigation |

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
| v0.5 | Locked position fields (name, headcount, monthly employer cost, meal, transport, average monthly bonus) and `positionMonthlyCost`. Owner/operator is a separate section with owner monthly amount and Bağ-Kur monthly cost; no owner PIT or payroll engine. OPEX is monthly-only average amounts; standard lines listed; custom expense is name + monthly amount. No annual/quarterly/per-sqm/stepped OPEX. Rent unchanged. |
| v0.6 | Locked automatic operating break-even (`fixed / weightedContributionPerSale`; CAPEX excluded; monthly and daily counts). Locked payback from cumulative projected operating profit vs. total CAPEX, including ramp-up and horizon edge states. Locked Bad/Base/Good as sales-volume-only scenarios with an expanded fixed-assumption list. Ramp-up is preset-driven (slow/normal/fast conceptually); exact curves remain open. Projection purpose restated. Cursor implements the engine; Claude Design designs UI. Engine-derived analysis principle locked. |
| v0.7 | Locked waste/fire out of v1. Locked editable payment defaults: POS 3.59%, meal card 10%. Locked editable scenario defaults −25% / 0% / +25%. Locked Slow / Normal / Fast ramp-up monthly percentages. Locked three-way annual increase model with monthly compounding; default rates remain open. |
| v0.8 | Closed the six calculation-model review blockers. Sales VAT netting: default 10% editable; `netRevenue = gross / (1 + vatRate)`; commissions stay on VAT-inclusive gross; still not a full VAT engine. Per-order = per-unit. Product COGS excludes packaging, courier, and commissions. Escalation: Month 1 = entered values; exponent `(m−1)/12`. Quantity is daily; `operatingDaysPerMonth` default 30. Order of operations: scenario then ramp-up. |
| v0.9 | Scope cut: remove company-type input; horizon presets 12/24/36 only (default 24); no category grouping; merge security OPEX; drop separate water-treatment line; escalation stays in the model but secondary/advanced in UI; break-even primary outputs are units/day and units/month. Record seasonality, basket size, platform vs own-channel delivery split, and per-product channel mix as LATER — not missing v1 requirements. |

---

## 12. Readiness for the Detailed Financial Specification

The six calculation-model **review blockers** remain **RESOLVED**. This pass does not reopen them.

| Review blocker | Status | Lock |
| --- | --- | --- |
| VAT netting on revenue | **Closed** | DF-65 |
| Per-order / per-unit simplification | **Closed** | DF-67 |
| Product COGS boundary | **Closed** | DF-68 |
| Annual escalation timing (Month 1 = entered values) | **Closed** | DF-43 |
| Sales quantity time basis | **Closed** | DF-66 |
| Scenario → ramp-up order of operations | **Closed** | DF-69 |

v0.9 removes unused v1 complexity. It does **not** add reviewer-suggested features.

The major Detailed v1 **calculation-model** decisions in this file are sufficiently locked to begin writing the dedicated Detailed Financial Specification.

**Do not write that specification in this document or in this task.**

Remaining items (contribution-weighting algebra, three annual-increase **default percentages**, projection statement shape, some UX labels, packaging business-level vs per-product placement) belong **inside** that specification or a later UX pass. They are not calculation-model blockers for starting it, and they do not reopen the locked model.

Do **not** treat §6.1 LATER rows as specification backlog for v1.
