# Recipe and Shared Ingredient List — Redesign Spec

**Status:** Design approved by the product owner on 12 November 2026. Owner lock 12 November 2026: screens A1–A5, B1–B4, C1–C3, D1–D2 and open decisions O1–O4 as recommended in §10. O4 (*sen* register, muted-grey rule, no suffix on typed names) now applies to all of Detaylı Fizibilite. Quick stays out of scope. Desktop per-row quiet `Sil` uses the same confirmation as A5. The Zam geldi summary line uses the purchase as typed (`5 kg 450,00 TL'den…`).
**Scope:** Detailed Feasibility, section 01: the menu rows, the shared ingredient list (`Malzemeler`), the recipe editor, and the price-rise preview ("Zam geldi"). The copy rules in §3 apply to every Detailed string, not only section 01. Quick (Hızlı Hesap), the monthly engine and every result *figure* stay as they are.
**Visual reference:** the design-system artifact “maliyet.lol” (frames `KareA`–`KareD`, components `Alan`, `BirimSecici`, `Dugme`, `Not`, `MalzemeSatiri`, `ReceteSatiri`, `MaliyetKaynagi`).
**Brief:** the owner's recipe-redesign brief of 12 November 2026.

Where this spec and an existing document disagree:
- **Formulas:** `DETAILED_FINANCIAL_SPEC.md` wins. This spec uses Appendix A and §9.4 unchanged. It adds one display formula (§7.4), which must be written into the financial spec before coding.
- **Section 01 UI:** this spec replaces the “Malzemeler” paragraphs of `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md` once §11 is done.

---

## 1. Goal

A café owner on a 390px phone, without reading any help text, can:

1. add a recipe to Hamburger;
2. type **1** for bread and understand it means one piece (adet);
3. change the mince price from 380 to 450 TL in **one** box;
4. see that Hamburger is affected;

and doesn't give up because there are too many fields.

## 2. Data model (unchanged)

| Entity | Fields | Notes |
| --- | --- | --- |
| Ingredient (shared) | `name`, `purchaseQuantity`, `purchaseUnit`, `purchasePrice` | Exactly one price per ingredient. Edited only in `Malzemeler`. |
| Recipe line (per product) | `ingredientId`, `usageQuantity` | `usageQuantity` = the amount in **one** unit of that product, in the family's base unit. |
| Product cost source | typed by hand **or** recipe total | Never both. The monthly engine only receives `unitProductCost`. |

Units: purchase `kg · g · L · ml · adet`. Usage base unit: kg/g → `g`, L/ml → `ml`, adet → `adet`. Families never convert into each other.

## 3. Global rules

### 3.1 Visual

The locked rules in `DESIGN_DIRECTION.md` apply:
- Neutral greys plus the single accent `#1D3A5F`. The accent is only for the headline result figure, the focus ring and the primary button (`Hesapla`).
- No red, no cards, no shadows (except the focus ring), no badges or pills, no gradients, no icons.
- IBM Plex Sans for text, IBM Plex Mono with tabular figures for every number.
- 4px radius.
- Mobile: 18px side gutter, every target at least 44px. Desktop: inputs 40px tall, a 1152px sheet split 779 · 1 · 372.
- Nothing scrolls horizontally at any width.

