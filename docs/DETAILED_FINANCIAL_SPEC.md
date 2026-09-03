# Detailed Feasibility — Financial Specification

**Version:** v1.3
**Status:** Formula contract for `src/core/detailed/`. **Not** implementation.
**Currency:** TRY · **Country:** Turkey · **Language for v1:** Turkish-first
**Engine:** `detailedEngineVersion` `1.0.0`

---

## 0. How to read this document

| This document IS | This document is NOT |
| --- | --- |
| The formula contract, input/output schema and edge-state definition for the Detailed engine | The product scope — that is `DETAILED_FEASIBILITY_DECISIONS.md` |
| The single source of truth for each Detailed formula | A UI or screen specification |
| The golden-vector and invariant reference for tests | Permission to build Detailed UI |

Every formula appears **once**, in the section that owns it. Later sections reference it; they never restate it.

---

## 1. Purpose and authority

This document turns the locked Detailed v1 product decisions into an implementable calculation contract.

### 1.1 Authority order

| Subject | Authority |
| --- | --- |
| Detailed product scope, what is in and out of v1 | `docs/DETAILED_FEASIBILITY_DECISIONS.md` (DF) |
| Detailed formulas, schema, edge states, defaults | **This document** |
| Folder structure, layer boundaries, naming | `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` |
| Stack, runtime, persistence | `docs/TECH_STACK_AND_CONSTRAINTS.md` |
| Quick / Lite financial behaviour | `docs/quick-calculation-scope-v1.md` |

If this document appears to contradict a locked DF decision, **DF wins and the contradiction is reported**, not resolved by choosing the easier implementation.

### 1.2 What this document is authorised to close

DF §9.3 assigns the following to this specification. Each is closed here and marked **[SPEC]**:

| Item | DF reference | Closed in |
| --- | --- | --- |
| Annual escalation default percentages | DF-43 | §5 |
| Break-even contribution-weighting algebra | DF-35 | §14.3 |
| Packaging: business-level or per product | DF-52 | §9.2 |
| Rent withholding rate: editable or system assumption | DF-12 | §5, §10.3 |
| Default channel mix and payment mix | DF-04a, DF-06a | §5 |

Nothing else in this document is a new product decision. Anything not listed above and not already locked by DF is a **scope change**, not an implementation detail.

---

## 2. Scope boundaries

The engine must not implement any of the following. This is the DF §6 exclusion list restated as a build-time checklist.

| Excluded | Ref |
| --- | --- |
| Recipe / SKU / ingredient costing | X1 |
| Capacity, seat, table-turnover modelling | X2 |
| Seasonality or monthly seasonal coefficients | X3 |
| AVM-specific rent model | X4 |
| Loans, interest, financing schedules | X5 |
| Working capital, settlement delays, supplier terms, daily cash timing | X6 |
| Income tax, corporate tax, distribution withholding, company-type input | X7, X19 |
| Full accounting VAT engine, deductible VAT, VAT carry-forward | X8 |
| Gross-salary-to-employer-cost payroll engine | X9 |
| Accounting depreciation or useful-life machinery | X10 |
| Annual / quarterly / per-sqm / stepped OPEX drivers | X11 |
| Platform campaigns, Joker, listing ads | X13 |
| Per-input scenario overrides | X14 |
| Month-by-month ramp-up table | X15 |
| Basket size, items per order, customer count | X18 |
| Free-form projection horizon | X20 |
| Category grouping or category management | X21 |
| Platform vs own-channel delivery volume split | X22 |
| Per-product channel mix | X23 |
| Waste / fire / spoilage modelling | DF-62 |
| Break-even expressed in customers, seats or tickets | X27 |
| COGS percentage input | X28 |

---

## 3. Terminology

### 3.1 Banned in identifiers, types, comments and strings

`depreciation` · `amortisation` · `netProfit` · `customerCount` (for break-even) · `ticket` (Detailed has no average ticket)

### 3.2 Locked identifiers

| Concept | Identifier |
| --- | --- |
| Monthly bottom line | `monthlyOperatingResult` |
| Direct product cost per unit | `unitProductCost` |
| Packaging + own-courier per order | `channelVariableCost` |
| POS, meal-card and platform deductions | `paymentPlatformFee` |
| Net-of-VAT revenue | `netRevenue` |
| VAT-inclusive customer sales | `grossCustomerSales` |
| Sum of CAPEX items | `totalInitialInvestment` |
| Contribution per unit, mix-weighted | `weightedContributionPerUnit` |

### 3.3 Enumerations

```
Channel        = 'salon' | 'takeaway' | 'delivery'
PaymentMethod  = 'cash' | 'card' | 'mealCard'
DeliveryMode   = 'platformOnly' | 'platformCourier'
RentInputBasis = 'net' | 'gross'
RampUpPreset   = 'slow' | 'normal' | 'fast'
ScenarioKey    = 'bad' | 'base' | 'good'
```

`platformOnly` is DF-10 Mode 1 (merchant courier). `platformCourier` is Mode 2. Exactly one mode is active; they never coexist (DF-77).

---

## 4. Input contract

Two types. `DetailedInput` is the raw shape accepted from the UI, every field `unknown`. `DetailedResolvedInput` is what validation produces: every field a finite number or a valid enum, every default applied. **The engine only ever consumes `DetailedResolvedInput`.**

### 4.1 Products (DF-44, DF-45)

| Field | Unit | Required |
| --- | --- | --- |
| `id` | string | yes |
| `name` | string | yes |
| `normalPrice` | TL, VAT-inclusive | yes |
| `onlinePrice` | TL, VAT-inclusive | yes |
| `dailyQuantity` | units/day, stabilized | yes |
| `unitProductCost` | TL/unit | yes |

At least one product is required. No category field (DF-72).

### 4.2 Mixes

| Field | Unit |
| --- | --- |
| `channelMix.salon` / `.takeaway` / `.delivery` | fraction, must sum to 1 |
| `paymentMix.cash` / `.card` / `.mealCard` | fraction, must sum to 1 |

One business-level channel mix applied to every product (DF-04a). The payment mix applies to **salon and takeaway only** (DF-49).

### 4.3 Payment, delivery, packaging

| Field | Unit |
| --- | --- |
| `posCommissionRate` | fraction |
| `mealCardCommissionRate` | fraction |
| `delivery.mode` | `DeliveryMode` |
| `delivery.platformFeeRate` | fraction, 0 allowed (DF-82) |
| `delivery.ownCourierCostPerDeliveryOrder` | TL/order, **`platformOnly` only** (DF-81) |
| `packaging.takeawayPerOrder` | TL/order |
| `packaging.deliveryPerOrder` | TL/order |

