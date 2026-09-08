# US Product Scope — Same Product, United States Rules

**Version:** v0.2  
**Status:** Owner locks for US-1…US-4 are recorded below. This is still **not an implementation order**. No US engine or UI may be coded until explicitly requested.  
**Country:** United States · **Currency:** USD · **Preset:** Coffee Shop / Cafe  
**Locked:** 2026-09-08 (product owner)

Turkey documents stay the authority for the Turkey product. Do **not** edit them to become US. Do **not** mix TRY and USD in one engine.

| If you need… | Read |
| --- | --- |
| Turkey Quick formulas | `docs/quick-calculation-scope-v1.md` |
| Turkey Detailed decisions | `docs/DETAILED_FEASIBILITY_DECISIONS.md` |
| Turkey Detailed formulas | `docs/DETAILED_FINANCIAL_SPEC.md` |
| US substitutions | **this document** |

If this file and a Turkey file disagree about **US** behaviour, this file wins.

---

## 0. What this product is

The US product is the same cafe feasibility calculator: same eight money/volume inputs, same eight-row breakdown, same earnings / margins / payback / volume simulation.

It is **not** a label-swap of Turkey. Two country rules change the contract:

1. The ticket is **pre-tax** (US menu / POS subtotal). Sales tax is added, not stripped.
2. The user **selects a US state or DC**. That choice fills a planning sales-tax rate. The rate is editable. There is no city picker.

English UI, USD, `en-US` money format. Sibling of maliyet.lol, not a language switcher inside the Turkey app. DESIGN V11 stays locked for Turkey.

Forbidden names still apply: `depreciation`, `netProfit`.

---

## 1. Owner locks (2026-09-08) **[LOCKED]**

| ID | Decision | Lock |
| --- | --- | --- |
| **US-1** | Ticket tax basis | **Pre-tax.** `averageTicket` is the menu / POS subtotal. Sales tax is **not** inside the entered ticket. |
| **US-2** | Rent withholding | **Removed.** `monthlyRentCost = monthlyRent`. No net/gross control. |
| **US-3** | Sales-tax rate | **From the selected state (or DC).** Table in §5. **Editable.** No hidden 7.5% national stand-in. No city picker. |
| **US-4** | POS default | **`0.035` (3.5%)**, editable. Effective-rate proxy; see §3.2. |
| **US-9** | Tips | Voluntary tips are **not** ticket revenue. Employer costs on reported tips belong in the blended payroll figure. |
| **US-10** | State list | **50 states + District of Columbia.** One planning rate per row. |

---

## 2. Inheritance — what stays

1. The eight primary **financial** inputs. Do not add a ninth money field.
2. Outputs: total cost per sale, eight-row breakdown, monthly operating earnings, two margins, payback, volume simulation (−50 / −25 / current / +25 / +50).
3. CAPEX recovery allocation — still not depreciation.
4. No corporate / income / franchise tax engine, no FICA calculator, no LLC vs S-corp.
5. Costs used exactly as entered. No waste, no recipe costing, no input-tax strip on costs.
6. `posCommissionRate` and `cardPaymentShare` stay distinct. Cash has no commission.
7. Quick and Detailed remain separate engines. US Quick must not import Turkey Quick business logic.

**Added control (not a ninth money field):** required `usState` (USPS code, plus `DC`).

**Still out of scope:**

- City / ZIP / address tax lookup
- Per-item or grocery-vs-prepared rate tables
- Tip line, tip credit, tipped minimum wage
- `2.6% + $0.15` as a second POS formula term
- NNN / property-tax occupancy engine
- i18n library inside the Turkey app

---

## 3. Quick — inputs

### 3.1 Eight primary financial inputs **[LOCKED]**

| # | Field | Unit | Notes |
| --- | --- | --- | --- |
| 1 | `monthlyRent` | USD / month | As entered. No withholding. |
| 2 | `employeeCount` | FTE | Fractional allowed. |
| 3 | `averageEmployeeMonthlyCost` | USD / employee / month | Fully loaded employer cost: wages, employer payroll taxes (including on reported tips), workers’ comp, benefits if the user includes them. |
| 4 | `otherMonthlyOpex` | USD / month | Excludes rent and payroll. CAM / property tax / insurance that are not in rent go here, once. |
| 5 | `initialCapex` | USD | Build-out, equipment, deposits, opening. |
| 6 | `averageTicket` | USD / sale **excluding sales tax and excluding voluntary tips** | Menu / POS subtotal. Mandatory charges kept by the business (e.g. a house service charge) are included; tips are not. |
| 7 | `dailySalesVolume` | sales / operating day | Unchanged. |
| 8 | `variableCostPerSale` | USD / sale | As entered. No sales-tax strip. |

