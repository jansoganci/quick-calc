# Detailed Feasibility — Frontend Implementation Spec

**Status:** **Active Detailed UI specification — designed and implemented.** The design pass was approved by the product owner, and `src/features/detailed/` implements what follows. The six decisions once listed as blocked (§8.3) are resolved.
**Design source:** Claude Design canvas *Detaylı Fizibilite Tasarımı* — https://claude.ai/code/artifact/1121e3ea-98b6-4eeb-b1ab-a0d5fc531d66 (6 artboards: masaüstü girdi, masaüstü bölüm 05–10 + özet paneli, masaüstü detaylı sonuçlar, durumlar ve bileşenler, mobil girdi, mobil sonuç).

**Authority order.** `DETAILED_FEASIBILITY_DECISIONS.md` (product decisions, DF-series) → `DETAILED_FINANCIAL_SPEC.md` (formulas, input/output contract) → `DESIGN_DIRECTION.md` (locked visual/UX rules, V-series) → `APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` (structure) → this document (Detailed screen structure, measurements, copy). `FRONTEND_IMPLEMENTATION_SPEC.md` remains the authority for the Quick / Lite screen; this document never overrides it.

This document adds **no financial inputs, no outputs and no formulas.** Every figure it displays is read from `DetailedResult` or from `DetailedResolvedInput`.

---

## 1. Design concept

**Tek sayfa, on bölüm, kalıcı karar özeti.**

One scrolling page. Inputs are ten hairline-separated sections in a fixed order. A persistent panel on the right answers one question continuously — *is this business making money?* — while the depth (projection, scenarios, channel economics, assumptions) sits full-width below the inputs, reached deliberately.

Three rules carry the whole design:

| # | Rule | Why |
| --- | --- | --- |
| DUI-1 | **Calculate once, then live.** Inherits `DESIGN_DIRECTION.md` V6 without change. Before the first `Hesapla` no result figure, placeholder, skeleton or partial number appears anywhere | Same product personality as Lite; a ten-section form that recomputes as you type would present numbers from a half-entered model as if they were an answer |
| DUI-2 | **Section echo.** After the first calculation each section header carries **one** figure, read directly from the engine — never derived, never a new KPI | Turns the form into its own explanation with zero new arithmetic |
| DUI-3 | **Two result tiers.** Tier 1 (the decision) lives in the persistent panel; Tier 2 (the reasoning) lives full-width below the inputs | The side panel must orient, not become a second dashboard |

**Section echo map** — the only figures a section header may show, all from the **base** scenario's `stabilizedMonth` unless noted:

| Section | Engine field |
| --- | --- |
| 01 Ürünler ve satış | `grossCustomerSales` |
| 05 Personel | `monthlyPayroll` |
| 06 İşletme sahibi | `monthlyOwnerCost` |
| 07 Kira ve aidat | `monthlyOccupancyCost` |
| 08 Diğer giderler | `monthlyOpex` |
| 09 İlk yatırım | `totalInitialInvestment` (top level) |
| 02, 03, 04, 10 | **none** — their costs land jointly in `channelVariableCost` and `paymentPlatformFee`; a per-section split would be a new derivation |

---

## 2. Input information architecture

Ten sections, fixed order, numbered `01`–`10` in Plex Mono 11px `--qc-subtle`. Order is revenue → how you sell → what it costs to run → what it costs to open → framing.

| # | Section | Engine fields |
| --- | --- | --- |
| 01 | Ürünler ve satış | `products[]` |
| 02 | Satış kanalları | `channelMix`, `packaging.takeawayPerOrder`, `packaging.deliveryPerOrder` |
| 03 | Ödeme yöntemleri | `paymentMix`, `posCommissionRate`, `mealCardCommissionRate` |
| 04 | Paket servis **(conditional)** | `delivery.mode`, `delivery.platformFeeRate`, `delivery.ownCourierCostPerDeliveryOrder` |
| 05 | Personel | `positions[]` |
| 06 | İşletme sahibi | `owner.monthlyAmount`, `owner.bagKurMonthlyCost` |
| 07 | Kira ve aidat | `occupancy.*` |
| 08 | Diğer giderler | `opexLines[]` |
| 09 | İlk yatırım | `capexItems[]` |
| 10 | Varsayımlar | `assumptions.*` |