**[SPEC] Packaging is business-level**, not per product (§9.2).

### 4.4 Occupancy, personnel, owner

| Field | Unit |
| --- | --- |
| `occupancy.monthlyRent` | TL/month |
| `occupancy.rentInputBasis` | `RentInputBasis` |
| `occupancy.monthlyAidat` | TL/month, may be 0 |
| `positions[]` | `{ id, name, headcount, employerCostPerPerson, mealCostPerPerson, transportCostPerPerson, averageBonusPerPerson }` |
| `owner.monthlyAmount` | TL/month |
| `owner.bagKurMonthlyCost` | TL/month |

`positions` may be empty. Aidat is entered here only, never again under OPEX (DF-80). The owner is never also a position (DF-79) — both are UI guardrails, not engine logic.

### 4.5 OPEX and CAPEX

| Field | Unit |
| --- | --- |
| `opexLines[]` | `{ id, name, monthlyAmount }` |
| `capexItems[]` | `{ id, name, amount }` |

Both may be empty. The engine takes plain arrays; the standard starter line names (DF-18/19/20) and the CAPEX starter items (DF-32, DF-33) are a later UI concern, not engine defaults. All OPEX is a monthly average (DF-57).

### 4.5a Required and optional fields **[SPEC]**

| Field | Requirement |
| --- | --- |
| `products`, and every field of each product | **Required.** An empty or absent list is `empty_products` (§6.3) |
| `occupancy.monthlyRent`, `occupancy.monthlyAidat`, `owner.monthlyAmount`, `owner.bagKurMonthlyCost`, `packaging.*`, `delivery.ownCourierCostPerDeliveryOrder`, each `positions[].*CostPerPerson` and `averageBonusPerPerson` | Optional, default **`0`** |
| `positions`, `opexLines`, `capexItems` | Optional, default **empty array** |
| `positions[].id/.name/.headcount`, `opexLines[].id/.name/.monthlyAmount`, `capexItems[].id/.name/.amount` | **Required when that array entry exists** |
| Every assumption, both mixes, both commission rates, `delivery.platformFeeRate` (mode-dependent default), `occupancy.rentInputBasis` | Optional, default per §5 |
| `delivery.mode` | **Required when `channelMix.delivery > 0`** (§6.4). Inert and defaulted otherwise. The chosen mode selects the platform-fee default |

Products are the only thing a feasibility model cannot proceed without (DF-44). Zero-defaulting the rest avoids fabricating requirements — a business with no rent, no staff or no CAPEX must be modellable — and matches DF-13 (aidat may start empty) and DF-60 (which per-person fields start empty is DEFERRED, so `0` is the neutral reading).

**Two zero-defaults are approved product behaviour, not implementation convenience:**

| Field | Behaviour |
| --- | --- |
| `packaging.takeawayPerOrder`, `packaging.deliveryPerOrder` | Empty resolves to **0 TL**. A shop with no packaging cost is a real shop |
| `positions[].employerCostPerPerson` (and meal, transport, bonus) | Empty resolves to **0 TL** and **never blocks the calculation** |

An empty employer cost carries more weight than an empty packaging amount: payroll is usually the largest fixed cost, so a position with headcount above zero and no employer cost silently removes the model's biggest expense. That is a **UI guardrail**, not a validation error — the same treatment DF-79 and DF-80 give the owner and aidat double-entry risks.

The later UI must warn prominently when **`headcount > 0` and `employerCostPerPerson === 0`**, with copy to the effect of *"Bu pozisyon için işveren maliyeti girilmedi. Hesaplama 0 TL ile devam ediyor."* A position with `headcount === 0` is a deliberate not-yet-hiring entry and must **not** warn. The rule is derivable from the resolved input, so it requires **no engine contract change**: `DetailedResult` carries nothing beyond §16.

### 4.6 Assumptions

| Field | Unit |
| --- | --- |
| `vatRate` | fraction |
| `operatingDaysPerMonth` | days |
| `projectionHorizonMonths` | 12 \| 24 \| 36 only (DF-71) |
| `rampUpPreset` | `RampUpPreset` |
| `scenarioVolumeDeltas.bad` / `.base` / `.good` | fraction delta, e.g. `-0.25` |
| `salesPriceAnnualIncrease` | fraction |
| `productCogsAnnualIncrease` | fraction |
| `fixedCostAnnualIncrease` | fraction |

`rentWithholdingRate` is **not an input** — see §5.

---

## 5. Defaults

One table, one home: `core/detailed/defaults.ts`. The form imports these; it never restates them.

| Key | Default | Editable | Ref |
| --- | --- | --- | --- |
| `vatRate` | `0.10` | yes | DF-65 |
| `operatingDaysPerMonth` | `30` | yes | DF-66 |
| `posCommissionRate` | `0.0359` | yes | DF-08 |
| `mealCardCommissionRate` | `0.10` | yes | DF-09 |
| `platformFeeRate.platformOnly` | `0.15` | yes | DF-10a |
| `platformFeeRate.platformCourier` | `0.38` | yes | DF-10a |
| `channelMix` | `salon 0.50 · takeaway 0.20 · delivery 0.30` | yes **[SPEC]** | DF-04a |
| `paymentMix` | `cash 0.40 · card 0.45 · mealCard 0.15` | yes **[SPEC]** | DF-06a |
| `projectionHorizonMonths` | `24` | preset only | DF-24, DF-71 |
| `rampUpPreset` | `'normal'` | yes | DF-25 |
| `scenarioVolumeDeltas` | `bad −0.25 · base 0 · good +0.25` | yes | DF-37a |
| `salesPriceAnnualIncrease` | `0` | yes **[SPEC]** | DF-43 |
| `productCogsAnnualIncrease` | `0` | yes **[SPEC]** | DF-43 |
| `fixedCostAnnualIncrease` | `0` | yes **[SPEC]** | DF-43 |
| `rentWithholdingRate` | `0.20` | **no — system assumption** **[SPEC]** | DF-12 |
| `rentInputBasis` | `'gross'` | yes | DF-12 |
| `currency` | `'TRY'` | no | — |
| `detailedEngineVersion` | `'1.0.0'` | no | — |

### 5.1 Why the escalation defaults are 0%