New in this redesign:
- **Muted grey (`muted` #8A9199, 3.2:1) is decoration only.** It is used for section numbers (`01`) and the masthead slogan, nothing else. Anything the owner must read uses `secondary` (#5B6169, 6.3:1): eyebrows, column headers, field labels, unit suffixes, conversion lines, hints and caveats.
- **The recipe total is set in `ink`, never the accent.**

### 3.2 Copy

- **Always *sen*.** Never *siz* (`girin`, `bastığınızda`).
- **Plain shopkeeper Turkish.** Never write: Gramaj, marj, katkı, amortisman, food cost, COGS, SKU, BOM, varyans, net kâr.
- **Never attach a suffix to a name the owner typed** (product or ingredient). Put the name after a colon, or let it stand alone as a subject or heading. Inside a block the name already heads, refer to the product generically.
  - ✅ `Reçeteyi tamamla: Hamburger` · `Kıyma zamlandı` · `Kıyma silinsin mi?` · `Bu fiyat 2 üründe: Hamburger, Köfte ekmek` · `Domates için miktar yaz.` (a separate postposition is fine) · `İçine ne koyuyorsun?` · `Her birinden kalan`
  - ❌ `Hamburger’in reçetesini tamamla` · `Çay’ın` · `kıymanın` · `Bir hamburgerin maliyeti`
- **Money:** `Intl.NumberFormat('tr-TR')`, written in full with the unit after a space, two decimals: `55,50 TL`, `1.027.350 TL`.
- **Unit prices** show as many decimals as they need, at least 2 and at most 3: `gramı 0,38 TL`, `gramı 0,035 TL`, `tanesi 8,00 TL`, `ml’si 0,04 TL`.

### 3.3 Before and after Hesapla

V6 still holds: no monthly figure appears before the first `Hesapla`. Recipe totals, unit prices and the price-rise preview are about inputs, so they may show at any time. The price-rise preview never shows monthly amounts.

## 4. Layout

### 4.1 Mobile (below 1024px)

Section 01 accordion, in this order:
1. Section intro.
2. Group `MENÜ`: collapsed product rows, then `+ Ürün ekle`.
3. Group `MALZEMELER`: a hint line, the ingredient rows, then `+ Malzeme ekle`.

The recipe opens as a **full-screen layer** above the page. It is never shown inside the product row.

The sticky bottom bar (`Hesapla`) is unchanged on the page. The recipe layer has its own footer showing the total instead.

### 4.2 Desktop (1024px and up)

V2 step 5 splits Detaylı into screens. The `MENÜ` table and the recipe block live on **Menü**. The `MALZEMELER` table lives on **Malzemeler**. Recipe “Fiyatı listede değiştir” opens that screen.

On Menü, in the input column, in this order:
1. The `MENÜ` table.
2. The recipe block for the selected product, when open.

The menu table is never split. The recipe block sits under the table, separated by `rule-mid` hairlines above and below and tinted `surface-result`.

| Table | Grid columns |
| --- | --- |
| Menü | `1fr 120px 120px 112px 88px 48px`, column gap 8px: Ürün · Normal fiyat · Online fiyat · Birim maliyet · Reçete · Kaldır. Günlük adet is entered in Satış tahmini (`DETAILED_FINANCIAL_SPEC.md` Appendix C), not on this row. |
| Reçete | `1fr 168px 200px 96px 52px`: Malzeme · Bir tanesine · Nasıl alınıyor · Tutar · Çıkar |
| Malzemeler | `1fr 84px 84px 116px 112px 84px 32px`: Malzeme · Kaç aldın · Birim · Kaça geldi · Birim fiyatı · Kullanıldığı · Sil |

Desktop inputs have 8px side padding so full values like `250,00 TL` fit.

## 5. Screens and states

### A — Shared ingredient list (`Malzemeler`)

| State | Mobile | Desktop |
| --- | --- | --- |
| **A1 Empty** | The group heading stays visible. Body: `Henüz malzeme yok.` + a hint + `+ Malzeme ekle`. | Same, under the menu table. |
| **A2 Filled, closed** | One 60px row per ingredient: the name; `{qty} {unit} · {n} üründe` underneath; the purchase price on the right in Mono, then `▾`. The whole row is the tap target. | Editable table row. Unit price and usage count are read-only text. |
| **A3 Open (editing)** | Tinted block. Fields in thumb order: `Malzeme`, then `Kaç aldın` + `Kaça geldi` side by side, then `Birim` (5-segment picker). Then a note line, `Tamam` **on its own row**, and **at the bottom, below a hairline and right-aligned**, the quiet `Malzemeyi sil`. | The price cell has focus. A note under the table names the products that share the price. |
| **A4 Add from list** | A new row opens with the name focused, the other fields empty and no unit selected, plus the invoice hint. Actions: `Tamam` / `Vazgeç`. | A new empty row at the end of the table. |
| **A5 Delete confirm** | The bottom zone is replaced inline (no modal) by a note: `{Malzeme} silinsin mi? {n} üründe kullanılıyor.` (or `Hiçbir üründe kullanılmıyor.`) with `Sil` (secondary button) and `Vazgeç`. | A quiet `Sil` at the end of each row; the same confirmation opens under the row. |

Unit-family lock (the wrong-unit state): once an ingredient is used in any recipe, units of other families are disabled (`disabled` fill, `subtle` text). One note line underneath says why. Switching within a family (kg ↔ g, L ↔ ml) stays allowed.

### B — Adding a recipe to a product

| State | Mobile | Desktop |
| --- | --- | --- |
| **B1 Start: typed by hand** | Product row expanded: `Ürün`, then `Normal fiyat` / `Online fiyat` / `Birim maliyet` (editable). Daily quantity is not on this row — it lives in Satış tahmini. Under a hairline: `Tutarı sen yazdın.` + the action `İçine ne koyuyorsun?`. The expanded header shows only the name and `▴`. | The `Reçete` column shows `Reçete yaz`. |
| **B2 Recipe layer, first ingredient** | Top bar: `Menüye dön` · `REÇETE` · `Bitti`. Title = the product name. Intro: `İçine ne koyuyorsun? …`. Empty note, then one search field `Malzeme ekle`. Suggestions come from the shared list (`Ekmek` · `listede · 10 adet 80,00 TL` · `Ekle`) plus `«{typed}» adında yeni malzeme` · `Yeni`. Footer total `—`. | `Reçete yaz` is selected (underlined 2px ink). The cost cell locks and shows `—`. The recipe block opens under the table. |
| **B3 New ingredient created** | A name not in the list opens an inline block: `{Malzeme}` · `listede yok, yeni`, with `Nasıl alıyorsun? Bir kez sorulur, sonra listede durur.`, then `Kaç aldın`, `Kaça geldi`, `Birim`, and `Listeye ekle` / `Vazgeç`. On confirm the ingredient joins the shared list and the line shows only its usage field. | The same fields, inline under the new line, with column headers. |
| **B4 Done** | `Bitti` returns to the menu. The product row shows `maliyet 55,50 TL · reçeteden`. Products typed by hand and products with recipes sit side by side. | The cost cell is locked and shows the recipe total. The column shows `Reçeteyi aç`. |

While any product's recipe is incomplete, `Hesapla` is disabled with the reason `Reçeteyi tamamla: {Ürün}`. Several products are comma-separated: `Reçeteyi tamamla: Hamburger, Latte`.

### C — Usage quantity (recipe lines)

| State | Mobile | Desktop |
| --- | --- | --- |
| **C1 Closed** | Product expanded. The `Birim maliyet` box is locked with the recipe total. Under a hairline: `Reçeteden · {n} malzeme` + `Reçeteyi aç`. | Locked cost cell + `Reçeteyi aç`. |
| **C2 Filled** | One line per ingredient. Row 1: the name on the left, the line cost on the right. Row 2: a 148px field labelled `Kaç adet?` / `Kaç gram?` / `Kaç ml?` with the unit inside the box; on the right a two-line read-only note (`1 kg 380,00 TL` / `gramı 0,38 TL`). The focused line tints and shows `Çıkar` and `Fiyatı listede değiştir`. Footer: `Bir tanesinin maliyeti` + the total in Mono 22px ink. Below the lines: `Tutarı kendim yazacağım` + `Reçete silinmez, kenarda durur.` | A table row: name · usage field · `{purchase} · {unit price}` · line cost · `Çıkar`. Footer row: `+ Malzeme ekle` · `Tutarı kendim yazacağım` · `Bir tanesinin maliyeti 55,50 TL`. |
| **C3 Incomplete line** | The empty line's cost is `—`, the footer total is `—`, and a note reads `{Malzeme} için miktar yaz. Bütün satırlar dolunca maliyet çıkar.` No partial sum (Appendix A.4). | Same, with the note under the table. |

`Fiyatı listede değiştir` closes the layer, scrolls to `Malzemeler` and opens that ingredient's row with the price box focused. **A recipe line never has a price, purchase quantity or unit input.**

### D — Price rise ("Zam geldi")

| State | Mobile | Desktop |
| --- | --- | --- |
| **D1 New price typed** | Inside the open ingredient row, under the unit picker, a block with a 1px `ink` top rule. Heading `{Malzeme} zamlandı`; under it `Kilosu 380,00 TL’den 450,00 TL’ye çıktı. Bu fiyat 2 üründe.` Then one sub-block per affected product (§7.4): name + `{usage} {malzeme}`; `Maliyet 55,50 → 63,90 TL`; `Her birinden kalan 8,40 TL azaldı.`; `Eski kalan için salon fiyatı 229,24 TL olmalı. Şimdi 220,00 TL.` Footnote: `Salon fiyatı KDV %10 dahil. Kart ve yemek kartı kesintisi bu hesaba girmedi. Paket servis ve online fiyat sonra.` Then `Tamam`, then the separated delete zone. | A tinted block under the `Malzemeler` table, with columns Ürün · Maliyet · Her birinden kalan · Eski kalan için salon fiyatı. |
| **D2 After `Tamam`** | The block closes. Menu rows show the new costs. Nothing changes a selling price automatically, and no price history is kept. | Locked cost cells show the new costs. |

**Trigger:** the open row's unit price (`purchasePrice / (purchaseQuantity × factor)`) differs from its value when the row was opened, and the ingredient is used in at least one recipe. The comparison is against the value at open; nothing is stored afterwards.

The KDV percentage in the footnote reads from `vatRate`; it is not fixed at %10.

## 6. Interaction rules

1. **One price, one place.** Purchase quantity, unit and price can be edited only in `Malzemeler`. Remove the purchase inputs from recipe lines. This retires the PR #14 two-editor behaviour.
2. **One field per recipe line:** usage only.
3. **Ingredients come from the recipe first.** Typing a name searches the shared list. Matching ignores case, uses Turkish case rules (`i/İ`, `ı/I`) and trims spaces. An existing name links to that ingredient and never creates a second one. A new name asks once how it's bought (B3), then joins the list.
4. **Adding from the list** (`+ Malzeme ekle`) supports owners entering prices from an invoice. If the typed name already exists, the existing row opens instead.
5. **Renaming** happens only in the list and updates every recipe. Recipe lines show the name read-only, which removes today's split-on-rename behaviour.
6. **Unit picker:** cross-family units lock once the ingredient is used in a recipe. Switching within a family does not convert the typed quantity; the unit-price line updates live so the owner sees the effect.
7. **Cost source:** `İçine ne koyuyorsun?` (mobile) or `Reçete yaz` (desktop) turns the product to its recipe and locks `Birim maliyet`. `Tutarı kendim yazacağım` unlocks it and keeps the recipe aside, not deleted (Appendix A preamble).
8. **Deleting** an ingredient asks once, inline (A5). `Malzemeyi sil` is never on the same row as `Tamam`. `Çıkar` removes a recipe line immediately, without asking.
9. **Recipes are optional.** Any mix of products typed by hand and products with recipes is valid.
10. **No red.** Incomplete recipes and the unit-family lock are quiet notes (`Not`). The `error` token stays only on the engine's validation codes for a field (for example `not_a_number`).
11. **Accessibility:**
    - Every interactive target is at least 44px on mobile.
    - The focus ring is an `accent` border plus `0 0 0 3px rgb(29 58 95 / 0.13)`.
    - The recipe layer is a dialog: it traps focus, and `Menüye dön` and Esc close it.
    - The unit picker is a radiogroup; disabled options set `aria-disabled` and point to the note through `aria-describedby`.

## 7. Formulas

None of these run inside React components. Financial figures come from `core/detailed` helpers.

### 7.1 Recipe (Appendix A, unchanged)

```
factor(kg) = factor(L) = 1000 ; factor(g) = factor(ml) = factor(adet) = 1
unitPrice(i)  = purchasePrice / (purchaseQuantity × factor(purchaseUnit))
lineCost(l)   = unitPrice(l.ingredient) × usageQuantity
recipeCost(p) = Σ lineCost(l)          // no total at all if any line fails (A.4)
```

### 7.2 Display unit price

Label: `tanesi` (adet), `gramı` (g), `ml’si` (ml). The value is `unitPrice(i)`, formatted per §3.2. This is presentation only.

### 7.3 Change in what's left per unit (spec §9.4, unchanged)

```
unitContribution(p, c) = netPerUnit − unitProductCost − unitChannelVariableCost − unitPaymentPlatformFee
⇒ Δ remaining per unit = −Δ unitProductCost   (every channel)
```

### 7.4 Salon price that restores the old amount — **new display formula, owner-approved**

```
Δcost(p)          = recipeCost_new(p) − recipeCost_old(p)
salonRestorePrice = normalPrice(p) + Δcost(p) × (1 + vatRate)
```

Scope: salon only, KDV included, card and meal-card commissions ignored. Per-channel prices (takeaway, delivery/online, commission-aware) wait for roadmap step 6 (automatic price suggestion). The result is shown unrounded.

Suggested helper: `salonRestorePrice(normalPrice, deltaCost, vatRate)` in `core/detailed/recipeCost.ts` or a sibling, with tests. Don't use the rejected terms (`netProfit`, `margin`, …) in identifiers.

### 7.5 Worked figures (fixtures)

| Ingredient | Purchase | Unit price |
| --- | --- | --- |
| Ekmek | 10 adet, 80,00 TL | tanesi 8,00 TL |
| Kıyma | 1 kg, 380,00 TL (→ 450,00) | gramı 0,38 (→ 0,45) TL |
| Domates | 1 kg, 40,00 TL | gramı 0,04 TL |
| Marul | 1 kg, 35,00 TL | gramı 0,035 TL |
| Süt | 1 L, 40,00 TL | ml’si 0,04 TL |
| Kahve çekirdeği | 1 kg, 900,00 TL | gramı 0,90 TL |

| Product | Lines | Cost | After mince 450 | Δ remaining | Salon now → restore |
| --- | --- | --- | --- | --- | --- |
| Hamburger | ekmek 1 · kıyma 120 g · domates 30 g · marul 20 g | 8,00 + 45,60 + 1,20 + 0,70 = **55,50** | **63,90** | −8,40 | 220,00 → **229,24** |
| Köfte ekmek | ekmek 1 · kıyma 100 g · domates 20 g | 8,00 + 38,00 + 0,80 = **46,80** | **53,80** | −7,00 | 160,00 → **167,70** |
| Latte | süt 200 ml · kahve 18 g | 8,00 + 16,20 = **24,20** | — | — | — |
| Amerikano | typed by hand | 25,00 | — | — | — |
| Poğaça | typed by hand | 12,00 | — | — | — |

`vatRate = 0.10` (default).

## 8. Copy strings

Proposed keys extend or replace `RECIPE_COPY` in `features/detailed/labels.ts`. `{x}` marks an interpolation; interpolated names are never suffixed.

| Key (proposed) | Turkish | Where |
| --- | --- | --- |
| `sectionNote.products` | Sattığın ürünleri ve her birinden günde ortalama kaç adet sattığını gir. Fiyatlar KDV dahil. | Section 01 intro (replaces the *siz* version) |
| `menuHeading` | Menü | Group eyebrow |
| `productCount` | {n} ürün | Group / accordion right |
| `menuRowDaily` | günde {n} adet | Collapsed product row |
| `menuRowCost` | maliyet {tutar} TL · {kaynak} | Collapsed product row, second line on the right |
| `sourceManual` / `sourceRecipe` | elle / reçeteden | `{kaynak}` |
| `addProduct` | + Ürün ekle | |
| `costTypedNote` | Tutarı sen yazdın. | Under the cost box (typed by hand) |
| `openRecipeNew` | İçine ne koyuyorsun? | Entry to a recipe (mobile) |
| `openRecipeNewDesktop` | Reçete yaz | Menu table, Reçete column |
| `costFromRecipeNote` | Reçeteden · {n} malzeme | Under the locked cost box |
| `openRecipe` | Reçeteyi aç | |
| `listHeading` | Malzemeler | Group eyebrow |
| `ingredientCount` | {n} malzeme | |
| `listHint` | Alış fiyatını yalnızca burada yazarsın. Değiştirince bu malzemeyi kullanan bütün ürünler değişir. | Under the list heading |
| `listEmpty` | Henüz malzeme yok. | A1 |
| `listEmptyHint` | Bir ürüne «İçine ne koyuyorsun?» ile reçete yazınca, yazdığın malzemeler buraya düşer. Faturan elindeyse fiyatları şimdiden de girebilirsin. | A1 mobile |
| `listEmptyHintDesktop` | Bir ürüne «Reçete yaz» ile malzeme eklediğinde buraya düşer. Faturan elindeyse fiyatları şimdiden de girebilirsin. | A1 desktop |
| `addIngredient` | + Malzeme ekle | |
| `usedIn` | {n} üründe | Closed row |
| `usedInNone` | henüz üründe değil | Closed row, unused |
| `ingredientName` | Malzeme | Field label |
| `purchaseQuantity` | Kaç aldın | Field label (replaces `Alış miktarı`) |
| `purchasePrice` | Kaça geldi | Field label (replaces `Alış tutarı`) |
| `purchaseUnit` | Birim | |
| `unitPriceLine` | {Gramı/Tanesi/Ml’si} {değer} TL. Bu fiyat {n} üründe: {Ürün, Ürün}. | Open row note |
| `invoiceHint` | Faturada yazdığı gibi gir: «2 kg, 640 TL» gibi. Henüz hiçbir üründe değil. | A4 |
| `unitFamilyLock` | {Malzeme} reçetelerde {gramla/mililitreyle/adetle} yazılı. {Diğer aileler} geçemez. | Under the unit picker. Fixture: `Kıyma reçetelerde gramla yazılı. Adet ya da litreye geçemez.` |
| `done` | Tamam | |
| `cancel` | Vazgeç | |
| `deleteIngredient` | Malzemeyi sil | Bottom of the open row (mobile) |
| `deleteShort` | Sil | Desktop row; confirm button |
| `deleteConfirm` | {Malzeme} silinsin mi? {n} üründe kullanılıyor. | A5 |
| `deleteConfirmUnused` | {Malzeme} silinsin mi? Hiçbir üründe kullanılmıyor. | A5 |
| `recipeEyebrow` | Reçete | Layer top bar / desktop block |
| `backToMenu` | Menüye dön | Layer top bar |
| `finish` | Bitti | Layer top bar |
| `closeBlock` | Kapat | Desktop recipe block |
| `recipeIntro` | İçine ne koyuyorsun? Her malzemeye, bir tanesine giden miktarı yaz. | Under the layer/block title |
| `recipeEmpty` | Henüz malzeme yok. Adını yaz; listede varsa fiyatıyla gelir, yoksa bir kez nasıl aldığını sorarız. | B2 |
| `searchLabel` | Malzeme ekle | Search field |
| `suggestExisting` | listede · {qty} {unit} {fiyat} TL | Suggestion line 2 |
| `suggestAdd` | Ekle | |
| `suggestNew` | «{yazılan}» adında yeni malzeme | |
| `suggestNewAction` | Yeni | |
| `newIngredientTag` | listede yok, yeni | B3 |
| `newIngredientAsk` | Nasıl alıyorsun? Bir kez sorulur, sonra listede durur. | B3 mobile |
| `newIngredientAskDesktop` | Listede yok. Nasıl alıyorsun? Bir kez sorulur, listeye düşer. | B3 desktop |
| `addToList` | Listeye ekle | B3 |
| `usageLabel.adet` / `.g` / `.ml` | Kaç adet? / Kaç gram? / Kaç ml? | Recipe line (replaces `Gramaj`) |
| `usageColumn` | Bir tanesine | Desktop recipe column |
| `purchaseColumn` | Nasıl alınıyor | Desktop recipe column |
| `lineCostColumn` | Tutar | |
| `removeLine` | Çıkar | |
| `editPriceInList` | Fiyatı listede değiştir | Focused recipe line |
| `recipeTotal` | Bir tanesinin maliyeti | Layer footer / block footer |
| `backToManual` | Tutarı kendim yazacağım | |
| `backToManualNote` | Reçete silinmez, kenarda durur. | |
| `usageEmpty` | {Malzeme} için miktar yaz. Bütün satırlar dolunca maliyet çıkar. | C3 (replaces `Gramajı girin.`) |
| `hesaplaRecipeIncomplete` | Reçeteyi tamamla: {Ürün, Ürün} | Hesapla disabled reason (replaces `Reçeteyi tamamla.`) |
| `priceRiseHeading` | {Malzeme} zamlandı | D |
| `priceDropHeading` | {Malzeme} ucuzladı | D (price decrease, see §10) |
| `priceRiseSummary` | {Alış} {eski} TL’den {yeni} TL’ye çıktı. Bu fiyat {n} üründe. | D. `{Alış}` is the purchase as entered. When `purchaseQuantity = 1` it reads Kilosu / Gramı / Litresi / Ml’si / Tanesi (fixture: `Kilosu 380,00 TL’den 450,00 TL’ye çıktı.`); otherwise `{qty} {unit}` (`5 kg 450,00 TL’den 520,00 TL’ye çıktı.`) |
| `priceRiseUsage` | {usage} {malzeme} | Per product, right side, e.g. `120 g kıyma` |
| `priceRiseCost` | Maliyet {eski} → {yeni} TL | |
| `priceRiseRemaining` | Her birinden kalan {tutar} TL azaldı. | |
| `priceRiseRestore` | Eski kalan için salon fiyatı {tutar} TL olmalı. Şimdi {fiyat} TL. | |
| `priceRiseFoot` | Salon fiyatı KDV %{oran} dahil. Kart ve yemek kartı kesintisi bu hesaba girmedi. Paket servis ve online fiyat sonra. | |
| `priceRiseColumns` | Ürün · Maliyet · Her birinden kalan · Eski kalan için salon fiyatı | Desktop D table |
| `emptyResult` | Hesapla’dan önce hiçbir sayı gösterilmez. En az bir ürün girip Hesapla’ya bastığında aylık işletme sonucu, başa baş noktası ve yatırımın geri dönüşü burada görünür. | Özet pane (*sen*) |
| `optionalSectionsNote` | Boş bıraktığın bölümler 0 TL sayılır. Yalnızca ürünler zorunlu. | Özet pane (*sen*) |

Appendix A.4 error codes, shown as quiet notes:

| Code | Copy |
| --- | --- |
| `empty_recipe` | Reçeteye en az bir malzeme ekle. |
| `ingredient_not_found` | Malzemeyi listeden seç ya da yeni ekle. |
| `invalid_unit` | Not reachable; the picker only offers valid units. |
| `not_a_number` | Lütfen bir sayı gir. |
| `purchase_quantity_empty` | Kaç aldığını yaz. |
| `purchase_quantity_zero` | Alış miktarı 0 olamaz. |
| `purchase_price_empty` | Kaça geldiğini yaz. |
| `usage_quantity_empty` | {Malzeme} için miktar yaz. |
| duplicate name | Not shown as an error: the existing ingredient is linked or opened instead. |

## 9. Components

Guidelines are in the design system. In code these map to presentational components under `features/detailed/`.

| Component | Purpose |
| --- | --- |
| `Alan` | Label + input with the unit inside the box. States: default, focus, locked, empty. |
| `BirimSecici` | 5-segment unit picker, with family lock (mobile). On desktop: a select. |
| `Dugme` | `Hesapla` (accent fill), outlined secondary button, underlined text action (quiet variant). |
| `Not` | Hairline + 13px secondary text; replaces red. |
| `MalzemeSatiri` | Ingredient row: closed, open, delete confirm. |
| `ReceteSatiri` | Recipe line: filled, focused, empty. |
| `MaliyetKaynagi` | Product cost source: typed by hand vs from the recipe. |

## 10. Open decisions

Owner lock 12 November 2026: O1–O4 as recommended. O4 is applied across Detaylı Fizibilite.

| # | Question | Decision |
| --- | --- | --- |
| O1 | Deleting an ingredient that is in use: what happens to its recipe lines? | **Approved.** Remove those lines, recalculate the totals, and name the products in the confirmation. The alternative, keeping them as `ingredient_not_found`, would block Hesapla. |
| O2 | `Tutarı kendim yazacağım`: what goes in the unlocked box? | **Approved.** The last value typed by hand if there is one, otherwise the recipe total. |
| O3 | A price decrease: show a block? | **Approved.** `{Malzeme} ucuzladı` with cost and `Her birinden kalan {x} TL arttı.`, without the restore-price line. |
| O4 | Should the *sen* register and the muted-grey rule apply to the rest of Detailed? Quick is out of scope. | **Approved and applied** across Detaylı Fizibilite (*sen*, muted only on section numbers and the masthead slogan, no suffix on typed names). Quick remains out of scope. |
| O5 | Online/takeaway restore prices and commission-aware prices | Roadmap step 6. Not in this build. |
| O6 | Rounding the restore price (e.g. 229,24 → 230) | No rounding. Rounding is a price suggestion, which belongs to step 6. |

## 11. Doc and code changes required before coding

1. `DETAILED_FINANCIAL_SPEC.md`:
   - Appendix A.5: delete the sentence “Purchase quantity, unit and price remain editable on each recipe line as well as on that block”.
   - Add §7.4 (`salonRestorePrice`) as a display helper outside `calculateDetailed`, with a test (the Hamburger and Köfte ekmek fixtures in §7.5).
   - Changelog entry.
2. `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md`: replace the Malzemeler paragraphs (currently lines 57–59) with a pointer to this spec: list below the menu, a single price editor, the recipe layer or block, and usage labels by unit.
3. `features/detailed/labels.ts`: update `RECIPE_COPY` and the related section-01 strings per §8. Interpolated names are never suffixed.
4. `docs/README.md`: list this document as active.
5. Tests:
   - T18 (recipe helper) is unchanged.
   - Add a restore-price helper test.
   - Add UI tests: the single price editor, no purchase inputs on recipe lines, usage label per unit, the unit-family lock, and the delete confirmation.
   - The golden vectors (§18.2) must not change.
