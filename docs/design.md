# Design source of truth

**Product name:** Maliyet · **domain:** maliyet.lol · **slogan:** *Rakamlar tutuyor mu?*
Brand copy has one home: `src/app/shellCopy.ts`.

Visual and UX authority for the Quick Calculation product UI. Financial formulas stay in `docs/quick-calculation-scope-v1.md` and the TypeScript engine.

## Files

| File | Role |
| --- | --- |
| [DESIGN_DIRECTION.md](./DESIGN_DIRECTION.md) | Visual language, type, colour, layout, motion, Turkish copy. From Claude Design. |
| [FRONTEND_IMPLEMENTATION_SPEC.md](./FRONTEND_IMPLEMENTATION_SPEC.md) | Screen structure, recompute (V6), field map, stacked bar, four outputs, simulation table, copy, clipboard. From Claude Design. |
| This file | Index plus frame notes from the Claude Design HTML preview. |

The Design HTML preview (`Quick Calculation Reference.dc.html`) is a **layout mock**. Numbers in that mock (for example 120 daily sales, 107,56 TL cost per sale) are **illustrative**. Production must use engine outputs from `calculateQuick` / `simulateQuick`.

## Frames in the preview

### 1a — Desktop, after calculation (`1152px`)

Two-column page: left input form (`392px`, grouped **Satış** / **Aylık giderler** / **Başlangıç yatırımı**), `1px` `#E3E5E8` rule, right results on `#FCFCFD`.

Form: two-column field grid, full-width product cost and capex, assumptions strip (`30 gün · 60 ay · %90 · %3,56`), primary **Hesapla**.

Results, top to bottom: Turkish one-sentence summary (ticket, cost share, remaining in navy); **Özeti Kopyala**; hairline; headline cost per sale (`44px` IBM Plex Mono, `#1D3A5F`); ticket on the right; stacked bar (`44px` tall, `#D6D9DD` outline); reconciling table (swatch, label, amount, share); four metric cells; tax disclaimer; **Satış hacmi simülasyonu** (five rows, current row bold).

### 1b — Mobile (`390px`), after calculation

Same story, one column. Results first in the mock’s second board (product may still put the form above on first visit). Bar has no in-bar labels. Simulation table drops the scenario name column and keeps daily volume, unit cost, monthly earnings. Primary tap targets stay large.

### 1c — Before calculate, focus, and error

Empty volume field with placeholder `0`. Focus: `#1D3A5F` border + `0 0 0 3px rgba(29,58,95,0.13)`. Over-limit field: `#A0503C` border and helper. **Hesapla** disabled (`#F1F2F4` fill, `#A8AEB6` text) with “Sonucu görmek için tüm alanları doldurun”. No partial numbers in the result column.

## Tokens used in the mock (must match direction)

Page `#EDEEF0`, surface `#FFFFFF`, result pane `#FCFCFD`, ink `#16181C`, secondary `#5B6169`, muted `#8A9199`, rules `#E3E5E8` / `#D6D9DD` / `#C3C8CE`, accent `#1D3A5F`, error `#A0503C`. IBM Plex Sans + IBM Plex Mono. No cards, no drop shadows on the page.
