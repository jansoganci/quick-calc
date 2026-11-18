# DF-85 — Impact, tests, and PR split

**Status:** Implementation note for [DF-85](./DETAILED_FEASIBILITY_DECISIONS.md). Not a second formula contract. Formulas live in [Appendix E](./DETAILED_FINANCIAL_SPEC.md) of the financial spec.
**Code:** Implemented at `detailedEngineVersion` `1.1.0`. This note stays the impact record; it is not a second formula contract.

---

## 1. What D3 and D4 touch

### D3 — per-product discount

The discount is applied where the list price becomes the gross the rest of the month uses: `src/core/detailed/unitEconomics.ts` lines 41–43 (`normalGrossPerUnit`, `onlineGrossPerUnit`). VAT and the fee are already `gross / (1 + vatRate)` and `gross × feeRate` (lines 51–53). Packaging is `takeawayPerOrder` and `deliveryPerOrder` times `cogsFactor` (lines 36–39), not the price. Recipe cost (`recipeCost` in `recipeCost.ts`) fills `unitProductCost` before this and must not read the discount.

| Layer | File | Change |
| --- | --- | --- |
| Types | `src/core/detailed/types.ts` `ResolvedProduct` (lines 82–89) and raw `DetailedInput` | Add `discountRate` |
| Limits | `src/core/detailed/limits.ts` | 0 to 1 inclusive. Not the price’s exclusive minimum |
| Defaults | `src/core/detailed/defaults.ts` | Omitted discount is 0 |
| Validate | `src/core/detailed/validate.ts` `resolveProducts` (lines 225–235) | Optional field, fallback 0 |
| Engine | `src/core/detailed/unitEconomics.ts` lines 41–43 | Multiply both prices by `(1 − discountRate)` before `priceFactor`’s existing use, or equivalently after it. One place only |
| Public barrel | `src/core/detailed/index.ts` | Only if the type export list must name the new field. `calculateDetailed`’s signature stays |
| Form | `src/features/detailed/formState.ts` `ProductRow` (lines 42–52) and `emptyProduct` (lines 146–156) | String percent. Empty product starts `''` |
| Parse | `src/features/detailed/toInput.ts` lines 36–48 | Same `rate()` helper as the other percents |
| Draft | `src/features/detailed/storage.ts` | Payload version 2. See §4 |
| Labels | `src/features/detailed/labels.ts` | One label. No new result name for the discount itself |
| Rows | `src/features/detailed/components/ProductRows.tsx` | One percent field per product |
| Price suggestion | `src/core/detailed/priceSuggestion.ts` `channelRestorePrice` (lines 17–38); `src/core/detailed/recipeCost.ts` `salonRestorePrice` (lines 113–115); caller `src/features/detailed/recipePreview.ts` lines 211–214 | Restore the list price. Divide the effective-gross increase by `(1 − discount)`. `esnafPrice` (priceSuggestion.ts lines 45–50) stays a rounding function |
| Results | `src/features/detailed/viewModel.ts`, `resultView.ts` | They format engine output. Discount changes those numbers. They do not grow a second formula |
| Report | `src/features/detailed/reportView.ts` `buildReportInputGroups` | Print the discount with the other product inputs |
| Simülasyonlar | `src/features/detailed/insightsView.ts` `previewJanuary` (lines 177–187) calls `applyJanuaryTest` | No new input. It scales payroll and rent on the month it is given. A discounted month changes the Ocak preview only because the month changed |
| Print | `ReportCover.tsx`, `ReportAppendix.tsx` | They render the view model. No separate math |

`calculateMonth` (`calculate.ts` lines 60–147) does not need a new formula if unit economics already return the discounted gross.

### D4 — visible 2026 prefills

Do **not** change the numbers `validateDetailedInput` substitutes for an omitted field.

Today:

```ts
// src/core/detailed/validate.ts line 247
employerCostPerPerson: f.optional('employerCostPerPerson', DETAILED_LIMITS.employerCostPerPerson, 0),
```

```ts
// src/core/detailed/validate.ts lines 356–360
bagKurMonthlyCost: f.optional(
  'bagKurMonthlyCost',
  DETAILED_LIMITS.ownerBagKurMonthlyCost,
  DETAILED_DEFAULTS.ownerBagKurMonthlyCost,
),
```

`DETAILED_DEFAULTS.ownerBagKurMonthlyCost` is `0` (`defaults.ts` line 58). `ownerMonthlyAmount` is `0` (line 57). Positions default to an empty list.

