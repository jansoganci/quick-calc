# Documentation

Active sources of truth live in this folder.

Finished execution plans live in [`archive/`](./archive/). They are kept for history. They are not current product or financial authority.

If two documents appear to disagree, use the authority order in [`CLAUDE.md`](../CLAUDE.md).

---

## Active sources of truth

| Document | Owns |
| --- | --- |
| [`quick-calculation-scope-v1.md`](./quick-calculation-scope-v1.md) | Quick / Lite product & financial scope — inputs, formulas, outputs, terminology |
| [`DETAILED_FEASIBILITY_DECISIONS.md`](./DETAILED_FEASIBILITY_DECISIONS.md) | Detailed Feasibility locked decisions and v1 exclusions. Not yet a full financial specification |
| [`DETAILED_FINANCIAL_SPEC.md`](./DETAILED_FINANCIAL_SPEC.md) | Detailed Feasibility formula contract — inputs, defaults, formulas, outputs, edge states, golden vector |
| [`DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md`](./DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md) | Detailed Feasibility UI — information architecture, layout, results hierarchy, charts, states, mode switch |
| [`TECH_STACK_AND_CONSTRAINTS.md`](./TECH_STACK_AND_CONSTRAINTS.md) | Stack, runtime, deployment, persistence, technical exclusions |
| [`APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`](./APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md) | Folder structure, layer boundaries, dependency direction, reuse rules, naming |
| [`DESIGN_DIRECTION.md`](./DESIGN_DIRECTION.md) | Locked visual & UX direction for Quick / Lite (inherited by Detailed) |
| [`FRONTEND_IMPLEMENTATION_SPEC.md`](./FRONTEND_IMPLEMENTATION_SPEC.md) | Quick / Lite UI measurements, tokens, field map, copy |
| [`design.md`](./design.md) | Design index plus layout-frame notes from the HTML preview |

[`CLAUDE.md`](../CLAUDE.md) is operating guidance for coding models. It is not a specification.

---

## Archive

| Document | Why it is archived |
| --- | --- |
| [`archive/QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md`](./archive/QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md) | Quick core execution plan — the engine is implemented |
| [`archive/FRONTEND_IMPLEMENTATION_PLAN.md`](./archive/FRONTEND_IMPLEMENTATION_PLAN.md) | Quick frontend execution plan — the Lite UI is implemented |
| [`archive/DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md`](./archive/DRAFT_PERSISTENCE_AND_REPORT_OUTPUT.md) | Detailed draft autosave record — Part A is implemented; persistence rules stay in `TECH_STACK_AND_CONSTRAINTS.md` §4 |
| [`archive/DETAILED_REPORT_IMPLEMENTATION_PLAN.md`](./archive/DETAILED_REPORT_IMPLEMENTATION_PLAN.md) | Detailed downloadable-report execution plan — the report is implemented |

See [`archive/README.md`](./archive/README.md).
