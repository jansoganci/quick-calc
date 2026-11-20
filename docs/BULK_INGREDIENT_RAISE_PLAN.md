# DF-89 bulk ingredient raise plan

Branch: `codex/ingredient-bulk-raise` · one PR into `main`.

- [x] Record DF-89, Appendix D.6, and the panel copy correction in the Detailed specs.
- [x] Add the pure purchase-price helper, export, and tests in `src/core/detailed/`.
- [x] Reuse one per-product restore/suggestion builder for individual and combined previews in `recipePreview.ts`.
- [x] Add the ingredient panel and one-write undo through `bulkIngredientView.ts`, `IngredientList.tsx`, and `useDetailedCalc.ts`; fix `bulkPriceView.ts` and the Menü segment.
- [x] Run focused tests, then the full test, lint, and build commands once.
- [ ] Check the app at 360px and 1280px with Playwright. Playwright was unavailable in the local and test runtimes; visual, console, and overflow checks remain unverified.

PR: pending.