**Section 04 is model-driven progressive disclosure:** it renders only when `channelMix.delivery > 0`, which is exactly the condition under which `delivery.mode` becomes required (spec §6.4). No toggle, no "advanced" switch.

**Two mix tables (the pattern that keeps 02 and 03 small).** Both are three-row tables with a reconciling total row, not a field grid:

```
02  Kanal          Pay      Ambalaj / sipariş        03  Yöntem        Pay    Komisyon
    Salon          50 %     —                            Nakit         40 %   —
    Al götür       20 %     4,00 TL                      Kart          45 %   3,59 %
    Paket servis   30 %     7,00 TL                      Yemek kartı   15 %   10,00 %
    ─────────────────────────                            ──────────────────────────
    Toplam        %100                                   Toplam       %100
```

Packaging sits with the channel that incurs it; each commission rate sits beside the share it applies to. Neither rate hides in an assumptions panel.

**The mix is never normalised** (spec §6.2). The total row is the reconciliation and the error surface. A "dengele / kalanı ata" auto-fill control is **rejected** — it would write a number the user did not choose into a financial input.

### 2.1 Repeating rows

One pattern, three densities.

| Collection | Fields | Desktop | Mobile |
| --- | --- | --- | --- |
| `products[]` | 5 | Grid `1fr 104px 104px 92px 104px 56px`, 11px eyebrow column headers, `#EEF0F2` between rows | Collapsed summary row (`Filtre kahve · 65,00 TL · 150 adet ▾`) expanding inline to a `#FCFCFD` block: name field full width, then a 2×2 grid |
| `positions[]` | 6 | Two-line block: `1fr 104px 56px` (ad, kişi, Kaldır), then a 4-column per-person grid under 11px eyebrows | Same block, collapsed/expanded as products |
| `opexLines[]` | 2 | Two-up grid, each cell `1fr 124px 52px` | Single column, 44px rows |
| `capexItems[]` | 2 | Two-up grid, each cell `1fr 132px 52px` | Single column, 44px rows |

Remove control is the text `Kaldır` in `--qc-muted`, never an icon — `FRONTEND_IMPLEMENTATION_SPEC.md` §7 allows no icons beyond the assumptions chevron and this design needs no amendment to it.

Add control is a quiet accent text button at the foot: `+ Ürün ekle`, `+ Pozisyon ekle`, `+ Diğer gider ekle`, `+ Yatırım kalemi ekle`. Adding appends, expands (mobile), scrolls into view and focuses the name field.

**No per-product or per-position derived figure is displayed.** `positionMonthlyCost` and per-product revenue are not in the output contract; computing them in the UI would create a second source of truth for a financial figure (CLAUDE.md §3).

### 2.2 Starter lines (08, 09)

DF-18/19/20 forbids a blank expense sheet; DF-58 requires custom lines. Twelve empty rows would be visually heavy, so the starter set is a **palette of quiet text controls** under the eyebrow `Sık kullanılan giderler`. Clicking one appends a line with that name and an empty amount and dims the palette entry.

- **08 palette:** Elektrik · Su · Doğalgaz · İnternet · Güvenlik · Yazılım abonelikleri · Mali müşavir · Temizlik · Bakım / onarım · Sigorta · Sarf malzeme · İlaçlama. Security is **one** line; no water-treatment line (DF-20 as superseded).
- **09 palette:** Tadilat / dekorasyon · Ekipman · Mobilya · Tabela · Açılış stoğu · Kuruluş / açılış giderleri (DF-32, DF-33).

Chips and pills are excluded by `DESIGN_DIRECTION.md` §3, hence text controls.