Hint on ticket: **before sales tax, before tip.**

### 3.2 Required jurisdiction + secondary assumptions **[LOCKED]**

| Field | Default | Editable | Notes |
| --- | --- | --- | --- |
| `usState` | none — **required** | Yes | USPS code or `DC`. Empty is a validation error, never an implicit rate. |
| `salesTaxRate` | from §5 for `usState` | **Yes** | Changing state **resets** the rate to the table value for the new state. Editing the rate after that is `source: 'user'` until the state changes again. |
| `operatingDaysPerMonth` | 30 | Yes | |
| `capexRecoveryPeriodMonths` | 60 | Yes | |
| `posCommissionRate` | **`0.035`** | Yes | Effective card-processing rate = total processor fees ÷ card collections. Not Square’s headline `2.6% + $0.15`. |
| `cardPaymentShare` | `0.90` | Yes | Distinct from the POS rate. |
| `rentInputBasis` | — | — | **Removed.** |
| `rentWithholdingRate` | — | — | **Removed.** |
| `vatRate` | — | — | **Removed.** US engine uses `salesTaxRate` only. |

**POS default evidence.** Square US Free plan, in-person, 2026 public pricing: `2.6% + $0.15` per transaction. On a $12 check that is `($12 × 0.026) + $0.15 = $0.462` → **3.85%** effective. The product keeps a **single percentage** (no cent fee). Default **3.5%** is a rounded cafe planning proxy; the user should replace it with their statement effective rate. Do not present 3.5% as a legal or contracted rate.

Zero `salesTaxRate` is valid (Oregon, Delaware, Montana, and any user override to 0).

---

## 4. Quick — formulas

Turkey Quick §8 evaluation order, with **these substitutions only**.

### 4.1 Revenue and sales tax **[LOCKED]** (replaces Turkey §8.2)

The entered ticket **is** net operating revenue per sale. Tax is added on top.

```
netAverageTicket         = averageTicket
salesTaxPerSale          = averageTicket × salesTaxRate
customerPaymentPerSale   = averageTicket + salesTaxPerSale

monthlySalesVolume       = dailySalesVolume × operatingDaysPerMonth
monthlyNetRevenue        = monthlySalesVolume × netAverageTicket
monthlySalesTax          = monthlySalesVolume × salesTaxPerSale
monthlyGrossCollections  = monthlySalesVolume × customerPaymentPerSale
```

**Never** `averageTicket / (1 + salesTaxRate)`. That formula is Turkey VAT-inclusive math and is wrong here.  
**Never** `averageTicket × salesTaxRate` interpreted as “tax already inside the ticket.”  
**Never** compute `averageTicket + averageTicket × rate` as the ticket the user was asked to enter — the user enters the pre-tax amount only.

Worked illustration — California table rate `0.0899`, user enters `averageTicket = 9.50`:

```
Net (business)     = 9.50 USD
Sales tax          = 9.50 × 0.0899 = 0.85405 USD
Customer pays      = 10.35405 USD
```

Wrong entry — user types a tax-inclusive $10.35 as if it were the ticket:

```
Model treats 10.35 as pre-tax
Tax added again    = 10.35 × 0.0899 ≈ 0.93
Customer total     = 11.28   ← invented extra tax
```

Copy must make the pre-tax hint hard to miss.

### 4.2 POS **[LOCKED]** (replaces Turkey §8.5)

US card processors charge on the amount put on the card. In this model that is the customer payment **excluding tips**:

```
posCostPerSale         = customerPaymentPerSale × cardPaymentShare × posCommissionRate
monthlyTransactionCost = monthlySalesVolume × posCostPerSale
```

Do not apply POS to `averageTicket` alone (that would omit tax from the fee base). Do not apply POS to tips (tips are not in the ticket).

### 4.3 Rent **[LOCKED]** (replaces Turkey §8.6a)

```
monthlyRentCost = monthlyRent
```

Zero rent → zero rent cost. Occupancy extras (CAM, property tax, insurance) are not grossed up. Enter them in `monthlyRent` **or** `otherMonthlyOpex`, not both.

### 4.4 Unchanged Turkey formulas

Payroll, variable cost, CAPEX recovery, monthly fixed cost, monthly total cost, earnings, margins, payback, volume simulation — same as Turkey Quick, using `monthlyRentCost` and `salesTaxPerSale` / `customerPaymentPerSale` as defined here.

`monthlyNetRevenue` remains the margin and earnings revenue base (pre-tax).

### 4.5 Headline and breakdown **[LOCKED]**