The form prefill is a different place. `initialForm` sets `owner.bagKurMonthlyCost` to `''` (`formState.ts` line 222). `emptyPosition` sets `employerCostPerPerson` to `''` (lines 173–182). `toInput.ts` turns `''` into `undefined` (lines 14–18), and the validator then applies the 0 fallback.

D4 writes the statutory strings into those form defaults:

- `initialForm` → `bagKurMonthlyCost: '11.808,23'`
- `emptyPosition` → `employerCostPerPerson: '40.874,63'`

The form reads those two numbers from the parameters module (§5). The validator keeps fallback 0. Sample café (`formState.ts` lines 326–332) keeps 28.000 and 6.000. It is an opt-in story, not the new-form default.

Quick’s example `32.000` (`src/features/quick-calc/viewModel.ts` line 110) is out of scope. DF-85 does not change Hızlı.

---

## 2. Golden vector

`goldenRawInput` (`src/core/detailed/goldenVector.ts` lines 15–83) sets personnel and Bağ-Kur explicitly:

- Barista headcount 3, `employerCostPerPerson: 45_000`, plus meal 3_000, transport 2_000, bonus 2_500 (lines 46–56). Payroll 157_500 is `3 × (45_000 + 3_000 + 2_000 + 2_500)`.
- `owner.bagKurMonthlyCost: 5_000` and `monthlyAmount: 60_000` (line 57). Owner cost 65_000.

It does not set a discount. Under E.1 an absent discount is 0, so every §18.2 figure stays. `GOLDEN` (lines 100–151) does not move: gross 1_158_300, operating result 261_145.6495, payback month base 10, investment 1_900_000.

`minimalRawInput` (lines 92–97) supplies products and delivery mode only. Omitted owner resolves to `{ monthlyAmount: 0, bagKurMonthlyCost: 0 }` (`validate.test.ts` line 218). Omitted positions are `[]`. That resolution must stay. If the validator fallback became 11_808.23, `edgeCases.test.ts` “empty sections” (lines 166–178) would fail: it expects `monthlyFixedCost === 0`.

### Tests that fail only if the engine fallback changes

These pass if D4 stays a form prefill:

| Test | Why it would fail |
| --- | --- |
| `validate.test.ts` lines 201–218 | `minimalRawInput` expects Bağ-Kur 0 |
| `validate.test.ts` lines 315–322 | Empty employer cost expects 0 and `ok: true` |
| `monthlyCosts.test.ts` lines 109–112 and 126–154 | Empty business and empty employer cost expect 0 payroll |
| `edgeCases.test.ts` lines 166–178 | No staff and no owner → fixed cost 0, payback month 0 |
| `storage.test.ts` lines 86–88 | A payload with `version: 2` is rejected today. The codec must accept v1 and write v2, and reject v3 instead |

Discount tests that pass a product without the new field must still validate. A test that snapshots the full `ResolvedProduct` object will fail until it expects `discountRate: 0`. `contract.test.ts` locks month keys (the list starts near line 35). Adding the E.5 fields updates that list. Existing key values stay.

No current test should fail if discount defaults to 0 and the engine fallbacks stay 0. The new tests in §5 are additive.

---

## 3. Answers

### a. Channel mix that is not 100%

The check is the validator, not the month engine and not a UI-only guess.

```ts
// src/core/detailed/validate.ts lines 207–209
if (Math.abs(sum - 1) > MIX_TOLERANCE) {
  fail(errors, [key], 'mix_not_100');
}
```

`MIX_TOLERANCE` is `1e-6` (`limits.ts` line 54). `evaluateDetailed` returns the error and does not call `calculateDetailed` when validation fails (`viewModel.ts` lines 260–268).

The UI turns that code into copy (`errors.ts` lines 136–137, `labels.ts` lines 525–526): “Kanal dağılımı %100 olmalı” plus how far the total is short or over. The message is held back until the field is touched or Hesapla is pressed (`useDetailedCalc.ts` lines 138–145). Hesapla stays disabled because `canSubmit` is `evaluation.ok` (line 83).

**Gap against D6.** After a successful Hesapla, a later invalid mix does not clear `view`. The effect returns early when `!evaluation.ok` (`useDetailedCalc.ts` lines 85–86), and the page still renders `calc.view` (`DetailedFeasibilityPage.tsx` lines 111–116). The previous result stays on screen. D6 requires that result to disappear. That is a UI change in PR 2, not a new validator.