DF-43 forbids inventing default rates. `0` is the neutral identity, not a market claim: at 0% every projected month uses exactly the values the user entered.

**Because a hidden 0% would mislead, the three rates are a mandatory part of the output contract (§16.4) and the later UI must display them even when they are 0.** This is the same assumption-transparency rule Lite already applies to its own assumptions. A 0% default is only acceptable while it is visible.

### 5.2 Ramp-up preset tables (DF-25)

Percentage of the **scenario-adjusted** stabilized quantity, by projection month.

| Month | slow | normal | fast |
| --- | --- | --- | --- |
| 1 | 0.40 | 0.60 | 0.80 |
| 2 | 0.55 | 0.75 | 0.90 |
| 3 | 0.70 | 0.85 | 1.00 |
| 4 | 0.80 | 0.95 | 1.00 |
| 5 | 0.90 | 1.00 | 1.00 |
| 6+ | 1.00 | 1.00 | 1.00 |

---

## 6. Limits and validation

`core/detailed/limits.ts` holds the ranges. They are part of the calculation contract, not UI preference.

| Field | Min | Max |
| --- | --- | --- |
| `normalPrice`, `onlinePrice` | 0 (exclusive) | 100 000 |
| `dailyQuantity` | 0 | 100 000 |
| `unitProductCost` | 0 | 100 000 |
| `packaging.*`, `ownCourierCostPerDeliveryOrder` | 0 | 100 000 |
| `posCommissionRate` | 0 | 0.10 |
| `mealCardCommissionRate` | 0 | 0.30 |
| `platformFeeRate` | 0 | 0.60 |
| `vatRate` | 0 | 0.50 |
| `operatingDaysPerMonth` | 1 | 31 |
| `monthlyRent`, `monthlyAidat`, `opexLines[].monthlyAmount` | 0 | 50 000 000 |
| `positions[].headcount` | 0 | 500 |
| `positions[].*CostPerPerson`, `averageBonusPerPerson` | 0 | 1 000 000 |
| `owner.monthlyAmount`, `owner.bagKurMonthlyCost` | 0 | 1 000 000 |
| `capexItems[].amount` | 0 | 500 000 000 |
| `scenarioVolumeDeltas.*` | −0.90 | 5 |
| `salesPriceAnnualIncrease`, `productCogsAnnualIncrease`, `fixedCostAnnualIncrease` | −0.50 | 2 |
| `channelMix.*`, `paymentMix.*` | 0 | 1 |

An upper bound is a **validity ceiling, not a suggestion**. The only figures this product asserts are the §5 defaults; a bound merely marks where an entry stops being a plausible commercial rate. `mealCardCommissionRate` is bounded well above its 10% default precisely because DF-09 makes it editable and records that higher figures have been discussed.

### 6.1 Validation contract

- Validation **returns** errors and never throws.
- All errors are accumulated; validation does not stop at the first one.
- Absent optional fields resolve to the §5 default. Absent required fields produce `required`.
- Result shape: `{ ok: true, input: DetailedResolvedInput } | { ok: false, errors: ValidationError[] }`.

**[SPEC] Error addressing uses a path**, because products, positions, OPEX and CAPEX are arrays:

```
ValidationError = { path: (string | number)[], code: ValidationErrorCode, limit?: number }
ValidationErrorCode = 'required' | 'not_a_number' | 'below_min' | 'above_max'
                    | 'invalid_value' | 'mix_not_100' | 'empty_products'
```

Example: `{ path: ['products', 2, 'normalPrice'], code: 'below_min', limit: 0 }`.

### 6.2 Mix validation

`channelMix` and `paymentMix` must each sum to `1` within a tolerance of `1e-6` (DF-04a, DF-06a). A mix that does not sum to 1 is an **error** with code `mix_not_100` on path `['channelMix']` / `['paymentMix']`. The engine **never silently normalises a mix.**

### 6.3 Empty product list

An empty `products` array is an **error** with code `empty_products` on path `['products']`. A feasibility model with nothing to sell has no meaning, and DF-44 makes products the revenue unit.

Consequently **no engine path handles zero products** — validation rejects that input before `calculateMonth` is reachable. Do not write a zero-products branch in the engine, and do not write a test asserting one.

One or more products whose `dailyQuantity` is `0` is a **different and valid** case: `dailyQuantity` has an inclusive minimum of 0, and that input produces the zero-sales edge behaviour in §15.

### 6.4 Delivery mode is conditionally required **[SPEC]**

`delivery.mode` is **required whenever `channelMix.delivery > 0`**. An absent mode in that case is an error with code `required` on path `['delivery', 'mode']`.

The mode is never silently defaulted for a business that delivers. It selects both the platform deduction (15% vs 38% — DF-10a) and whether own-courier payment applies at all (DF-81), so defaulting it would apply a 15% deduction to delivery revenue the user never agreed to. The owner always knows whether their own courier or the platform's rider delivers; this is one of the few things they know better than any default (DF-00).

This is a conditional requirement on an existing field, not a new input.

When `channelMix.delivery === 0` the mode is not required and resolves to an inert `platformOnly`. Because validation must know the delivery share before it can judge the mode, `channelMix` is resolved **before** `delivery`.

This closes DF-10a's deferred question of how the user chooses a mode, as far as the input contract goes; the UI presentation of that choice remains a later design decision.

### 6.5 Own-courier field resolution

When `delivery.mode` is `'platformCourier'`, `ownCourierCostPerDeliveryOrder` is forced to `0` during resolution (DF-81). It is not an error to supply it; it is discarded.

---

## 7. Revenue model

### 7.1 Quantity basis (DF-66, DF-47, DF-69)

Entered quantity is **daily stabilized**. For a product `p`, channel `c`, and multipliers `s` (scenario) and `r` (ramp-up):

```
effectiveDailyQuantity(p)   = p.dailyQuantity × s × r
monthlyQuantity(p)          = effectiveDailyQuantity(p) × operatingDaysPerMonth
channelQuantity(p, c)       = monthlyQuantity(p) × channelMix[c]
```

`operatingDaysPerMonth` is applied **after** both multipliers. This same basis is used by revenue, Product COGS, channel variable costs, fees, scenarios, ramp-up, projection and break-even conversions.

**Quantity is not part of unit economics.** These three expressions belong to the monthly aggregation in §12, not to §9. §9 defines every cost strictly **per unit**; §12 multiplies those per-unit values by `channelQuantity`.

