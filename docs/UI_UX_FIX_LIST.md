# UI/UX Fix List: Detailed Feasibility after the five-screen split

**Audited:** `main` at `21490e8` (13 November 2026). The later commits `#31` and `#32` (SEO prerender) don't change anything below.
**How:** a production build run at 390px (iPhone 13) and 1280px. Tested with the sample café, adding a recipe from scratch, and Hesapla on every screen. Automated checks: horizontal overflow, console errors, missing field labels, touch-target size and text contrast.
**Scope:** presentation and copy only. No item changes a formula, a default value or an engine field. Where an item needs an owner decision, it says so.

**Already working:**
- No horizontal overflow at either width, and no console errors.
- Recipe flow matches `RECIPE_REDESIGN_SPEC.md`:
  - a full-screen dialog on mobile, with focus kept inside it and Esc to close;
  - unit-aware usage labels;
  - a locked cost box;
  - the suffix-free `Reçeteyi tamamla: {Ürün}`.

Priority: **P0** broken · **P1** drift from approved rules · **P2** polish.

---

## P0: broken

### [x] F1. The desktop area menu squeezes every section-01 grid

- **Cause:** `src/app/AppShell.tsx:23` adds a `148px` left column (`lg:grid-cols-[148px_minmax(0,1fr)]`). The Detailed grids still use fixed tracks sized for the old 779px input column, so the `minmax(0,1fr)` name track collapses.
- **Seen at 1280px:**
  - **Menü** (`ProductRows.tsx:10`): product names are about 40px wide (`Am`, `Po;`, `ew`).
  - **Recipe block** (`RecipeEditor.tsx:249`, `:417`): the headers `MALZEME` and `BİR TANESİNE` overlap, and the ingredient name hides behind the usage input.
- **Fix, pick one:**
  - a) At `lg`, put the area menu in a horizontal row under the masthead, as on mobile. Use the left column only from `2xl`, with the sheet widened by 148px.
  - b) Keep the left menu, and below `xl` render Menü, Recipe and Malzemeler in their stacked (mobile) form.
- **Done when:** at 1024, 1280 and 1440px, the longest sample names (`Kahve çekirdeği`, `Köfte ekmek`) are fully visible, and no header overlaps.

### [x] F2. Desktop result tables are clipped or run together

- **Same cause as F1**, on the Sonuç screen at 1280px:
  - **Senaryolar:** the İyi column is clipped (`602.386 T`, `219.217` cut), and row labels wrap to 3 lines.
  - **Kanal ekonomisi** and **Ürün bazlı katkı:** numbers have no gap (`2.550247.500225.000`), so the table can't be read.
  - **Başa baş noktası:** the third tile wraps `170 ürün/gün`.
- **Fix:** F1 fixes most of it. Also give numeric columns a `min-width` and `white-space: nowrap`, and below `xl` use the transposed per-channel blocks that mobile already has.
- **Done when:** every figure reads as a separate value at 1024, 1280 and 1440px.

---

## P1: drift from approved rules

### [x] F3. The mobile menu row hides the selling price

- **Now:** a collapsed row shows only `maliyet 25 TL · elle` (`labels.ts:528`, `menuRowCost`).
- **Approved (design frames A–D):** the selling price is the large right-hand number, with `maliyet {tutar} TL · {kaynak}` under it.
- **Done when:** a collapsed row reads `Amerikano / günde 60 adet` on the left, and `120,00 TL` over `maliyet 25,00 TL · elle` on the right. If daily quantity now lives on Satış, drop the left sub-line and keep the price.

### [x] F4. Text actions don't read as actions on touch, and some are light grey

- **Cause:** `.qc-text-btn` (`src/app/index.css:102`) is `secondary` with the underline only on `:hover`, which doesn't exist on touch. The way into recipes, `İçine ne koyuyorsun?`, looks like a sentence. So do `Menüye dön` and `Bitti` in the recipe layer.
- **Also:** `.qc-text-btn.is-muted` (`index.css:122`, `muted` #8A9199 at 12px, 3.2:1) is used for actions the owner must read:
  - `Kaldır`: `ProductRows.tsx:185`, `LineRows.tsx:92`, `PositionRows.tsx:108`;
  - `Vazgeç` / `Sil` / `Çıkar`: `IngredientList.tsx:109`, `:484`, `:530`, `:555`, `:570`;
  - `RecipeEditor.tsx:192`, `:286`.
  - The O4 rule says `muted` is decoration only.
- **Fix:**
  - Underline text actions by default (`text-decoration-color: rule-strong`; `ink` on hover).
  - Make `Bitti` `ink` 600.
  - Retire `is-muted` for actions and use `secondary` 13px.
- **Done when:** no interactive element uses `muted`, and every text action is underlined without hover.

### [x] F5. "katkı" is still on the results screen

- **Where:** `labels.ts:302` (`Aylık katkı`), `:317`, `:318` (`Ürün bazlı katkı`), `:320`, `:369` (`Katkı` column), `:657`.
- **Rule:** the brief and the roadmap ban marj, katkı and amortisman on screen.
- **Proposed copy (owner to confirm):**
  - `Aylık katkı` → `Ürünlerden kalan (aylık)`
  - `Katkı` column → `Kalan`
  - `Ürün bazlı katkı` → `Üründen kalan`
  - `Kanal ekonomisi` note → `Kalan, o kanalın kendi maliyetlerinden sonra işletmeye kalan tutardır.`
- Code identifiers (`contribution`) stay as they are; only Turkish copy changes.

### F6. No warning when a typed value is obviously wrong

> **Not done — owner decision:** no price/cost warning or note is added.

- **Seen:** choosing `ml` instead of `L` for 1 L of milk at 40 TL made Cold Brew's recipe cost `8.000,00 TL` against a `140 TL` price. The month showed `−7.027.566 TL` and `Toplam maliyet aylık cironun %1.425,7’i`, with no hint anything was wrong. (The test script picked `ml` by mistake, which is exactly the slip a hurried owner could make.)
- **Fix:** a quiet `Not` (no red) where the cost exceeds the price:
  - on the recipe layer footer: `Bir tanesinin maliyeti satış fiyatını geçiyor. Birimi kontrol et.`
  - on the menu row: `maliyet satış fiyatını geçiyor`
  - It compares two typed inputs (`unitProductCost ≥ normalPrice`), so no new formula. It must not block Hesapla.
- **Done when:** the case above shows the note in both places.

### [x] F7. The sample café never shows recipes

- **Now:** the sample (`formState.ts`, `Örnek bir kafeyle doldur`) fills Amerikano, Poğaça and Cold Brew, all with hand-typed costs. Malzemeler stays empty, so "Zam geldi" can't be reached.
- **Fix:** add Hamburger with the spec fixtures (ekmek 1 · kıyma 120 g · domates 30 g · marul 20 g = 55,50 TL) and the shared ingredients from `RECIPE_REDESIGN_SPEC.md` §7.5. Keep at least one product with a hand-typed cost.
- **Done when:** after loading the sample, Malzemeler lists the ingredients with `{n} üründe`, and changing the Kıyma price shows the Zam geldi block.

---

## P2: polish

### [x] F8. A blank start is blocked by Paket servis

- **Seen:** on a fresh Detaylı page the Hesapla reason is `3 alanı kontrol et — Ürünler, Satış tahmini, Paket servis`.
- **Likely cause:** the default channel mix includes delivery (`formState.ts:204`), so a delivery mode is required. A café without delivery has to find screen 3 to clear it.
- **Options (owner decision):**
  - a) default the delivery share to 0 in the form only (the engine default is unchanged);
  - b) add a one-tap `Paket servis yok` on Satış that sets the share to 0.