### b. MonthResult versus the Akış steps

`MonthResult` (`types.ts` lines 277–305): `month`, `quantityFactor`, `priceFactor`, `cogsFactor`, `fixedFactor`, `totalUnits`, `grossCustomerSales`, `vatAmount`, `netRevenue`, `productCogs`, `channelVariableCost`, `paymentPlatformFee`, `totalVariableCost`, `totalContribution`, `monthlyPayroll`, `monthlyOwnerCost`, `monthlyOccupancyCost`, `monthlyOpex`, `rentCost`, `rentPaidToLandlord`, `rentWithholdingTax`, `monthlyFixedCost`, `monthlyOperatingResult`, `byChannel`, `byProduct`.

| Akış step | Status | Field |
| --- | --- | --- |
| Brüt ciro | AVAILABLE | `grossCustomerSales` |
| KDV | AVAILABLE | `vatAmount` |
| Net satış | AVAILABLE | `netRevenue` |
| Ürün maliyeti | AVAILABLE | `productCogs` |
| Brüt kâr | MISSING | Add `grossProfitBeforeChannel = netRevenue − productCogs` |
| Kanal masrafları | MISSING as one line | Add `channelCost = channelVariableCost + paymentPlatformFee`. The two addends stay |
| Personel | AVAILABLE | `monthlyPayroll` |
| Kira | AVAILABLE | `rentCost` (after stopaj). Aidat is not this field |
| Aidat | MISSING as its own field | Add `monthlyAidat = monthlyOccupancyCost − rentCost`. Akış shows it under kira so the occupancy total is not dropped |
| Diğer giderler | AVAILABLE | `monthlyOpex` |
| Sahip payı | MISSING | Add `monthlyOwnerDraw` (owner amount × `fixedFactor`) |
| Bağ-Kur | MISSING | Add `monthlyBagKur` (Bağ-Kur amount × `fixedFactor`). Today both sit inside `monthlyOwnerCost` (`monthlyCosts.ts` lines 70–71) |
| İşletme sonucu | AVAILABLE | `monthlyOperatingResult` |

None of these additions change the operating result. Payback, ramp, and “yatırım payı” are not given a new field.

### c. How many products

There is no product-count maximum in `DETAILED_LIMITS` or in the form. The user can keep adding rows.

Add: `addProduct` appends `emptyProduct()` (`useDetailedCalc.ts` line 239). The button is `+ Ürün ekle` (`ProductRows.tsx` lines 237–238, `labels.ts` line 223).

Remove: `removeProduct` filters that index (`useDetailedCalc.ts` lines 240–244). The button is `Kaldır` and is disabled while one product remains (`ProductRows.tsx` lines 190–196). An empty list cannot be submitted: `empty_products` (`validate.ts` lines 220–222).

The first screen starts with one blank row (`initialForm`, `formState.ts` line 200).

### d. Would a blank draft silently gain a cost?

Yes, if the validator fallback changes and the stored string is still `''`. `amount('')` returns `undefined` (`toInput.ts` lines 14–16), and the fallback above becomes the calculated cost. A restored draft does not pass through `initialForm`, so changing only `initialForm` does not rewrite a saved blank. The trap is the fallback.

Safest migration, required with the version bump:

1. Keep the localStorage key `maliyet.detailed.draft.v1` (`storage.ts` line 16). Bump the payload `version` from 1 to 2 (`DRAFT_VERSION`, line 18).
2. `decodeDraft` accepts version 1 and version 2. It still rejects every other version. Today version 2 is discarded (`storage.test.ts` lines 86–88). Discarding version 1 would wipe existing drafts.
3. Run the migration before the strict shape check, or keep the new discount key optional the way recipe fields already are (`storage.ts` lines 103–124 and 137–151).
4. For each product, missing discount becomes `'0'`.
5. If `owner.bagKurMonthlyCost` is missing or blank, write `'0'`. Do not write `11.808,23`.
6. For each stored position, if `employerCostPerPerson` is missing or blank, write `'0'`. Do not add a position.
7. Leave `owner.monthlyAmount`, meal, transport, and bonus as stored.
8. New sessions use `initialForm`, which shows the 2026 prefills. They are not produced by migration.

### e. Working days

Yes. Limit is 1 to 31 (`limits.ts` line 31). The field is on the Giderler assumptions block:

```tsx
// src/features/detailed/components/DetailedForm.tsx lines 467–474
<NumberField
  id="assumptions.operatingDaysPerMonth"
  label={COPY.operatingDays}
  value={form.assumptions.operatingDaysPerMonth}
  onChange={(value) => calc.setAssumption('operatingDaysPerMonth', value)}
  onBlur={() => calc.markTouched('assumptions.operatingDaysPerMonth')}
  unit="gün"
  error={calc.errorFor('assumptions.operatingDaysPerMonth')}
/>
```

Label `Ayda çalışılan gün` (`labels.ts` line 269). A new form prefills `30` from `DETAILED_DEFAULTS` (`formState.ts` line 232). Empty input falls back to 30 (`validate.ts` lines 381–385). Below 1 or above 31 is `below_min` / `above_max`. DF-85 does not change this field.

---

## 4. Parameters module

One module, two records that share a shape and must not be read across engines.

```ts
type MoneyParam = {
  value: number
  source: string
  validFrom: string
  note: string
}
```

| Record | value | source | validFrom | note |
| --- | --- | --- | --- | --- |
| `detailed.employerCostPerPerson` | 40874.63 | ÇSGB asgari ücret page, 2026, no SGK incentive. Gross 33_030; employer SGK 21.75% + unemployment 2% | 2026-01-01 | Form prefill for a new position. Engine omitted fallback stays 0. Not a payroll engine (DF-15) |
| `detailed.bagKurMonthlyCost` | 11808.23 | 2026 Bağ-Kur floor, 35.75% of 33_030, no 5-point discount | 2026-01-01 | Form prefill for a new form. Engine omitted fallback stays 0 |
| `detailed.vatRate` | 0.10 | DF-65. Lokanta / kafe service rate, still 10% in 2026 | 2023-07-10 | Already the editable engine default. Do not add a second copy inside components |
| `quick.exampleEmployerCostPerPerson` | 32000 | `viewModel.ts` example café, not a statute | product | Stale against the 2026 employer-cost floor. Not applied. Hızlı stays on this example until its own decision |
| `quick.vatRate` | 0.10 | Quick spec, system assumption, not editable | 2023-07-10 | Separate record from Detaylı even though the number matches |
| `quick.posCommissionRate` | 0.0356 | Quick market assumption | product | Staleness unknown. Not a 2026 statute |
| `detailed.posCommissionRate` | 0.0359 | DF-08 | product | Staleness unknown. Do not “correct” it toward Quick’s 3.56% in this work |
| `both.rentWithholdingRate` | 0.20 | DF-12 and the Quick spec. Not re-checked against a 2026 GİB notice in the DF-85 pass | product | Keep two records, same value, neither engine imports the other |

Rules:

- Detaylı form reads `detailed.employerCostPerPerson` and `detailed.bagKurMonthlyCost` for the visible prefill only.
- `validateDetailedInput` does not read those two records. Its omitted fallback remains the literal 0.
- Quick does not read Detaylı records. Detaylı does not read Quick records.
- Replacing Quick’s 32_000 example requires a Quick decision. Listing it here does not change it.
- POS rates stay opinion until someone publishes a new approved assumption. Do not refresh them because the wage changed.

---

## 5. Test plan

Lock no output number until it has been computed by hand, outside the engine, and the two agree. Suggested inputs:

### (i) Discount greater than 0

One product. `normalPrice` 110, `onlinePrice` 220, `discountRate` 0.10, `dailyQuantity` 10, `unitProductCost` 20.

Mix: salon 0.50, takeaway 0.20, delivery 0.30. Payment: cash 0, card 1, meal card 0. POS 0.02. Meal card 0. Platform fee 0.10. Mode `platformOnly`. Packaging 0. Courier 0. Days 30. VAT 0.10. No positions, no rent, no owner, no opex, no capex. Ramp and escalation 0. Horizon 12.

Hand-compute, before writing the assertion:

- Effective prices: 99 and 198.
- Monthly units by channel: 150, 60, 90.
- Gross by channel: `150 × 99`, `60 × 99`, `90 × 198`.
- VAT and net from that gross at 10%.
- Product cost: `300 × 20`.
- Card fee: `(salon gross + takeaway gross) × 0.02`. Platform fee: delivery gross × 0.10.
- Operating result equals net − product cost − those two fees (fixed cost 0).
- Also assert the same input with `discountRate` 0 matches a hand total that uses 110 and 220. And assert `discountRate` omitted matches that zero-discount total.