### 7.2 Channel price (DF-46)

```
channelPrice(p, 'salon')    = p.normalPrice × priceFactor
channelPrice(p, 'takeaway') = p.normalPrice × priceFactor
channelPrice(p, 'delivery') = p.onlinePrice × priceFactor
```

The online price is identical in both delivery modes. `priceFactor` is the escalation factor from §13.3; it is `1` in the stabilized month and in projection month 1.

### 7.3 Gross customer sales (DF-48, DF-03)

Per unit — this is the value §9 builds on:

```
grossPerUnit(p, c) = channelPrice(p, c)
netPerUnit(p, c)   = grossPerUnit(p, c) / (1 + vatRate)
```

Expanded to monthly totals by §12:

```
channelGross(p, c)   = channelQuantity(p, c) × grossPerUnit(p, c)
grossCustomerSales   = Σ over all p, c of channelGross(p, c)
```

All customer-facing prices are VAT-inclusive **as entered**. They are never grossed up again.

### 7.4 Order counts (DF-67)

```
takeawayOrderCount = takeaway unit count
deliveryOrderCount = delivery unit count
```

An intentional v1 simplification. No basket size, no customer count.

---

## 8. VAT netting (DF-65, DF-31)

```
netRevenue = grossCustomerSales / (1 + vatRate)
vatAmount  = grossCustomerSales − netRevenue
```

**Never `grossCustomerSales × vatRate`.**

`netRevenue` is the operating revenue used by the monthly operating result, margins and break-even.

**Every percentage commission uses VAT-inclusive gross as its base**, never `netRevenue` — POS, meal card and platform fee alike. This is basic sales-VAT netting only; there is no deductible VAT, no carry-forward and no VAT return.

---

## 9. Variable cost model

Three concepts, kept separate (DF-50). They are never merged into one "product cost".

**Everything in this section is defined per unit and is volume-free.** These are the formulas `unitEconomics.ts` owns. Quantity enters only in §12.

### 9.1 Product COGS (DF-28, DF-29, DF-68)

```
unitProductCost(p) = p.unitProductCost × cogsFactor
```

Unit cost is constant with respect to volume; the monthly total follows units sold, via §12. Product COGS **excludes** packaging, own-courier payment and every commission.

### 9.2 Channel Variable Costs (DF-52, DF-81, DF-83)

**[SPEC] Packaging is a business-level amount**, not per product. Two fields, one per channel that has packaging. Per-product packaging would add a field to every product row for a cost the owner knows as one number — DF-00.

```
unitChannelVariableCost('salon')    = 0
unitChannelVariableCost('takeaway') = packaging.takeawayPerOrder × cogsFactor
unitChannelVariableCost('delivery') = (packaging.deliveryPerOrder + ownCourierPerOrder) × cogsFactor

ownCourierPerOrder = delivery.ownCourierCostPerDeliveryOrder  when mode = 'platformOnly'
                   = 0                                        when mode = 'platformCourier'
```

**These costs are expressible per unit only because of DF-67**, which sets `takeawayOrderCount = takeawayUnitCount` and `deliveryOrderCount = deliveryUnitCount`. Should basket size ever enter the model (X18, currently LATER), packaging and courier stop being per-unit quantities and this boundary must move. Until then, per order and per unit are the same number.

`cogsFactor` is the **Product COGS** escalation factor (DF-83). These costs escalate with group 2 while remaining separate cost lines — escalation grouping and cost-line separation are different concerns, and DF-68 is not reopened.

Courier salary belongs to payroll, vehicle running costs to OPEX, the vehicle itself to CAPEX, and platform commission to §9.3. None of them belong here.

### 9.3 Payment / Platform Fees (DF-06 to DF-09, DF-49, DF-53, DF-54)

Direct store sales are salon + takeaway. The payment mix applies to them **only**.

```
directFeeRate      = paymentMix.card     × posCommissionRate
                   + paymentMix.mealCard × mealCardCommissionRate
                   ( cash contributes 0 — DF-07 )

unitPaymentPlatformFee(p, 'salon')    = grossPerUnit(p, 'salon')    × directFeeRate
unitPaymentPlatformFee(p, 'takeaway') = grossPerUnit(p, 'takeaway') × directFeeRate
unitPaymentPlatformFee(p, 'delivery') = grossPerUnit(p, 'delivery') × delivery.platformFeeRate
```

The fee base is `grossPerUnit`, which is VAT-inclusive. **Never `netPerUnit`** — the per-unit form puts a net figure within easy reach, and using it would silently understate every commission by the VAT factor.

Three rules that must never be relaxed:

1. Delivery gross receives the platform fee **and nothing else** — no POS, no meal-card fee (DF-49).
2. Every base above is **VAT-inclusive gross** (DF-65).
3. The platform rate is the **effective total deduction, VAT included** (DF-54). Never multiply it by 1.20 and never model a service-base/VAT split.

`platformFeeRate` may be `0` (DF-82), which yields a zero fee — the supported way to model own-phone or WhatsApp delivery.

### 9.4 Contribution

```
unitContribution(p, c) = netPerUnit(p, c) − unitProductCost(p)
                         − unitChannelVariableCost(c) − unitPaymentPlatformFee(p, c)
```

Contribution may legitimately be negative for a channel — for example a low-priced item delivered by own courier. The engine reports it; it does not suppress it.

---

## 10. Fixed monthly cost model

All values below are multiplied by `fixedFactor` (§13.3). None of them depends on sales volume.

### 10.1 Payroll (DF-14, DF-15, DF-16, DF-60)

```
positionMonthlyCost(i) = i.headcount × ( i.employerCostPerPerson
                                       + i.mealCostPerPerson
                                       + i.transportCostPerPerson
                                       + i.averageBonusPerPerson )
monthlyPayroll = Σ positionMonthlyCost(i)
```

The user enters employer cost directly. There is no gross-to-net payroll engine.

### 10.2 Owner / operator (DF-59)

```
monthlyOwnerCost = owner.monthlyAmount + owner.bagKurMonthlyCost
```

Both are ordinary monthly operating costs. No personal income tax, no Bağ-Kur bracket calculator.

### 10.3 Rent, withholding and aidat (DF-12, DF-13)

**[SPEC] `rentWithholdingRate` is a non-editable system assumption of 0.20**, matching the Lite convention. It is implemented in the Detailed engine; Lite code is never imported.