```
fixedCostPerSale            = monthlyFixedCost / monthlySalesVolume
estimatedTotalCostPerSale   = salesTaxPerSale
                            + variableCostPerSale
                            + posCostPerSale
                            + fixedCostPerSale
```

The eight rows, in this order, **sum to `customerPaymentPerSale`** (what the customer pays, not the pre-tax ticket):

| # | Category | Per sale |
| --- | --- | --- |
| 1 | Sales tax | `salesTaxPerSale` |
| 2 | Direct / variable product cost | `variableCostPerSale` |
| 3 | Payroll allocation | `monthlyPayroll / monthlySalesVolume` |
| 4 | Rent allocation | `monthlyRentCost / monthlySalesVolume` |
| 5 | Other OPEX allocation | `otherMonthlyOpex / monthlySalesVolume` |
| 6 | POS / payment cost | `posCostPerSale` |
| 7 | Investment recovery allocation | `monthlyCapexRecoveryAllocation / monthlySalesVolume` |
| 8 | Remaining profit | `customerPaymentPerSale − sum(1…7)` |

By construction:

```
estimatedTotalCostPerSale = customerPaymentPerSale − remainingProfitPerSale
monthlyOperatingEarnings  = remainingProfitPerSale × monthlySalesVolume
                          = monthlyNetRevenue − monthlyTotalCost
```

Margin denominators stay **net (pre-tax) revenue**. Labels must say that.

### 4.6 Earnings limitation (US copy)

The monthly earnings figure does **not** include federal or state income tax, corporate tax, franchise tax, financing, owner salary/drawings/distributions, or other detailed obligations. It is not net profit and not owner take-home.

Also state, as copy not formulas:

- The filled sales-tax rate is a **state-level planning default**, not the user’s city rate and not tax advice.
- Voluntary tips are outside the ticket. Employer payroll tax on reported tips still belongs in `averageEmployeeMonthlyCost`.

---

## 5. State planning rates **[LOCKED as a data contract]**

### 5.1 Rules

- UI: one required select, 50 states + District of Columbia. No city field.
- Selecting a row writes `salesTaxRate` from this table.
- The user may then edit `salesTaxRate`. Valid range: `0` … `0.50`.
- These are **planning defaults**, not the user’s legal rate. Combined figures are Tax Foundation population-weighted state + average local general sales tax as of **1 January 2026**.
- Cafe-specific overrides (where the general TF rate would mis-state prepared food):

| Code | Override | Why |
| --- | --- | --- |
| `NH` | `0.085` | New Hampshire has no general sales tax; restaurant meals are taxed under the **8.5% Meals and Rentals Tax**. |
| `DC` | `0.10` | District general rate is 6%; **prepared food / restaurant** rate is 10%. |

Do not treat Delaware, Montana, or Oregon’s `0` as “the five states have no tax.” Alaska has local sales tax (table `1.82%`). New Hampshire is not zero for a cafe.

### 5.2 Table

