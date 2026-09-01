# Quick Calculation — Visual & UX Direction

**Status:** Approved by the product owner (design decisions only — no implementation authorised by this document).
**Companion documents:** `quick-calculation-scope-v1.md` (owns outputs, formulas, terminology), `APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` (owns structure), `TECH_STACK_AND_CONSTRAINTS.md` (owns stack).

This document records the visual and interaction decisions the planning documents deliberately left open. It does not restate anything already locked elsewhere, and it does not define components, classes or CSS.

---

## 1. Approved decisions

| # | Decision | Resolution |
| --- | --- | --- |
| V1 | Visual direction | **Quiet analytical instrument.** Near-monochrome, hairline rules, figures carry the page. No dashboard chrome. |
| V2 | Colour | **Neutral greys + one restrained ink accent.** The accent appears on the headline figure and focus states only. |
| V3 | Negative values | **No colour.** A loss reads as a minus sign in tabular figures. No red, no alert styling, no warning blocks. |
| V4 | Typography | **IBM Plex Sans** for text, **IBM Plex Mono** for every figure. Full Turkish diacritic coverage; tabular figures throughout. |
| V5 | Desktop layout | **Two columns** — inputs left, results sticky right, both visible while typing. Content width ~1100–1200px. |
| V6 | Recompute | **LOCKED — Calculate once, then live.** The first calculation happens only after the user completes the required inputs and presses **Hesapla**. After that first successful calculation, subsequent valid input changes update the results live. Before the first calculation no result appears automatically, in any form — no partial figures, no placeholder numbers, no skeleton of the result column. |
| V7 | Cost breakdown | **One horizontal stacked bar plus a reconciling table** beneath it, in the locked §9.2 order, visibly summing to the average sale. |
| V8 | Volume simulation | **Plain 5×3 table.** Current row marked by weight and a hairline. No colour, no chart. |
| V9 | Surfaces | **No cards.** Sections separated by hairline rules and whitespace. |
| V10 | Density | **Comfortable.** |
| V11 | Language | **LOCKED — Turkish only.** No EN/TR switcher, no i18n library, no bilingual label system, no language control anywhere in the UI. All labels, figures, validation messages and caveats are authored directly in Turkish. English copy or translation infrastructure is to be introduced only if a future product decision explicitly requires it. |
| V12 | Mobile | **LOCKED — fully mobile-friendly, designed intentionally.** Desktop and mobile are two responsive states of the same product, not a layout and its compression. See §1.1. |

### 1.1 Mobile requirement (LOCKED)

The application must be fully mobile-friendly. Mobile is planned as a first-class state, not a narrowed desktop view. The mobile design must explicitly resolve each of the following, and each is to be decided as a mobile question rather than inherited from the desktop layout:

- **Input ordering** — the sequence a thumb encounters, which may differ from the desktop column order.
- **Section stacking** — the vertical order of inputs, result, breakdown and simulation.
- **Sticky behaviour** — how the desktop sticky results column is removed or re-expressed (the result must remain reachable without a long scroll after `Hesapla`).
- **Cost-breakdown readability** — the stacked bar and its reconciling table must stay legible and still visibly sum at narrow width.
- **Simulation table behaviour** — how a 5×3 table with the current row marked survives a narrow viewport.
- **Horizontal overflow** — none. No layout may scroll sideways; figures must not force it.
- **Touch target sizing** — no interactive target below 44px.
- **Spacing density** — mobile density is set independently of the desktop "comfortable" setting.
- **Typography scaling** — figure and label sizes are re-set for mobile; the desktop scale is not simply reduced.
- **Secondary assumptions interaction** — how the collapsed assumptions panel opens and is edited by touch.

## 1.2 Result experience (LOCKED / APPROVED)

**Product principle.** Quick Calculation is the **Lite** experience. Users want a fast answer and may have little or no financial knowledge. The result experience must therefore be understandable within a few seconds, must not require financial literacy, must not require unnecessary interaction, must introduce no new concepts, and must not add toggles or modes unless they clearly improve understanding. Clarity outranks visual novelty. The "wow" comes from making the economics immediately understandable — never from decorative charts or complex interaction.

### R1 — One-sentence answer first **[LOCKED]**

The result opens with a short plain-language Turkish summary, placed above every figure and visual.

Structure only, not final copy:

> "140 TL'lik ortalama satışın yaklaşık 75 TL'si maliyet, 65 TL'si işletmede kalıyor."

Purpose: give the user the answer before they have to interpret any table or visual; keep the result understandable even if the rest of the screen is ignored; produce a result that is easy to share. Keep it short. No finance-heavy terminology. Final copy is reviewed separately (§5).

### R2 — Primary visual: Average Sale Breakdown Bar **[LOCKED]**

One horizontal stacked bar representing the user's actual average sale amount (e.g. 140 TL), divided into the locked §9.2 categories in their locked order:

1. VAT
2. Product / Variable Cost
3. Payroll
4. Rent
5. Other OPEX
6. POS
7. Investment Recovery
8. Remaining Profit

The full bar must reconcile exactly to the average sale amount. This is **the main visual of Quick Calculation**, and its single purpose is to show where the customer's money goes. It must be readable without financial knowledge. The exact-amount breakdown table stays directly beneath the bar. No chart library — daisyUI + Tailwind with ordinary HTML and CSS only.

### R3 — Subtle first-result transition **[LOCKED]**

On the first valid calculation (`Hesapla`), the result area is revealed with one short restrained transition of roughly 200–250 ms. No staggered cards, no dramatic entrance, no bounce, scale, glow or dashboard-style animation. Its only job is to make the result feel produced in response to the user's action. On mobile the transition must leave the user actually looking at the result (§1.1, sticky behaviour).

### R4 — Subtle number transitions after first calculation **[LOCKED]**

After the first successful calculation, valid input changes update the result live (V6). Updated figures may transition briefly to their new values. Ambient polish only: short duration, no rolling-counter spectacle, no layout shift, figures remain legible throughout, IBM Plex Mono tabular figures stay dimensionally stable, and the transition is never a focal point.

### R6 — "Özeti Kopyala" affordance **[LOCKED]**

A single quiet text-level control next to the R1 summary sentence copies a short plain-text summary of the result to the clipboard. Restrained by default — no icon-heavy button, no toast stack; a brief inline confirmation (`Kopyalandı`) is enough.

**URL sharing is out of scope for v1**: no share links, no encoded state in the address bar, no social share targets, no server round-trip. Clipboard copy only.

### R5 — Simulation row previews the breakdown bar **[OPTIONAL / LATER]**

The five-row volume simulation remains a plain table (V8). A possible later enhancement: hovering a row on desktop or tapping it on mobile temporarily re-renders the main breakdown bar for that sales-volume case, returning to the current scenario afterwards. It is worth doing because it shows how fixed costs dilute as volume changes.

Constraints on it: **not required for the first frontend implementation**; must not block or complicate the Lite flow; must add no financial inputs; must not become a scenario engine; to be built only once the primary result experience works well. **Nice-to-have, not a v1 requirement.**

### 1.2.1 Final result hierarchy **[LOCKED]**

1. Plain-language summary sentence (R1)
2. Average Sale Breakdown Bar (R2)
3. Exact cost breakdown table
4. Approved simple financial outputs — Monthly Operating Earnings, Gross Profit Margin, Operating Profit Margin, Estimated Investment Payback
5. Simple five-level volume simulation table

The whole experience stays fast to scan. It is not a financial dashboard.

### 1.2.2 Out of scope for Quick v1 **[REJECTED]**

| Rejected | Reason |
| --- | --- |
| "100 TL üzerinden" normalisation toggle | Introduces an unnecessary second framing; may confuse Lite users. |
| Per-sale / per-month view toggle | The monthly figures are already presented separately; the user must not switch the whole result context. |
| Additional charts — line, area, waterfall, Sankey, gauges, speedometers, extra profit/expense charts | The stacked breakdown bar already carries the visual explanation. |
| Complex simulation interaction — configurable scenarios, sliders, multi-variable controls, extra scenario inputs | The five-level table stays simple. |
| URL / link sharing, encoded state in the address bar, social share targets | v1 shares via clipboard only (R6). |

All locked visual rules in §1, §1.1 and §3 continue to apply to the result experience without exception.

## 2. Decisions delegated to the designer

Low-impact, to be resolved consistently with §1 rather than asked:

- border radius, input and button sizing, focus-ring treatment, hover states;
- icon usage — only where a control genuinely needs one;
- motion — near-zero, within the bounds set by R3 and R4;
- empty state before `Hesapla` is pressed, and the state of the `Hesapla` control while inputs are incomplete;
- secondary-assumptions panel: collapsed by default, user-edited values flagged against `QUICK_DEFAULTS`.

## 3. Explicitly excluded visual language

Not to be introduced without a new decision: vertical accent bars or coloured strips on cards; red or alarm treatments for ordinary negative values; badges and pills; gradients, glows, neon or glassmorphism; oversized rounded cards; shadows used decoratively; per-KPI accent colours; decorative charts; generic SaaS dashboard layouts.

## 4. Theme scope

**Light only in v1.** Colour values are to be defined so a daisyUI dark theme can be added later without restructuring; building the dark theme is not in scope now.

## 5. Copy still to be written

Not visual decisions, but required before the screen is complete, and each needs review rather than silent authoring:

1. Final Turkish labels for the seven outputs and the twelve inputs.
2. Field-level validation messages for the four engine error codes (`required`, `not_a_number`, `below_min`, `above_max`), including the breached limit.
3. The mandatory earnings limitation statement (§10.1) and the simulation caveat (§12.4).
4. The payback-unavailable message and the exceeds-recovery-period note (§11.2).