```
basis = 'gross':  rentCost = monthlyRent
                  rentWithholdingTax  = rentCost × rentWithholdingRate
                  rentPaidToLandlord  = rentCost − rentWithholdingTax

basis = 'net':    rentCost = monthlyRent / (1 − rentWithholdingRate)
                  rentPaidToLandlord  = monthlyRent
                  rentWithholdingTax  = rentCost − monthlyRent
```

**Never `monthlyRent × 1.20`.** When `monthlyRent` is 0, all three values are 0.

`rentCost` — not `rentPaidToLandlord` — is the business's cash cost and the value that enters fixed costs.

```
monthlyOccupancyCost = rentCost + monthlyAidat
```

### 10.4 OPEX (DF-57, DF-58, DF-39)

```
monthlyOpex = Σ opexLines[i].monthlyAmount
```

Monthly average amounts only. No frequency, driver or recurrence logic.

### 10.5 Total

```
monthlyFixedCost = ( monthlyPayroll + monthlyOwnerCost
                   + monthlyOccupancyCost + monthlyOpex ) × fixedFactor
```

CAPEX is **not** part of fixed cost. There is no depreciation and no recovery allocation (DF-34).

---

## 11. CAPEX / initial investment

```
totalInitialInvestment = Σ capexItems[i].amount
```

Includes fit-out, equipment, furniture, signage, **opening stock** (DF-33), setup costs and custom items.

Three rules:

1. CAPEX **never** appears in a monthly projection row.
2. CAPEX **never** escalates (DF-43).
3. CAPEX is excluded from operating break-even (DF-35) and is the target of payback (DF-36) — those are different questions and are never mixed.

---

## 12. Monthly operating result

This is the **only** monthly aggregation in the engine. Every other output is derived from it or feeds into it.

### 12.1 Quantity expansion

`calculateMonth` computes `channelQuantity` (§7.1) and multiplies it into the per-unit economics of §9. This is the single place where volume meets unit economics:

```
channelGross(p, c)         = channelQuantity(p, c) × grossPerUnit(p, c)
netRevenue(p, c)           = channelQuantity(p, c) × netPerUnit(p, c)
productCogs(p, c)          = channelQuantity(p, c) × unitProductCost(p)
channelVariableCost(p, c)  = channelQuantity(p, c) × unitChannelVariableCost(c)
paymentPlatformFee(p, c)   = channelQuantity(p, c) × unitPaymentPlatformFee(p, c)
contribution(p, c)         = channelQuantity(p, c) × unitContribution(p, c)
```

Each monthly total is the sum of its channel lines. Every line is linear in quantity, so the per-unit and total forms are equivalent by construction — that equivalence is what lets break-even (§14.3) and `calculateMonth` share one contribution definition.

### 12.2 The result

```
monthlyOperatingResult = netRevenue
                       − ( productCogs + channelVariableCost + paymentPlatformFee )
                       − monthlyFixedCost
```

Equivalently, and asserted as invariant I4:

```
monthlyOperatingResult = totalContribution − monthlyFixedCost
```

The function that computes it takes four multipliers — `quantityFactor`, `priceFactor`, `cogsFactor`, `fixedFactor` — and nothing else varies. Scenarios, ramp-up and escalation are **only** ways of supplying those four numbers.

Detailed v1 publishes no margin ratios; DF-61 defines the output set and margins are not in it.

---

## 13. Scenarios, ramp-up and escalation

### 13.1 Order of operations (DF-69)

```
quantityFactor = scenarioMultiplier × rampUpMultiplier
```

```
scenarioMultiplier(k) = 1 + scenarioVolumeDeltas[k]
rampUpMultiplier(preset, m) = table lookup from §5.2
```

Ramp-up is always relative to the **scenario-adjusted** stabilized level. At 100% ramp-up the Bad scenario remains at 75% of the original stabilized quantity — it never rebounds to 100%.

Scenarios change **sales volume only** (DF-37). Prices, mixes, unit costs, commission rates, payroll, owner cost, rent, aidat, OPEX and CAPEX are identical across all three scenarios. Ramp-up likewise changes volume only — never prices, never unit costs.

### 13.2 Stabilized month vs projection month 1

The **stabilized month** uses `rampUpMultiplier = 1` and all escalation factors `= 1`. It is the steady-state answer to "what does this business earn per month".

**Projection month 1** carries the ramp-up multiplier (0.60 under `normal`) but no escalation. The two are different by design and must not be reconciled.

### 13.3 Escalation factors (DF-43, DF-83)

```
escalationFactor(annualRate, m) = (1 + annualRate) ^ ((m − 1) / 12)
```

| Factor | Rate | Applies to |
| --- | --- | --- |
| `priceFactor` | `salesPriceAnnualIncrease` | `normalPrice`, `onlinePrice` — and therefore, automatically, every percentage fee computed on gross |
| `cogsFactor` | `productCogsAnnualIncrease` | `unitProductCost`, packaging, own-courier per order (DF-83) |
| `fixedFactor` | `fixedCostAnnualIncrease` | payroll, owner, Bağ-Kur, rent, aidat, OPEX |
| — | — | CAPEX **never escalates** |

Month 1 exponent is 0, so **projection month 1 always uses the exact values the user entered**. Escalation begins after month 1. Commission and platform **rates** are never escalated — they are percentages, and escalating their base is sufficient.

---

## 14. Projection, payback and break-even

### 14.1 Projection (DF-23, DF-71)

For each scenario `k`, for `m = 1 … projectionHorizonMonths`:

```
row(m) = monthly result computed with
         quantityFactor = scenarioMultiplier(k) × rampUpMultiplier(preset, m)
         priceFactor    = escalationFactor(salesPriceAnnualIncrease, m)
         cogsFactor     = escalationFactor(productCogsAnnualIncrease, m)
         fixedFactor    = escalationFactor(fixedCostAnnualIncrease, m)
```

The horizon is 12, 24 or 36 — never a free number. There is no working-capital, settlement, supplier-credit or daily-cash logic in a row.

### 14.2 Payback (DF-36)

```
cumulative(m) = Σ over 1…m of row(m).monthlyOperatingResult
paybackMonth  = first m where cumulative(m) ≥ totalInitialInvestment
```

Resolution order:

1. `totalInitialInvestment = 0` → `{ month: 0 }`.
2. Some `m` satisfies the condition → `{ month: m, cumulativeAtPayback }`.
3. No `m` satisfies it and the **stabilized** month's operating result is ≤ 0 → `unavailable`, reason `non_positive_operating_result`.
4. Otherwise → `unavailable`, reason `not_reached_within_horizon`.

