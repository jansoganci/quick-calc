# Quick Calculation — Frontend Implementation Spec

**Status:** Active Quick / Lite UI specification. Authority order: `quick-calculation-scope-v1.md` (model, terminology) → `DESIGN_DIRECTION.md` (locked visual/UX rules) → this document (measurements, classes, copy).
**Visual reference:** `Quick Calculation Reference.dc.html` — 1a desktop result, 1b mobile result, 1c pre-calculation and error states. The reference is hand-written HTML for looks only; implementation is Tailwind + daisyUI.

---

## 1. Tokens

Declare as a daisyUI theme so a dark theme can be added later without touching markup.

| Role | Value | Used for |
| --- | --- | --- |
| accent (`--p`) | `#1D3A5F` | headline figure, remaining-profit bar segment, primary button, focus ring |
| accent hover | `#16304F` | button hover |
| ink | `#16181C` | figures, table labels, total rules |
| ink secondary | `#5B6169` | field labels, non-current simulation rows |
| ink muted | `#8A9199` | units, section eyebrows, caveats, share column |
| hairline | `#E3E5E8` | section dividers, output-group dividers |
| hairline light | `#EEF0F2` | between breakdown/simulation rows |
| hairline mid | `#D6D9DD` | bar border, rule above remaining profit |
| border input | `#C3C8CE` | input border, rest state |
| surface | `#FFFFFF` | page and input column |
| surface result | `#FCFCFD` | result column (desktop only; mobile is white) |
| error | `#A0503C` | invalid input border + message. Muted brick, never `#EF4444`. Validation only — never a result figure |

Bar cost ramp, in locked order: `#C3C8CE` KDV · `#3F4650` product · `#545C68` payroll · `#6B7280` rent · `#8A9199` other · `#A8AEB6` POS · `#CFD3D8` investment recovery · `#1D3A5F` remaining. Deliberately not a hue scale — it reads as one quantity divided, not seven categories competing.

**Type:** IBM Plex Sans 400/500/600; IBM Plex Mono 400/500 for every number. `font-variant-numeric: tabular-nums` on all numeric cells (`tabular-nums` in Tailwind) so live recompute never shifts layout (R4).

**Scale:** 44/36px headline · 21/18px summary sentence · 22/20px output figures · 15px input values · 14/13px table body · 13px labels · 12px caveats and units · 11px eyebrow (uppercase, `tracking-[0.08em]`).

**Radius:** 4px everywhere (`rounded`). Nothing larger. **Shadow:** none, except the focus ring `0 0 0 3px rgb(29 58 95 / 0.13)`.

## 2. Desktop layout

`max-w-[1152px] mx-auto`, grid `392px 1px 1fr`. Left column inputs (`p-[30px]`), 1px hairline, right column result (`p-[30px_34px]`, `bg-[#FCFCFD]`). Result column `sticky top-0 max-h-screen overflow-y-auto`.

> **Corrected.** This previously read `sticky top-0 self-start max-h-screen overflow-y-auto`, and `self-start` prevents the sticky behaviour it was meant to support. `align-self: start` shrinks the grid item to its content, so the pane exactly fills its containing block and has zero travel — measured at 1710px, the pane scrolled to −540px instead of pinning. With the item left to stretch (the grid default) the pane has real travel and pins at the top. The page frame also had `overflow-hidden`, which makes it a scroll container and defeats `position: sticky` outright; it is now `overflow-x-clip`, which still clips horizontally but creates no scroll container. Sticky engages whenever the form column is taller than the viewport-capped result pane.

Inputs sit in a 2-column grid, `gap-y-[15px] gap-x-[13px]`; product cost and initial investment span both columns. Input row: `h-10` **from the `lg` breakpoint up**; below it the row is 44px, because DESIGN_DIRECTION.md §1.1 locks "no interactive target below 44px" and that rule governs the mobile state. The same split applies to the `Özeti Kopyala` control (§3.1b). Value right-aligned in Mono, unit suffix in muted 12px. daisyUI: `input input-bordered` with `!rounded` `!h-10` and the border token; hint/error text as `label-text-alt`.

Assumptions: one row, label left, current values as a Mono summary right, `▾`. daisyUI `collapse collapse-arrow` with the default chrome removed — border and background off. Collapsed by default; a user-edited assumption gets its value in ink instead of muted, no badge.

`Hesapla`: `btn btn-primary w-full h-[46px] !rounded`, disabled until all 8 primary inputs validate, with `Sonucu görmek için tüm alanları doldurun` beneath in 12px muted.

## 2.1 Masthead and colophon