- **Done (option b):** `Paket servis yok` under Satış kanalları sets the delivery share to 0 and adds it to salon, so the mix stays at 100%. The engine default is unchanged.

### [x] F9. Mobile wayfinding between the five screens

- **Now:** you can only move with `Geri / Sonraki` at the bottom of each screen, plus a `1 / 5` counter. The screen list sits in the Hazırlık block below the form.
- **Fix:** a compact 5-step row under the area tabs (`Menü · Malzemeler · Satış · Giderler · Sonuç`), each step at least 44px, current step in ink 600 with a 2px underline. Or make `1 / 5` open the index.

### [x] F10. Giderler inconsistencies

- **Thousands separators:** values loaded from the sample show none (`28000`, `2500`), while Hızlı shows `85.000`. Format on load, not only while typing.
- **Label case:** Personel labels are uppercase eyebrows (`İŞVEREN MALİYETİ`, `YEMEK`, `YOL`, `PRİM`, `PositionRows.tsx:118`), while every other field label is sentence case. Use `.qc-field-label`.
- **Icon:** the `ⓘ` tooltip on İşveren maliyeti is an icon (design rule: none). Replace it with a one-line hint under the field.
- **Desktop starter rows** (`Elektrik`, `Su`, `Ekipman`): the amount inputs have no accessible label, and the names render at 1.4:1 contrast. Label them with the row name, and use `secondary` for the suggested names.
- **Done:** the unlabelled inputs came from a duplicate DOM id: Quick and Detailed both used `posCommissionRate`, and Quick stays mounted while hidden. Quick ids are now `quick-{field}`. Added starters read `{ad} · eklendi` in `secondary`.

### [x] F11. Sonuç before Hesapla repeats itself

- **Now:** the empty-state paragraph and the Hesapla button appear twice, once in the page and once in the sticky bar (mobile) or the özet pane (desktop).
- **Fix:** keep one paragraph and one button per viewport.

### [x] F12. Simülasyonlar empty-state copy

- **Now:** `Önce Detaylı Hesap’ı doldur.` shows even when the draft is filled (`copy.test.ts:154`).
- **Fix:** say what is actually missing. If a calculation is needed: `Önce Detaylı Hesap’ta Hesapla’ya bas.` with a link to `/detailed/result`.

### [x] F13. The results screen is long and the chart labels are tiny

- **Length:** desktop Sonuç is about 5,000px tall. "Ürün bazlı katkı" repeats the channel table's totals, and the Sankey repeats the bar.
- **Fix:** put both behind an `Ayrıntılar` toggle, collapsed by default. The bar and its table stay primary, as `DESIGN_DIRECTION.md` R2 and R7 require.
- **Chart labels:** the `lg` frame in `chartGeometry.ts` (viewBox 1092 wide) renders into about 570px, so 11-unit labels become about 6px. Author the screen frame at the real column width, or set the label size so it renders at 11px or more.

### [x] F14. Hızlı and Detaylı now read differently (decision, not a bug)

- **Now:** Hızlı still uses *siz* (`…bastığınızda`) and `muted` labels. Detaylı moved to *sen* and the darker grey in O4.
- **Fix:** if the owner wants one voice, run a separate copy-only PR for Quick after reviewing `docs/FRONTEND_IMPLEMENTATION_SPEC.md`. That spec owns Quick's copy.

---

## Suggested order

1. **F1 + F2:** one layout change at the shell; it fixes most of P0.
2. **F3, F4, F5:** copy and CSS only.
3. **F6, F7:** a small guard and sample data.
4. **F8:** after the owner picks an option. **F9–F13:** polish.
5. **F14:** a separate decision.