Payback is never decoupled from the displayed horizon. No depreciation, no pre-opening costs, no cash-needed-to-open.

### 14.3 Break-even (DF-35) **[SPEC]**

CAPEX is excluded. Break-even answers the operating question only.

**Weighting algebra.** Because scenarios scale every product's quantity proportionally and the channel mix is business-level, the product and channel mix is invariant. The weighted contribution per unit is therefore the mix-weighted average, computed from the stabilized month:

```
weightedContributionPerUnit = totalContribution / totalUnits
```

both taken from the stabilized month at `quantityFactor = 1` and all escalation factors `= 1`. No separate weighting formula exists; the numerator and denominator come from the same aggregation used by §12.

**Do not restate this as a mix-weighted average of `unitContribution`.** Since `totalContribution = Σ channelQuantity × unitContribution`, a weighted average over mix shares is algebraically identical to the division above — it would be a second expression for one quantity, which is the duplication §17.3 exists to prevent. Break-even consumes the base stabilized month's totals, and therefore inherits the aggregation that invariant I6 already tests.

```
breakEvenUnitsPerMonth = monthlyFixedCost / weightedContributionPerUnit
breakEvenUnitsPerDay   = breakEvenUnitsPerMonth / operatingDaysPerMonth
```

**Basis:** month-1 values — no escalation, no ramp-up. Because the mix is scenario-invariant, `weightedContributionPerUnit` and both break-even figures are **identical across all three scenarios**. That is asserted as invariant I7, not chosen.

**Unavailable when:**

- `totalUnits = 0` → reason `no_sales_volume`;
- `weightedContributionPerUnit ≤ 0` → reason `non_positive_contribution`.

Break-even is expressed in **product units**, never customers, seats or tickets. A TL revenue equivalent is not part of the v1 output set.

---

## 15. Unavailable and edge states

The engine never throws, never returns `NaN` and never returns `Infinity`.

| Condition | Behaviour |
| --- | --- |
| One or more products, all `dailyQuantity` = 0 | Revenue and variable costs are 0; `monthlyOperatingResult = −monthlyFixedCost`; break-even `unavailable / no_sales_volume`; payback per §14.2. An **empty** product list never reaches here — see §6.3 |
| `weightedContributionPerUnit ≤ 0` | Break-even `unavailable / non_positive_contribution` |
| `totalInitialInvestment = 0` | Payback `{ month: 0 }` |
| Cumulative never reaches investment, stabilized result ≤ 0 | Payback `unavailable / non_positive_operating_result` |
| Cumulative never reaches investment, stabilized result > 0 | Payback `unavailable / not_reached_within_horizon` |
| `platformFeeRate = 0` | Platform fee is exactly 0; delivery still incurs COGS and channel variable costs |
| Mode `platformCourier` | `ownCourierPerOrder` is exactly 0; every other line is unchanged |
| `monthlyRent = 0` | `rentCost`, `rentWithholdingTax` and `rentPaidToLandlord` are all 0 |
| A channel mix component is 0 | That channel contributes 0 everywhere; no division by it occurs |
| `channelMix.delivery = 0` | `delivery.mode`, `platformFeeRate` and `ownCourierCostPerDeliveryOrder` reach **no figure**: every delivery line is `0 x value = 0`. The mode is still reported in `meta.assumptions`, so the result stays honest about what was selected; the UI should suppress the delivery assumption row |
| Any division with a 0 denominator | Guarded; the dependent output is `null` or `unavailable`, never `NaN` |

---

## 16. Output contract

`DetailedResult` carries exactly what DF-61 lists — nothing more.

### 16.1 Top level

```
DetailedResult = {
  totalInitialInvestment: number
  breakEven: BreakEvenResult
  scenarios: { bad: ScenarioResult, base: ScenarioResult, good: ScenarioResult }
  meta: ResultMeta
}
```

`breakEven` and `totalInitialInvestment` sit at the top level because both are scenario-invariant.

### 16.2 Per scenario

```
ScenarioResult = {
  scenarioMultiplier: number
  stabilizedMonth: MonthResult
  projection: MonthResult[]          // length = projectionHorizonMonths
  payback: PaybackResult
}
```

### 16.3 Month result

```
MonthResult = {
  month: number | null               // null for the stabilized month
  quantityFactor, priceFactor, cogsFactor, fixedFactor: number
  totalUnits: number
  grossCustomerSales, vatAmount, netRevenue: number
  productCogs, channelVariableCost, paymentPlatformFee: number
  totalVariableCost, totalContribution: number
  monthlyPayroll, monthlyOwnerCost, monthlyOccupancyCost, monthlyOpex: number
  rentCost, rentPaidToLandlord, rentWithholdingTax: number
  monthlyFixedCost: number
  monthlyOperatingResult: number
  byChannel: { salon: ChannelLine, takeaway: ChannelLine, delivery: ChannelLine }
}

ChannelLine = { units, grossCustomerSales, netRevenue,
                productCogs, channelVariableCost, paymentPlatformFee, contribution }
```

`byChannel` exists so the later UI can answer "where does the money go" without recomputing anything (DF-2.2).

### 16.4 Meta — mandatory assumption transparency

```
ResultMeta = {
  detailedEngineVersion: string
  currency: 'TRY'
  revenueBasis: 'net'
  assumptions: {
    vatRate, operatingDaysPerMonth, rentWithholdingRate: number
    projectionHorizonMonths: 12 | 24 | 36
    rampUpPreset: RampUpPreset
    scenarioVolumeDeltas: { bad, base, good }
    deliveryMode: DeliveryMode
    platformFeeRate, posCommissionRate, mealCardCommissionRate: number
    salesPriceAnnualIncrease, productCogsAnnualIncrease, fixedCostAnnualIncrease: number
  }
}
```

**`meta.assumptions` is part of the contract, not a debug field.** The later UI must display the three annual escalation rates **even when they are 0**, so the 0% default is never hidden (§5.1).

### 16.5 Result unions

```
BreakEvenResult = { available: true, weightedContributionPerUnit, unitsPerMonth, unitsPerDay }
                | { available: false, reason: 'no_sales_volume' | 'non_positive_contribution' }

PaybackResult   = { available: true, month: number, cumulativeAtPayback: number }
                | { available: false, reason: 'not_reached_within_horizon'
                                            | 'non_positive_operating_result' }
```