**Added after the original spec.** No document previously described a header or footer; both are recorded here as a new product surface. They carry only what the locked rules permit: there is no router (ARCH D4), so no navigation; no icons outside the assumptions chevron (§7), so no mark; and the accent stays reserved for the headline figure and focus states (DIRECTION V2), so neither is filled or coloured.

**Masthead.** One hairline-separated row inside the same `1152px` frame as the form and result, so the page reads as a single sheet. `h-14` from `lg`, 52px below it; padding `30px` / `18px` to match the form column. Product name left in Plex Sans 600 15px ink; mode label right in the 11px uppercase eyebrow style already used for `İŞLETME BİLGİLERİ` and `SONUÇ`. Bottom rule `--qc-rule`. **Not sticky** — it must not compete with the result column's own `lg:top-0`.

**Colophon.** Above a `--qc-rule` top rule, `18px` padding, 12px `--qc-muted`. One row with `space-between` from `lg`, stacked with a 5px gap below it. Three items: the v1 scope (scope §26), a six-word statement of what the tool is, and the engine version in Plex Mono 11px `--qc-subtle`. The version is read from `meta.quickEngineVersion`, never typed — scope §18 requires a formula change to be detectable as a version difference.

The §10.1 limitation statement deliberately stays with the earnings figure and is **not** repeated in the colophon.

Both elements are rendered as `<header>`, `<main>` and `<footer>`, which are also the document's only landmarks.

## 3. Result (locked order — R1…R5)

1. **Summary sentence (R1).** 21px, `leading-[1.5]`, `max-w-[610px]`, `text-wrap:pretty`. Amounts inline in Mono 500; the remaining amount in accent. Nothing else on the screen uses accent text.
1b. **"Özeti Kopyala" (R6).** A quiet 13px text control on its own line beneath the summary sentence, ink-secondary, underline on hover only — `btn btn-ghost btn-sm` with the daisyUI background and radius removed, or a plain `button`. On click it copies the plain-text summary and swaps its own label to `Kopyalandı` in muted for ~2s. No icon, no toast, no modal. Mobile: same control, 44px touch height.

   Clipboard payload (plain text, newline-separated, Turkish number format):
   ```
   Ortalama satış: 140,00 TL
   Satış başına maliyet: 107,56 TL
   İşletmede kalan: 32,44 TL
   Aylık işletme kazancı: 116.784 TL
   Yatırımın geri dönüşü: 7,7 ay
   ```

2. **Headline.** Label 13px muted, figure Mono 500 44px in accent, `tracking-[-0.02em]`, unit 21px secondary. Average sale right-aligned at 19px as the reconciliation anchor.
3. **Bar (R2).** `flex h-11` + 1px `#D6D9DD` border, eight `div`s with percentage widths, no radius, no gap. In-bar labels only where a segment exceeds ~15% width (product, payroll, remaining); everything else is read from the table. `0,00 TL` / `140,00 TL` end labels beneath in Mono 11px. Widths are `share × 100` from the engine; the last segment absorbs the rounding remainder so the row always totals exactly 100%.
4. **Breakdown table.** Grid `10px 1fr auto 58px`. A 10px full-height swatch links each row to its bar segment — this replaces any legend. Amount in Mono, share in muted Mono. Rules: `#EEF0F2` between rows, `#D6D9DD` above remaining profit, `#16181C` above and below the remaining row, then a `Toplam 140,00 TL` line in 13px muted. Remaining profit is the only row at weight 600.
5. **Four outputs.** 4-column grid, hairline dividers, no cards, no icons. Label 12px 2-line clamp, figure Mono 22px in ink. Negative earnings render `−28.602 TL` in ink — no colour, no arrow (V3). The §10.1 limitation note sits directly beneath in 12px muted.
6. **Simulation.** Grid `1fr auto auto auto`. Header row 12px muted, `#16181C` rule under it and at the table foot. Current row: weight 600, ink, `#D6D9DD` rules above and below, `py-[11px]` against `py-[10px]` — no fill, no accent. §12.4 caveat beneath in 12px muted.

**Money format:** always full Turkish — `1.945.947 TL`, `107,56 TL`, `%25,5`. Group separator `.`, decimal `,`, unit after a space. Never abbreviated, never a currency symbol. Use `Intl.NumberFormat('tr-TR')`.

**Input number formatting:** monetary and large-number fields show Turkish grouping while typing (`450000` → `450.000`, `1500000,50` → `1.500.000,50`). This is presentation only. The engine still receives numeric values. Percentage assumption fields are not grouped. Paste of `1500000`, `1.500.000`, or a valid Turkish-formatted number must parse to the same number.

## 4. Motion

