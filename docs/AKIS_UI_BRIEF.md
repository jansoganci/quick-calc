# Akış UI brief

> **Superseded on 18 November 2026 (owner decision).** Akış is a read-only funnel on the Sonuç screen, not an input form. Inputs stay on the four input screens; Akış ends with "Girdilere dön". The interaction contract and field map below (inline inputs, live edits, deltas, product cards) no longer apply. Funnel order: products → toplam satış → KDV → ürün maliyeti → kanal kesintileri → personel → kira ve aidat → diğer giderler → sen ve Bağ-Kur → ayda sana kalan + engine payback. Remainders: DETAILED_FINANCIAL_SPEC.md Appendix E.8. Design reference: the owner's "Akış funnel redesign" canvas.

Reference image: docs/assets/akis-prototype.png (owner's design mock).
This is a product brief for LAYOUT and INTERACTION. Formulas stay in src/core. The mock was a throwaway HTML page with its own browser math; do not copy its math.

## Interaction contract
1. Inputs sit INSIDE the flow, next to the step they affect. Changing an input updates every following step immediately. No Hesapla press in Akış. Use the live `evaluation` that useDetailedCalc already computes; when invalid, show field errors and blank results (DF-85 D6).
2. After an edit, changed numbers flash briefly and show a small up/down delta against a reference snapshot. Snapshot = values when the user opened Akış, replaced when they press "Referansı sıfırla" (display only, does not touch the form). The delta is a difference of two engine results; compute it in the pure builder (akisView.ts) and unit test it.
3. Products: cards at the top, "+ Ürün ekle" and remove, all flowing into Brüt ciro. One "Aylık çalışma günü" field.
4. Channels: three inputs (dükkan içi, gel al, platform). Chips show each channel's brüt amount. Sum != 100: error, results blank.
5. Order top to bottom: products, days, brüt ciro, channel split, KDV, net satış, ürün maliyeti, brüt kâr, kanal masrafları (with sub-rows that have inputs), personel, kira (+aidat), diğer giderler, sahip payı, Bağ-Kur, işletme sonucu (highlighted, with its share of net satış), engine payback (highlighted).
6. Style: restrained, for people who do not know BI. Row = label left, input (if any), value right, delta far right. Totals on tinted rows. Sub-rows indented. qc-* tokens only.
7. Mobile 390px: stack the label above the input on narrow screens. The mock squeezes labels into 4-line columns; do not repeat that.

## Mock field -> real field (check each in formState.ts; do not invent fields)
- Ürün name, fiyat, günlük adet, birim maliyet -> product row fields. The engine has TWO prices (normalPrice for salon and takeaway, onlinePrice for delivery); show both as the Klasik form does. If a recipe supplies unit cost, show it read-only.
- İndirim % -> only after the discount PR exists. Do not render before.
- KDV % per product in the mock -> WRONG. One global editable VAT field (D5).
- Aylık çalışma günü -> assumptions.operatingDaysPerMonth.
- Channel percentages -> channelMix (salon, takeaway, delivery).
- POS komisyonu (single %) in the mock -> WRONG. The engine uses payment mix + POS/meal-card rates. Show the engine's own fields, same validation as Klasik.
- Platform komisyonu -> platform fee rate (+ the existing mode choice).
- Ambalaj (single TL) in the mock -> WRONG. Engine has takeaway and delivery packaging + own-courier amounts.
- Kira -> occupancy rent (+ net/gross basis, aidat). Sahip payı -> owner.monthlyAmount. Bağ-Kur -> owner.bagKurMonthlyCost.
- Personel, Diğer giderler, Yatırım are LISTS in the engine. Show the total with an expandable "Düzenle" area that REUSES the existing row components (PositionRows, LineRows). Do not reimplement them.
- Remove from the mock: "Yatırım, TL / ay", "Yatırım payı sonrası kalan", the simple "kaç ayda geri döner". Akış shows only the engine's payback message (DF-34, DF-36).
- Every inline input writes the same form state through the same setters as Klasik. Switching Klasik/Akış never loses data.

## Phasing
PR 2: shell, read-only waterfall, stale-result fix (already specified).
PR 2b: inline editing, live evaluation, deltas/flash, product cards, per this brief.
Reuse existing components and tokens. No formulas in components.