### 16.6 Rounding

**The engine performs no rounding anywhere**, including effective quantities — a scenario-adjusted quantity of 33.75 units/day stays 33.75. Raw values are returned; all rounding happens later in `lib/money.ts` and `lib/percent.ts`. Note that Lite's `simulateQuick` rounds its daily volumes; Detailed deliberately does not.

---

## 17. Calculation pipeline

### 17.1 Order

```
raw DetailedInput
  → validateDetailedInput            defaults applied · limits checked · mixes = 1 · errors returned
  → DetailedResolvedInput
  → buildUnitEconomics(input, priceFactor, cogsFactor)     per product × channel, per unit; volume-free (§9)
  → buildMonthlyFixedCosts(input, fixedFactor)             volume-independent; + totalInitialInvestment
  → calculateMonth(input, factors)                         channelQuantity × per-unit economics (§12);
                                                           THE single monthly aggregation
  → for each scenario:
        stabilizedMonth = calculateMonth(q = scenarioMultiplier, price/cogs/fixed = 1)
        projection[m]   = calculateMonth(q = scenarioMultiplier × rampUp(m), escalation factors at m)
        payback         = scan of cumulative monthlyOperatingResult vs totalInitialInvestment
  → breakEven = weighted contribution from the base stabilized month ÷ into monthlyFixedCost
  → DetailedResult
```

### 17.2 One home per formula

| Formula | Home |
| --- | --- |
| Channel price, per-unit gross and net, unit COGS, unit channel variable cost, unit fee, unit contribution — **all volume-free** | `unitEconomics.ts` |
| Channel quantity expansion, monthly aggregation, **projection loop**, scenario assembly | `calculate.ts` |
| Payroll, owner, rent withholding, aidat, OPEX, total CAPEX | `monthlyCosts.ts` |
| Ramp-up lookup, escalation factor, payback scan | `projection.ts` |
| Weighted contribution, break-even units | `breakEven.ts` |

The month **loop** belongs to `calculate.ts`, not `projection.ts`. If `projection.ts` ran the loop it would have to import `calculateMonth`, while `calculateDetailed` imports `projection.ts` — a cycle. `projection.ts` therefore holds only the calculator-free helpers, and the import direction is one-way: `calculate.ts → projection.ts`. This changes no formula and no number.

### 17.3 Why nothing is derived twice

Scenario, ramp-up and escalation are not three mechanisms — they are three ways of producing the four multipliers that `calculateMonth` accepts. The projection is a loop over that one function; payback is a scan over its output; break-even reads the same two builders that `calculateMonth` reads. No function calls back into `calculateDetailed`; the graph is acyclic by construction.

---

## 18. Invariants, golden example and test contract

### 18.1 Invariants

| # | Invariant |
| --- | --- |
| I1 | `grossCustomerSales = netRevenue + vatAmount` |
| I2 | Σ `byChannel[*].grossCustomerSales` = `grossCustomerSales`; same for units, net revenue and each cost line |
| I3 | `monthlyOperatingResult = netRevenue − totalVariableCost − monthlyFixedCost` |
| I4 | `monthlyOperatingResult = totalContribution − monthlyFixedCost` |
| I5 | `totalUnits = Σ dailyQuantity × quantityFactor × operatingDaysPerMonth` |
| I6 | Running `calculateMonth` at exactly `breakEvenUnitsPerDay` yields `monthlyOperatingResult ≈ 0` |
| I7 | `breakEven` is identical across `bad`, `base` and `good` |
| I8 | Projection month 1 uses the exact entered prices and unit costs (escalation exponent 0) |
| I9 | No `NaN` and no `Infinity` anywhere in `DetailedResult` |
| I10 | No CAPEX amount appears in any `MonthResult` |
| I11 | `channelMix` and `paymentMix` each sum to 1 in every resolved input |
| I12 | `rentCost ≥ rentPaidToLandlord`, and their difference equals `rentWithholdingTax` |
| I13 | For every product and channel, `line total = channelQuantity × corresponding per-unit value`, for gross, net, each cost line and contribution |

### 18.2 Golden example

Inputs — VAT 10%, operating days 30, escalation all 0%, horizon 24, ramp-up `normal`, delivery mode `platformOnly`:

| Group | Values |
| --- | --- |
| Products | Americano: normal 150, online 200, 180/day, cost 30 · Tost: normal 90, online 120, 90/day, cost 35 |
| Channel mix | salon 0.50 · takeaway 0.20 · delivery 0.30 |
| Payment mix | cash 0.40 · card 0.45 · mealCard 0.15 |
| Rates | POS 3.59% · meal card 10% · platform 15% |
| Channel variable | takeaway packaging 3 · delivery packaging 5 · own courier 40 |
| Occupancy | rent 60 000 **net basis** · aidat 5 000 |
| Positions | Barista × 3 — employer 45 000, meal 3 000, transport 2 000, bonus 2 500 |
| Owner | 60 000 + Bağ-Kur 5 000 |
| OPEX | 18 000 + 3 000 + 1 500 + 6 000 + 4 000 |
| CAPEX | 900 000 + 600 000 + 200 000 + 50 000 + 100 000 + 50 000 |

`directFeeRate = 0.45 × 0.0359 + 0.15 × 0.10 = 0.031155`

**Base stabilized month, per channel line** (daily figures; monthly = × 30):

| Product | Channel | Units/day | Gross | Net | COGS | Channel var. | Fee | Contribution |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Americano | salon | 90 | 13 500 | 12 272.7273 | 2 700 | 0 | 420.5925 | 9 152.1348 |
| Americano | takeaway | 36 | 5 400 | 4 909.0909 | 1 080 | 108 | 168.2370 | 3 552.8539 |
| Americano | delivery | 54 | 10 800 | 9 818.1818 | 1 620 | 2 430 | 1 620.0000 | 4 148.1818 |
| Tost | salon | 45 | 4 050 | 3 681.8182 | 1 575 | 0 | 126.1778 | 1 980.6404 |
| Tost | takeaway | 18 | 1 620 | 1 472.7273 | 630 | 54 | 50.4711 | 738.2562 |
| Tost | delivery | 27 | 3 240 | 2 945.4545 | 945 | 1 215 | 486.0000 | 299.4545 |
| **Total** | | **270** | **38 610** | **35 100** | **8 550** | **3 807** | **2 871.4784** | **19 871.5216** |

**Base stabilized month, monthly:**