**R3:** on the first valid `Hesapla`, the result column transitions in once — `opacity 0→1` with `translateY(4px→0)`, 220ms `cubic-bezier(0.2,0,0,1)`. One element, one transition. No stagger, no scale, no bounce.
**R4:** on live recompute, changed figures get a 180ms opacity dip to 0.55 and back. No counters, no rolling digits, no layout shift. Respect `prefers-reduced-motion` by dropping both.

## 5. Mobile (§1.1)

Single column, `px-[18px]`, white throughout, no sticky column. Order after `Hesapla`: summary sentence → headline → bar → breakdown table → outputs (2×2) → simulation → caveats. The page scrolls to the result region on first calculation so the summary sentence and headline land in view.

Bar keeps its full width at `h-[38px]` and drops all in-bar labels — the swatch column carries identification. Breakdown grid becomes `9px 1fr auto 48px` at 13px, rows `h-10` for touch. Outputs go 2×2, figures 20px. Simulation drops the scenario column and keeps `Günlük · Birim maliyet · Aylık kazanç` — the volume number is the scenario label; rows `py-[11px]` = 44px targets. Nothing scrolls horizontally: figures wrap the table, never widen it. Headline 36px, summary 18px. Assumptions collapse expands inline, full-width rows, 44px controls.

Breakpoint: single column below `lg` (1024px), two columns at and above.

## 6. Turkish copy — draft for review

**Masthead / colophon:** Product name *(placeholder — pending a product decision)* · `Hızlı Hesap` · `TRY · Türkiye · Kafe` · `Basitleştirilmiş bir ön değerlendirmedir.` · `Hesap motoru {version}`.
**Input labels:** Ortalama satış tutarı (hint *KDV dahil*) · Günlük satış adedi · Satış başına ürün maliyeti · Aylık kira (Net kira / Brüt kira control; default Brüt) · Diğer aylık giderler · Çalışan sayısı · Kişi başı aylık maliyet · Başlangıç yatırımı.
**Assumptions:** Ayda çalışılan gün · Yatırım geri kazanım süresi (ay) · Kartlı ödeme oranı · POS komisyon oranı.
**Breakdown rows:** KDV · Ürün maliyeti · Personel · Kira · Diğer giderler · POS komisyonu · Yatırım geri kazanımı · **İşletmede kalan** · Toplam.
**Outputs:** Aylık işletme kazancı · Brüt kâr marjı · İşletme kâr marjı · Yatırımın geri dönüşü.
**Headline:** Satış başına tahmini toplam maliyet.
**Simulation:** Satış hacmi simülasyonu · Senaryo · Günlük satış · Satış başına maliyet · Aylık kazanç · Mevcut.

**R1 sentence:** `140,00 TL’lik ortalama satışın 107,56 TL’si maliyete gidiyor, 32,44 TL’si işletmede kalıyor.`
Loss variant: `140,00 TL’lik ortalama satışın tamamı maliyete gidiyor; her satışta 8,20 TL açık oluşuyor.`

**Validation** (from the engine's four codes, limit interpolated):
- `required` — `Bu alan gerekli.`
- `not_a_number` — `Lütfen bir sayı girin.`
- `below_min` — `En az {min} girilebilir.`
- `above_max` — `En fazla {max} girilebilir.`

**Caveats:**
- Earnings (§10.1) — `Aylık işletme kazancı basitleştirilmiş bir tahmindir; net kâr ya da işletme sahibinin eline geçen tutar değildir. Kurumlar vergisi, gelir vergisi, finansman giderleri ve kredi ödemeleri, işletme sahibinin maaşı ve ortaklara yapılan ödemeler ile diğer mali yükümlülükler hesaba katılmamıştır. Yatırım geri kazanım payı ise bir gider olarak bu tutarın içindedir.`
  **Corrected against scope §6.5, §10.1 and C25.** The earlier wording used *amortisman* (depreciation), which §6.5 retires from this module in code, copy, labels and charts, and it stated that the allocation was excluded when C25 locks it as included as a cost. It also named only two of the five exclusions §10.1 requires; income tax, owner salary/drawings/dividends and other financial obligations have been added.
- Simulation (§12.4) — `Simülasyonda kira, personel ve diğer sabit giderlerin değişmediği varsayılmıştır. Satış hacmi arttıkça satış başına maliyetin düşmesinin nedeni budur.`
- Payback unavailable — `Bu satış hızında yatırım geri dönüşü hesaplanamıyor.`
- Exceeds recovery period — `Yatırımın geri dönüşü öngörülen {n} aylık süreyi aşıyor.`

## 7. Not in v1

No warning slot (add when the engine emits warnings) · no URL sharing, link encoding or social share targets (clipboard copy only, R6) · no PDF or file export · no dark theme (tokens are ready for it) · no R5 simulation-row preview · no icons anywhere except the assumptions chevron.