### (ii) 2026 prefills, as explicit inputs

Same sales as (i) with discount 0. One position, headcount 1, `employerCostPerPerson` 40874.63, meal/transport/bonus omitted. Owner amount 0, `bagKurMonthlyCost` 11808.23. No rent, no opex, no capex.

Hand-compute the (i) zero-discount contribution, then:

- Payroll = 40874.63
- Owner cost = 11808.23
- Operating result = contribution − 40874.63 − 11808.23

A second case passes `minimalRawInput()` and asserts Bağ-Kur 0, payroll 0, and fixed cost 0. That locks the “no hidden fallback” rule.

### (iii) Channel sum is not 100%

`goldenRawInput()` with `channelMix: { salon: 0.50, takeaway: 0.20, delivery: 0.20 }`.

Assert `validateDetailedInput` returns `ok: false` and an error `{ path: ['channelMix'], code: 'mix_not_100' }`. Assert the test never calls `calculateDetailed` on that input. No month numbers are expected, so nothing is hand-computed. A UI test, if added, only checks that the previous result is not shown after the mix becomes invalid.

---

## 6. PR plan (PRs 2–5)

PR 1 is this decision. Each later PR is shippable on its own. Hızlı Hesap is not in any of them. Run `npm run test:run`, `npm run lint`, and `npm run build` before each one merges. For PR 2 and PR 4, also check the changed screen at 390px and at desktop width.

### PR 2 — Akış shell (D1, D2, D6)

Scope: Klasik / Akış segment on Detaylı, using the existing `qc-segment` control. Akış prints the stabilized base month in the step order, using only fields that exist today. Missing rows from §3b are omitted until PR 3, not invented in the component. Payback text is the engine’s “Nth month” / horizon message. No yatırım payı and no simple ratio. When the channel mix is invalid, clear the shown result.

Files: `DetailedFeasibilityPage.tsx`, a new presentational component under `src/features/detailed/components/`, `labels.ts`, `useDetailedCalc.ts` (hide the stale view only).

Verify: golden tests unchanged. A mix of 90% shows the mix error and no figures. A mix of 100% matches Klasik for the same draft. Toggle state is not written into the draft.

### PR 3 — Additive month fields (D1 waterfall)

Scope: Appendix E.5 only. Assign the five fields from numbers `calculateMonth` already has. Klasik labels stay.

Files: `types.ts`, `calculate.ts`, `contract.test.ts`, and the Akış component from PR 2.

Verify: on the golden month, each new field matches its identity and `monthlyOperatingResult` is still 261_145.6495. Payback month is still 10.

### PR 4 — Discount (D3, D5)

Scope: fold Appendix E.1, E.2, and E.4 into the spec body, then implement. Engine version bumps. VAT stays one global rate.

Files: `unitEconomics.ts`, `types.ts`, `validate.ts`, `limits.ts`, `defaults.ts`, `formState.ts`, `toInput.ts`, `storage.ts`, `storage.test.ts`, `ProductRows.tsx`, `labels.ts`, `priceSuggestion.ts` and/or `recipeCost.ts`, `recipePreview.ts`, `reportView.ts`, `goldenVector.ts` or a new discount fixture, `unitEconomics.test.ts`, `calculate.test.ts`.

Verify: §5 case (i) matches the hand totals. The §18.2 golden vector is unchanged. A version-1 draft opens with discount 0 and the same operating result as before the migration. A 100% discount calculates and does not throw. Suggestion at a non-zero discount restores the list price, checked by hand on one product.

### PR 5 — Visible 2026 defaults (D4)

Scope: form prefills from the parameters module. Migration writes explicit 0 for blank Bağ-Kur and blank employer cost. Validator fallbacks stay 0.

Files: new parameters module under `src/core/detailed/` (or `src/features/detailed/` if the engine must not import it; prefer the feature, so the engine cannot read it by accident), `formState.ts`, `storage.ts`, `storage.test.ts`, `labels.ts` if the fields need a source note.

Verify: a new form shows 11.808,23 in Bağ-Kur and does not add a staff row. Adding a person shows 40.874,63. A migrated blank draft shows 0 and still calculates 0. `minimalRawInput` still resolves Bağ-Kur to 0. §5 case (ii) matches the hand total when those amounts are passed explicitly.