| Figure | Value |
| --- | --- |
| `totalUnits` | 8 100 |
| `grossCustomerSales` | 1 158 300 |
| `vatAmount` | 105 300 |
| `netRevenue` | 1 053 000 |
| `productCogs` | 256 500 |
| `channelVariableCost` | 114 210 |
| `paymentPlatformFee` | 86 144.3505 |
| `totalVariableCost` | 456 854.3505 |
| `totalContribution` | 596 145.6495 |
| `monthlyPayroll` | 157 500 |
| `monthlyOwnerCost` | 65 000 |
| `rentCost` (net basis: 60 000 / 0.80) | 75 000 |
| `rentPaidToLandlord` / `rentWithholdingTax` | 60 000 / 15 000 |
| `monthlyOccupancyCost` | 80 000 |
| `monthlyOpex` | 32 500 |
| `monthlyFixedCost` | 335 000 |
| **`monthlyOperatingResult`** | **261 145.6495** |

**Break-even** (scenario-invariant):

```
weightedContributionPerUnit = 596 145.6495 / 8 100 = 73.598228…
breakEvenUnitsPerMonth      = 335 000 / 73.598228… = 4 551.7400
breakEvenUnitsPerDay        = 151.7247
```

**Payback**, `totalInitialInvestment = 1 900 000`:

| Scenario | Stabilized result | Payback month |
| --- | --- | --- |
| Bad (−25%) | 112 109.24 | 21 |
| Base | 261 145.65 | 10 |
| Good (+25%) | 410 182.06 | 7 |

Base projection: m1 22 687.39 (cum 22 687.39) · m2 112 109.24 (cum 134 796.63) · m3 171 723.80 (cum 306 520.43) · m4 231 338.37 (cum 537 858.80) · m5 261 145.65 (cum 799 004.45) · m9 cum 1 843 587.04 · **m10 cum 2 104 732.69 ≥ 1 900 000**.

**Mode 2 sub-case** — switching `delivery.mode` to `platformCourier` (rate 38%, own courier forced to 0) changes **only** the two delivery lines:

| Product | Channel var. | Fee | Contribution |
| --- | --- | --- | --- |
| Americano delivery | 270 | 4 104.00 | 3 824.1818 |
| Tost delivery | 135 | 1 231.20 | 634.2545 |

giving `monthlyOperatingResult = 261 469.648` and `breakEvenUnitsPerDay = 151.6423`. Salon and takeaway lines are byte-identical to the Mode 1 table.

### 18.3 Test contract

Tier 1 must pass before any Detailed UI work begins.

| Tier | # | Test | Asserts |
| --- | --- | --- | --- |
| 1 | T1 | Golden worked example | Every figure in §18.2, end to end |
| 1 | T2 | Break-even round-trip | I6 — feeding break-even units back yields ≈ 0 |
| 1 | T3 | VAT netting | `net = gross / 1.10`; `gross × 0.10` never used; I1 |
| 1 | T4 | Fee bases | POS, meal-card and platform fees all computed on VAT-inclusive gross, never on net |
| 1 | T5 | No delivery double fee | Delivery gross receives zero POS and zero meal-card fee (DF-49) |
| 1 | T6 | Own-courier conditional | Included in `platformOnly`, exactly 0 in `platformCourier`, no other line changed |
| 1 | T7 | Rent net/gross stopaj | Both bases per §10.3; `net × 1.20` never used; I12 |
| 2 | T8 | Scenario × ramp-up order | DF-69's example 100 × 0.75 × 0.60 = 45; Bad at month 6 stays at 75% |
| 2 | T9 | Escalation month-1 identity | I8; month 13 = base × (1+r); channel variable costs follow the COGS rate (DF-83); I10 |
| 2 | T10 | Payback | All four resolution branches of §14.2 |
| 3 | T11 | Zero and invalid edge cases | Every row of §15. An **empty** product list is rejected by validation (§6.3, code `empty_products`); **all `dailyQuantity` = 0** is a valid input exercising the zero-sales edge behaviour. These are two distinct tests |
| 3 | T12 | Non-finite sweep | I9 across the whole result tree on every edge input |
| 3 | T13 | Percentage mixes | I11; `mix_not_100` raised with the correct path; never normalised |
| 1 | T16 | Delivery mode requirement | Required at `channelMix.delivery > 0` (§6.4); not required and inert at a 0 share; every figure identical across both modes at a 0 share |
| 2 | T17 | Approved zero defaults | Empty packaging resolves to 0 and charges no channel variable cost; empty employer cost resolves to 0, does not block, and contributes no payroll; the warn condition selects `headcount > 0` positions only |
| 3 | T14 | Structural guards | I2, I3, I4, I5, I7, I13; banned terminology absent from `core/detailed/`; result carries nothing beyond §16 |

Tests are colocated as `*.test.ts` under `src/core/detailed/`. No UI test suite.

---

## 19. Changelog

| Version | Change |
| --- | --- |
| v1.3 | Locked three input-contract decisions. `delivery.mode` is now required when `channelMix.delivery > 0` and is never silently defaulted (§6.4), closing DF-10a's deferred mode-choice question for the input contract; at a 0 delivery share the mode reaches no figure (§15). Empty packaging and empty employer cost are recorded as approved zero-defaults, with the employer-cost case handled by a prominent UI warning rather than a validation error (§4.5a) — no engine contract change. New tests T16 and T17. No figure in §18.2 changed. |
| v1.2 | Implementation-pass corrections, no figure in §18.2 changed. §17.2: the projection month **loop** belongs to `calculate.ts`, since a loop in `projection.ts` would require importing `calculateMonth` and create a cycle; `projection.ts` keeps the calculator-free helpers. New §4.5a records which inputs are required and which default, including `delivery.mode` defaulting to `platformOnly`. |
| v1.1 | Review fixes, no figure in §18.2 changed. `mealCardCommissionRate` bound raised to 0.30 so DF-09's editable rate is genuinely editable upward. Empty product list is validation-only (§6.3); the §15 edge row now covers all-zero quantities, the reachable case. §9 restated strictly per unit with quantity expansion moved to §12.1, matching `unitEconomics.ts`'s volume-free responsibility; new invariant I13. Break-even guarded against restatement as a mix-weighted average. |
| v1.0 | Initial specification. Closes the five items DF §9.3 delegated here: escalation defaults 0% with mandatory assumption transparency, break-even weighting algebra, business-level packaging, non-editable 20% rent withholding, and default channel/payment mixes. |