Source for all rows except `NH` and `DC`: [Tax Foundation, State and Local Sales Tax Rates, 2026](https://taxfoundation.org/data/all/state/sales-tax-rates/) (rates as of 1 January 2026). Combined column = state rate + population-weighted average local rate.

| `usState` | Name | `salesTaxRate` |
| --- | --- | --- |
| AL | Alabama | 0.0946 |
| AK | Alaska | 0.0182 |
| AZ | Arizona | 0.0852 |
| AR | Arkansas | 0.0946 |
| CA | California | 0.0899 |
| CO | Colorado | 0.0789 |
| CT | Connecticut | 0.0635 |
| DE | Delaware | 0.0000 |
| DC | District of Columbia | **0.1000** |
| FL | Florida | 0.0698 |
| GA | Georgia | 0.0749 |
| HI | Hawaii | 0.0450 |
| ID | Idaho | 0.0603 |
| IL | Illinois | 0.0896 |
| IN | Indiana | 0.0700 |
| IA | Iowa | 0.0694 |
| KS | Kansas | 0.0869 |
| KY | Kentucky | 0.0600 |
| LA | Louisiana | 0.1011 |
| ME | Maine | 0.0550 |
| MD | Maryland | 0.0600 |
| MA | Massachusetts | 0.0625 |
| MI | Michigan | 0.0600 |
| MN | Minnesota | 0.0814 |
| MS | Mississippi | 0.0706 |
| MO | Missouri | 0.0844 |
| MT | Montana | 0.0000 |
| NE | Nebraska | 0.0698 |
| NV | Nevada | 0.0824 |
| NH | New Hampshire | **0.0850** |
| NJ | New Jersey | 0.0660 |
| NM | New Mexico | 0.0767 |
| NY | New York | 0.0854 |
| NC | North Carolina | 0.0700 |
| ND | North Dakota | 0.0709 |
| OH | Ohio | 0.0729 |
| OK | Oklahoma | 0.0906 |
| OR | Oregon | 0.0000 |
| PA | Pennsylvania | 0.0634 |
| RI | Rhode Island | 0.0700 |
| SC | South Carolina | 0.0749 |
| SD | South Dakota | 0.0611 |
| TN | Tennessee | 0.0961 |
| TX | Texas | 0.0820 |
| UT | Utah | 0.0742 |
| VT | Vermont | 0.0639 |
| VA | Virginia | 0.0577 |
| WA | Washington | 0.0951 |
| WV | West Virginia | 0.0659 |
| WI | Wisconsin | 0.0572 |
| WY | Wyoming | 0.0556 |

When implementation is requested, this table is the single source of default rates. Do not hard-code a second copy in the UI.

---

## 6. Illustrative US numbers (not a golden vector)

Do not treat these as locked defaults. A US golden vector is computed in tests when an engine is authorised.

| Input | Illustrative cafe |
| --- | --- |
| `usState` | `CA` |
| `salesTaxRate` | 0.0899 (table, unless edited) |
| `monthlyRent` | 8,000 |
| `employeeCount` | 8 |
| `averageEmployeeMonthlyCost` | 4,500 |
| `otherMonthlyOpex` | 3,000 |
| `initialCapex` | 250,000 |
| `averageTicket` | 9.50 (**pre-tax**) |
| `dailySalesVolume` | 250 |
| `variableCostPerSale` | 2.80 |

---

## 7. Detailed Feasibility — US names

Same shape as Turkey Detailed. No US income-tax engine. DF-30 / DF-31 still apply.

| Turkey Detailed | US substitution |
| --- | --- |
| Sales VAT netting from VAT-inclusive prices | **Pre-tax prices** as entered (same as US-1). Sales tax added via `salesTaxRate` from `usState`, editable. |
| POS default 3.59% | Proposed **3.5%** effective rate, same definition as Quick |
| Meal card 10% | **Dropped.** Not a US meal-card analogue. Do not map to gift cards. Direct-store mix is cash + card until a later lock. |
| Platform fee % of delivery gross | Same field. Treat as **effective total deduction**. US marketplace contracts are often on pre-tax subtotal; do not silently assume tax-inclusive gross. Exact DoorDash/Uber defaults remain **OPEN (US-6)**. |
| Bağ-Kur monthly amount | **Owner cost / benefit allowance** — user-entered monthly amount. **Not** self-employment tax. No SE-tax calculator. |
| Owner monthly amount | Economic feasibility allowance, not necessarily an accounting salary or deductible expense. |
| İşyeri kira stopajı | **Removed** (US-2). |
| Aidat | **CAM** — actual monthly lease charge, entered once, not invented as a %. |

---

## 8. Architecture (not implementation)

When implementation is requested:

```
core/quick/              Turkey Quick — unchanged
core/quick-us/           US Quick — own defaults, types, formulas
data/us/salesTaxRates    §5 table as data, imported by the US feature/engine only
```

Do **not** turn Turkey Quick into a country switch. Do **not** share business formulas between TR and US. Generic helpers only (`lib/`).

The Turkey architecture rule “one source per formula” applies **inside** a country engine. It does not require one function to serve both TRY VAT-inclusive and USD tax-exclusive tickets.

US English-only UX is a **sibling-product** design decision. It does not reopen DESIGN V11 for maliyet.lol.

This section does not authorise creating those folders.

---

## 9. Still open

| ID | Topic | Blocks Quick US code? |
| --- | --- | --- |
| US-6 | Detailed US platform-fee defaults | No (Detailed only) |
| US-7 | Tighten USD input limits vs Turkey caps | No |
| US-8 | English copy lock (labels spec) | Yes, before US UI |
| US-11 | US Quick golden vector in tests | Yes, with the engine |

---

## 10. Changelog

| Version | What changed |
| --- | --- |
| v0.1 | Initial mapping. Tax-inclusive ticket, hidden 7.5%, POS 2.9%, stopaj removal proposed. Draft. |
| v0.2 | Owner locks: pre-tax ticket; state+DC picker with Tax Foundation Jan 2026 combined rates (NH 8.5% meals, DC 10% prepared food); stopaj removed; POS 3.5% effective proxy; POS fee base = customer payment excluding tips; meal-card mapping dropped; Bağ-Kur is not SE tax. Implementation still not authorised. |