> **Resolved (was D-1).** DF-18/19/20 leaves *"which standard lines start empty vs. with a suggested amount"* DEFERRED. This design answers *neither starts with an amount, and none is pre-listed as a row* — a palette. Approved in the design pass and implemented in `components/LineRows.tsx`.

### 2.3 Section 10 — assumptions, two tiers

**Visible:** `vatRate`, `operatingDaysPerMonth` (two fields); `projectionHorizonMonths` (segmented 12 / 24 / 36); `rampUpPreset` (segmented Yavaş / Normal / Hızlı, with the active preset's month table as an 11px hint); `scenarioVolumeDeltas` (three fields under Kötü / Baz / İyi eyebrows).

**Collapsed (`collapse`, same chrome-stripped treatment as Lite's assumptions strip):** `Gelişmiş varsayımlar — yıllık artışlar`, summary `%0 · %0 · %0` in Mono on the collapsed title, so the three escalation rates are visible **even while collapsed and even at 0%** (spec §5.1). Expanded: `salesPriceAnnualIncrease`, `productCogsAnnualIncrease`, `fixedCostAnnualIncrease`.

They appear a second time, unconditionally, in the results assumptions block (§4.7) — that is the `§16.4` requirement; the collapsed input summary is a courtesy, not the discharge of it.

---

## 3. Layout and breakpoints

Frame is `max-w-[1152px]` in **both** modes, at every width, with `border-x border-qc-rule` on `bg-qc-page` — identical to Quick. A wide viewport gets more margin, not a wider sheet.

| Breakpoint | Sections | Layout | Result access |
| --- | --- | --- | --- |
| `< md` (mobile) | Accordion, **one open at a time**; first visit opens 01 | Single column, `px-[18px]` | Sticky bottom bar |
| `md` – `< lg` (tablet / narrow desktop) | Always open, hairline-separated (the desktop IA) | Single column; repeating rows keep their stacked form, which switches to the desktop grid at `lg` with the layout | Sticky bottom bar |
| `lg` – `< xl` (standard desktop) | Always open | `grid-cols-[1fr_1px_372px]` — inputs 779px, hairline, sticky özet pane | Sticky özet pane |
| `≥ xl` (wide desktop) | Identical to `lg` | Identical to `lg` | Identical to `lg` |

`md` changes **section behaviour**; `lg` changes **page layout**; `xl` is a deliberate no-op. A fixed measure is what keeps line lengths and figure sizes constant across the product, which is the substance of the "quiet analytical instrument" direction.

**Sticky offsets.** `AppHeader` is `lg:sticky lg:top-0 lg:z-10` in the current tree, so the özet pane is `lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto`. As in Quick, the pane must **not** carry `self-start`, and no ancestor may create a scroll container (`overflow-x-clip`, never `overflow-hidden`).

### 3.1 Mobile interaction model

- Accordion header: `min-h-[52px]`, `01` eyebrow + section name (15px ink) left; right side shows the section echo figure after calculation, otherwise a count (`4 ürün`, `%100`, `3 pozisyon`) or `—`.
- Each expanded section ends with `Sonraki bölüm: {ad} →` — sequence without a wizard, and revisiting stays one tap.
- **Sticky bottom bar**, 60px, white, top hairline — the mobile re-expression of the desktop sticky column that `DESIGN_DIRECTION.md` §1.1 requires:
  - before first calculation: the full-width `Hesapla` button (48px), its disabled reason in 12px muted above it;
  - after: `Aylık işletme sonucu · 122.660 TL` in Mono accent, left; `Girdilere dön ↑` / `Sonuçlar ↓` right.
- Results render as a full-width region after section 10; on the first `Hesapla` the page scrolls so the summary sentence and headline land in view (R3 behaviour).
- Every interactive target ≥ 44px. Nothing scrolls horizontally.

---

## 4. Results

### 4.1 Hierarchy

| Tier | Where | Content, in order |
| --- | --- | --- |
| 1 | Özet pane (sticky) / mobile results head | ① verdict sentence ② `Aylık işletme sonucu` (base) ③ Başa baş · Geri dönüş · İlk yatırım ④ Kötü / Baz / İyi mini-row ⑤ Dikkat edilecekler ⑥ `Tüm sonuçlar ↓` |
| 2 | Full width, below inputs | ① Para nereye gidiyor (bar + table) ② Senaryolar ③ Projeksiyon ④ Yatırımın geri dönüşü ⑤ Kanal ekonomisi ⑥ Başa baş noktası ⑦ Varsayımlar |

This is the brief's question order: *is it viable* → *what does Base look like* → *Bad/Good* → *break-even* → *payback* → *how it evolves* → *where the money goes*, with the last two moved into Tier 2 where they have room.

### 4.2 Özet pane, state A (before first calculation)

Eyebrow `Hazırlık`; the empty-state paragraph; then a **section index** — ten rows, `01 Ürünler ve satış` left, a Mono state right (`4 ürün` / `%100` / `—` / `varsayılan`). This doubles as navigation and as the "what's still empty" answer, and it is why no third navigation column exists. Then `Hesapla` and its hint.

### 4.3 Özet pane, state B (after first calculation)

Eyebrow `Baz senaryo`. Verdict sentence at 18px, amounts in Mono 500, the operating result in accent — the only accent text on the page, exactly as in Lite. `Özeti kopyala` beneath (R6, clipboard only, no share links). Then the 36px Mono accent headline, three hairline-separated figures, the three-column scenario row (Baz in ink/600, Kötü and İyi in secondary), `Dikkat edilecekler · n not`, and `Tüm sonuçlar ↓`.

The section index collapses away in state B; the section echo values (DUI-2) have taken over its job.

**Verdict sentence variants** (structure, not final copy):

- profit: `Baz senaryoda işletme ayda {sonuç} kazanıyor; {yatırım}'lik yatırım {ay}. ayda geri dönüyor.`
- profit, payback beyond horizon: `… kazanıyor; yatırım {n} ay içinde geri dönmüyor.`
- loss: `Baz senaryoda işletme ayda {tutar} açık veriyor; bu haliyle yatırım geri dönmüyor.`
- zero volume: `Satış girilmediği için işletme ayda {sabit gider} gider yazıyor.`

### 4.4 Para nereye gidiyor — the reconciliation bar

Detailed's counterpart to Lite's Average Sale Breakdown Bar, with the same guarantee: the bar reconciles **exactly**.

```
grossCustomerSales = vatAmount + productCogs + channelVariableCost + paymentPlatformFee
                   + monthlyPayroll + monthlyOwnerCost + monthlyOccupancyCost + monthlyOpex
                   + monthlyOperatingResult
```

Nine segments, locked order: KDV · Ürün maliyeti · Kanal maliyetleri · Ödeme ve platform kesintileri · Personel · İşletme sahibi ve Bağ-Kur · Kira ve aidat · Diğer giderler · **Aylık işletme sonucu**. `h-11` desktop / `h-[38px]` mobile, 1px `#D6D9DD` border, no radius, no gap. In-bar labels only above ~15% width; the last segment absorbs the rounding remainder so the row totals exactly 100%. A 10px swatch column links each table row to its segment — this replaces any legend, as in Lite.

> **Resolved (was D-2).** The ramp needs **nine** stops where Lite's has eight. Reuses `#C3C8CE #3F4650 #6B7280 #8A9199 #A8AEB6 #1D3A5F`, adds **two new tokens** — `bar-channel #4A515C` and `bar-owner #7C838C` — keeping it a single monotone ramp rather than a hue scale. Approved; both tokens are in `tailwind.config.ts`.

**Negative operating result.** The bar cannot draw a negative segment. When `monthlyOperatingResult < 0`, the final segment is omitted, the cost segments are drawn at their share of **total cost**, and a caption reads `Toplam maliyet aylık cironun %{n}'i`. The reconciling table beneath still carries the exact minus figure in ink — no colour, no arrow (V3).

### 4.5 Charts — two, both about time

No chart library (architecture D-series). Both are hand-authored inline SVG in a local component.

| Chart | Why it earns its place |
| --- | --- |
| **Aylık işletme sonucu · {horizon} ay** — one line chart, three series (Kötü / Baz / İyi), zero baseline emphasised, Baz at 2.25px accent and the other two at 1.5px `--qc-subtle` | Ramp-up makes the first months materially different from the stabilized month. "You lose money for one month, then turn positive" is a shape, not a number; 24 table rows do not say it |
| **Yatırımın geri dönüşü** — cumulative base operating result, a dashed rule at `totalInitialInvestment`, a marker at the payback month | Payback *is* a crossing. Drawing it also shows how far off an unavailable payback was, which the word "dönmüyor" cannot |

**Deliberately rejected:**

| Rejected | Reason |
| --- | --- |
| Pie / donut of cost composition | The reconciliation bar already divides one quantity and reconciles exactly; a pie at these ratios is unreadable |
| Bar chart of the three scenarios | Three numbers. The table is faster and carries four rows instead of one |
| Channel revenue chart | Three rows. The table is already the compact form |
| Waterfall gross → operating result | A second expression of the reconciliation bar — one quantity, two visuals |
| Classic break-even revenue/cost cross | Implies a revenue-by-volume curve the engine does not produce; break-even here is one units/day figure |
| Monthly revenue chart separate from result | A series with no decision attached |
| Per-KPI sparklines, gauges, speedometers | `DESIGN_DIRECTION.md` §3 |

Mobile: both charts keep full width at 200px / 180px, x-labels thinned to 1 · 6 · 12 · 18 · 24.

### 4.6 Tables

| Table | Shape | Mobile |
| --- | --- | --- |
| Reconciliation (under the bar) | `10px 1fr auto 72px`, 9 rows + `Toplam` | `9px 1fr auto 48px`, 13px, 40px rows |
| Senaryolar | 4 rows × 3 columns; Baz column in ink/600, the operating-result cell at 16px | Unchanged — 3 columns fit at 390px |
| Kanal ekonomisi | 3 rows × 7 columns + `Toplam` | **Transposed:** one hairline block per channel, label/value rows, `Katkı` in 600 under a rule |
| Projeksiyon, ay ay | **Collapsed by default** behind `Ay ay tabloyu göster`. Columns: Ay · Adet · Net ciro · Katkı · Sabit gider · İşletme sonucu | Three columns only: Ay · Net ciro · İşletme sonucu |
| Varsayımlar | Two-column definition list | Collapsed row `13 satır ▾` |

**Not built:** per-product P&L, per-position cost table, monthly cash table, any channel × month cross table. Dense FP&A tables are not the primary UX; the month table is opt-in precisely because 24–36 rows is where that feeling starts. A `Katkı / adet` column is **rejected** — it is a division of two engine figures, i.e. a new financial figure computed in the UI.

### 4.7 Assumptions block (mandatory)

Two-column definition list carrying every field of `meta.assumptions` — **including the three annual rates when they are 0%** — plus `meta.detailedEngineVersion` in Mono 11px. When `channelMix.delivery === 0` the delivery mode and platform fee rows are **suppressed** (spec §15 says the UI should); every other row is unconditional.

---

## 5. States, validation and guardrails

### 5.1 The separation

| Class | Blocks `Hesapla` | Treatment |
| --- | --- | --- |
| **Validation error** — the seven `ValidationErrorCode`s | Yes | `--qc-error #A0503C` border and 11px message, exactly as Lite |
| **Guardrail note** — UI-derived from resolved input | **No** | 12px `--qc-muted` line under the section, plus an entry in `Dikkat edilecekler`. No box, no icon, no badge, no alarm colour |
| **Permanent hint** — prevents the mistake rather than reporting it | No | 12px `--qc-muted`, always visible, no counter entry |

Error copy, from the engine's codes with the breached limit interpolated: `Bu alan gerekli.` · `Lütfen bir sayı girin.` · `En az {min} girilebilir.` · `En fazla {max} girilebilir.` · `Kanal dağılımı %100 olmalı. %{n} eksik.` / `%{n} fazla.` (`mix_not_100`) · `Paket servis satışınız olduğu için bu seçim zorunlu.` (`required` on `['delivery','mode']`) · `En az bir ürün girin.` (`empty_products`).

### 5.2 The six guardrails from the brief

| # | Condition | Class | Copy |
| --- | --- | --- | --- |
| G1 | `headcount > 0 && employerCostPerPerson === 0` | Note, **always also in the panel list** (spec §4.5a requires prominence). `headcount === 0` never warns | `"{pozisyon}" pozisyonunda {n} kişi var ama işveren maliyeti girilmedi. Hesaplama 0 TL ile devam ediyor.` |
| G2 | `owner.monthlyAmount > 0 && positions.length > 0` — static, **no matching algorithm** (DF-79) | Note in 05 | `İşletme sahibini personel listesine eklemeyin. Kendinize ayırdığınız tutar 06'da girilir.` |
| G3 | `occupancy.monthlyAidat > 0` — static (DF-80) | Note in 08 | `Aidat "Kira ve aidat" bölümünde girildi. Diğer giderlere tekrar eklemeyin.` |
| G4 | Product COGS scope | **Permanent hint** in 01 | `Birim maliyet yalnızca ürünün kendi malzeme maliyetidir. Ambalaj ve kurye bedelini buraya eklemeyin.` |
| G5 | Delivery mode unset while `channelMix.delivery > 0` | **Validation error** (spec §6.4) | see §5.1 |
| G6 | Either mix ≠ 100 | **Validation error** (spec §6.2) | see §5.1 |

G4 is a hint rather than a warning on purpose: the app cannot detect that packaging was folded into `unitProductCost`, so the honest move is to prevent it, not to claim to have caught it.

### 5.3 Unavailable results

Each union arm gets a sentence in ink; never a blank or a dash.

| Case | Copy |
| --- | --- |
| `breakEven` · `no_sales_volume` | `Satış hacmi girilmediği için başa baş noktası hesaplanamıyor.` |
| `breakEven` · `non_positive_contribution` | `Ürün başına katkı sıfır ya da altında; bu fiyatlarla başa baş noktasına ulaşılmıyor.` |
| `payback` · `not_reached_within_horizon` | `Yatırım {n} ay içinde geri dönmüyor.` — the cumulative chart still renders |
| `payback` · `non_positive_operating_result` | `İşletme aylık zarar ettiği için yatırım geri dönmüyor.` |
| `payback` · `{ month: 0 }` | `Yatırım tutarı girilmedi.` |
| All `dailyQuantity === 0` | Results render normally; `monthlyOperatingResult = −monthlyFixedCost`, zero-volume verdict variant |

### 5.4 Empty and disabled states

Section 01 starts with **one empty product row**. Every other section renders empty; unfilled optional fields resolve to 0, stated once under the section index: `Boş bırakılan bölümler 0 TL olarak hesaplanır. Yalnızca ürünler zorunludur.`

`Hesapla` disabled fill `--qc-disabled #F1F2F4`, border `--qc-disabled-border`, text `--qc-subtle`, with the reason beneath: `Sonucu görmek için en az bir ürün girin` / `{n} alanı kontrol edin — {bölüm adları}`.

---

## 6. Quick ↔ Detailed navigation

The switch **already exists** in `AppHeader.tsx` and this design changes none of its anatomy — only which side is active and what the inactive side does.

- Placement: masthead right, inside the same 1152px frame. Product name stays left.
- Active: 13px (11px below `lg`), weight 600, `--qc-ink`, 2px `--qc-ink` underline seated on the masthead's bottom rule (`after:absolute after:inset-x-0 after:bottom-0`). **Not the accent** — V2 reserves accent for the headline figure and focus states.
- Inactive: same size, weight 400, `--qc-secondary`; underline on hover only.
- Labels never abbreviate: `Hızlı Hesap` / `Detaylı Fizibilite` at both widths (`COPY.quickMode` / `COPY.detailedMode`, already in `labels.ts`), sizes 13px / 11px, gaps 24px / 12px.
- Sticky: the masthead is `lg:sticky lg:top-0`, so the switch is always reachable on desktop. On mobile it is not sticky — the sticky bottom bar is the persistent surface there, and two sticky bars would eat the viewport.
- Both entries render as `<a href="#quick-calculation">` / `<a href="#detailed-feasibility">` with `aria-current="page"` on the active one, inside the existing `<nav aria-label={COPY.modeNavigation}>`.

> **Resolved (was D-3) — routing.** Architecture D4 says a router arrives "only when a second real screen requires it". This design proposes **in-page mode state** (`useState` in `App.tsx`, both feature states kept mounted or lifted) and **no router**, because Quick R6 puts URL sharing explicitly out of scope, so nothing needs to be addressable. Consequence: mode state lives for the session only — switching modes and back preserves what was typed; a reload does not (there is no persistence in this product). No confirmation dialog on switch.

---

## 7. Visual inheritance and reported inconsistencies

Unchanged from Lite: every token in `tailwind.config.ts`; IBM Plex Sans / Mono with `tabular-nums` on all figures; 4px radius everywhere; the focus ring `0 0 0 3px rgb(29 58 95 / 0.13)`; the error ring; `h-10` controls at `lg` and 44px below; no cards, no shadows, no badges, no gradients, no per-KPI colour; negative values in ink with a minus sign; Turkish only; motion limited to R3's single 220ms entrance and R4's 180ms live dip, both dropped under `prefers-reduced-motion`.

Reported rather than silently resolved:

1. ~~`FRONTEND_IMPLEMENTATION_SPEC.md` §2.1 says the masthead is "Not sticky".~~ **Resolved:** the masthead is sticky from `lg` and the Quick spec now records it. Both modes offset their sticky pane by `lg:top-14`.
2. **`monthlyOperatingResult` is labelled `Aylık işletme sonucu`, where Lite says `Aylık işletme kazancı`.** Deliberate: the Detailed figure is routinely negative and the engine identifier is `…Result`, not `…Earnings`. The two modes are permitted to differ (DF-2.3); recording it so it is not later "fixed" into a false consistency.
3. **Lite's rejected-list bans additional charts.** That list is scoped `Out of scope for Quick v1` (§1.2.2) and does not govern Detailed, whose DF-2.2 questions are time-shaped. §4.5 above states the reasoning and rejects seven chart types to keep the count at two.
4. **The bar ramp needs two new tokens** (D-2) and **the OPEX/CAPEX starter presentation answers a DEFERRED question** (D-1). Both are flagged rather than assumed.

---

## 8. Implementation handoff

### 8.1 Structure (per `APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`)

```
src/features/detailed/
  DetailedFeasibilityPage.tsx      layout grid, sticky pane, results region, mobile bar
  labels.ts                        every Turkish string, plus the *_ORDER display orders (U4)
  formState.ts                     form shape, row factories, the pre-filled defaults
  toInput.ts                       form strings -> DetailedInput; the one percent conversion
  errors.ts                        ValidationError[] -> Turkish messages keyed by path
  guardrails.ts                    G1–G3 derived from DetailedResolvedInput
  sectionSummary.ts                pre-calculation section stand-ins; visible sections
  viewModel.ts                     DetailedResult -> formatted view; ALL formatting lives here
  resultView.ts                    bar segments, channel rows, chart series, assumption rows
  viewModel.test.ts                20 tests: reconciliation, guardrails, errors, edge states
  hooks/useDetailedCalc.ts         form state, V6 gate, live recompute
  components/
    SectionFrame.tsx               number, title, echo slot, note slot, mobile accordion
    ProductRows.tsx  PositionRows.tsx  LineRows.tsx  RepeatingRows.ts
    MixTable.tsx                   used twice (02, 03) — two genuine call sites
    DetailedForm.tsx               composes the ten sections
    SummaryPane.tsx                states A and B, plus the shared Hesapla control
                                   (the column tint sits on the grid item in the page,
                                   so it fills the column when the summary is short)
    MobileSummaryBar.tsx
    DetailedResults.tsx            Tier 2 composition
    ResultBar.tsx  ScenarioTable.tsx  ChannelTable.tsx  MonthTable.tsx
    AssumptionsList.tsx  ProjectionChart.tsx  PaybackChart.tsx  chartGeometry.ts
```

Shared with Quick only through `lib/`, `app/` and `components/` (`NumberField`, the new `TextField`). **No import crosses `features/quick-calc/ ↔ features/detailed/`, and nothing imports `core/quick/` from Detailed or vice versa.** The engine is reached solely through `core/detailed/index.ts`.

### 8.2 Non-negotiables for the implementer

1. No financial formula in a React component. The bar's percentage widths and the chart's pixel coordinates are the only arithmetic allowed in the view layer, and both are pure presentation of engine figures.
2. Every default, limit and label imported from `core/detailed/defaults.ts`, `core/detailed/limits.ts` and `features/detailed-feasibility/labels.ts` — never restated.
3. No new input, no new output, no new KPI. If the design appears to need one, it is a spec question, not an implementation detail.
4. `depreciation`, `amortisman`, `netProfit`, `net kâr` must not appear in identifiers, types, comments or strings.
5. Money formatting always `Intl.NumberFormat('tr-TR')`, full form, unit after a space — `1.027.350 TL`, `%3,59`. Never abbreviated (the mobile chart axis label `250b` in the mock is a **chart tick**, and is the one place an abbreviation is proposed — flag it for approval or replace it with a tick-free axis).

### 8.3 Blocked on approval

### 8.3 Resolved decisions

| ID | Decision | Outcome |
| --- | --- | --- |
| D-1 | OPEX / CAPEX starter lines as a palette of text controls, none pre-listed as a row and none carrying a suggested amount | Approved, implemented |
| D-2 | Two new bar-ramp tokens (`bar-channel #4A515C`, `bar-owner #7C838C`) | Approved, in `tailwind.config.ts` |
| D-3 | No router; in-page mode state, session-scoped, no confirmation on switch | Approved, `app/App.tsx` |
| D-4 | Inline SVG charts, still no chart library — Lite's "ordinary HTML and CSS only" rule was written for Lite's bar | Approved, `components/ProjectionChart.tsx` / `PaybackChart.tsx` |
| D-5 | Correcting `FRONTEND_IMPLEMENTATION_SPEC.md` §2.1 to match the shipped sticky masthead | **Resolved.** The masthead stays sticky from `lg`; it carries the mode switch, and Detailed is a long page where a switch that scrolls away has to be hunted for. The Quick spec §2 and §2.1 now say so, and both modes offset their sticky pane by `lg:top-14` |
| D-6 | Mobile chart axis abbreviation (`250b`) | **Withdrawn.** Both charts render at natural size, so their labels are never scaled down and no abbreviation is needed. Money on every axis stays in full Turkish form |

### 8.4 Two structural notes from the build

**The application shell moved.** `AppHeader` and `AppFooter` left `features/quick-calc/components/` for `app/AppShell.tsx`, and it now also owns the brand — product name, slogan and domain live in `app/shellCopy.ts`, and the page frame moved with them, because both modes render inside one shell and neither feature may import the other (R5). `features/quick-calc/labels.ts` re-exports `app/shellCopy.ts` into its `COPY`, so the Quick module keeps one import surface and no string is stated twice. The Quick screen's rendered output is unchanged.

**Enumeration display order lives in the feature layer.** `core/detailed/contract.test.ts` locks the engine's public surface to six runtime exports, and `CHANNELS` / `SCENARIO_KEYS` / `PROJECTION_HORIZONS` and friends are not among them. Rather than widen a deliberately narrow surface, the `*_ORDER` arrays in `features/detailed/labels.ts` declare display order — a UI concern — each guarded with `satisfies readonly <EngineUnion>[]`, so a change to an engine enumeration breaks the build here instead of drifting silently.
