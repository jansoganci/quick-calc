# Archived documentation

These files are **finished execution notes**. They are kept so the implementation history remains readable.

They are **not** active sources of truth. Do not treat them as current product, financial, or design authority.

Current sources of truth: [`../README.md`](../README.md).

| File | Original role | Why archived |
| --- | --- | --- |
| [`QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md`](./QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md) | How to build the Quick / Lite TypeScript engine | The core is implemented. Formulas now live in `docs/quick-calculation-scope-v1.md` and `src/core/quick/` |
| [`FRONTEND_IMPLEMENTATION_PLAN.md`](./FRONTEND_IMPLEMENTATION_PLAN.md) | How to build the Quick / Lite UI on top of that engine | The Lite UI is implemented. Visual rules live in `DESIGN_DIRECTION.md`, `FRONTEND_IMPLEMENTATION_SPEC.md`, and `design.md` |
| [`DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md`](./DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md) | What Detailed draft autosave does, and the original report objective | Draft persistence is implemented. Persistence *rules* stay in `TECH_STACK_AND_CONSTRAINTS.md` §4. The report's built behaviour is in the plan below |
| [`DETAILED_REPORT_IMPLEMENTATION_PLAN.md`](./DETAILED_REPORT_IMPLEMENTATION_PLAN.md) | How to build the downloadable Detailed Feasibility PDF report | The report is implemented. Screen UI stays in `DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md`; formulas stay in `DETAILED_FINANCIAL_SPEC.md` |

If an archived plan and an active spec disagree, the active spec wins.
