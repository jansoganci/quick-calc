# CLAUDE.md — Operating Guide for Coding Models

This file is **operational guidance** for any AI coding model working in this repository. It is not a specification. The specifications live in `docs/`. The index of active vs archived documents is `docs/README.md`.

Read this file first, then read the source-of-truth documents relevant to your task.

---

## 1. Read the source-of-truth documents first

Before making any architectural, financial or implementation change, read the relevant document(s) under `docs/`.

| Document | Owns |
| --- | --- |
| `docs/quick-calculation-scope-v1.md` | Quick / Lite product & financial scope — inputs, formulas, outputs, terminology |
| `docs/DETAILED_FEASIBILITY_DECISIONS.md` | Detailed Feasibility locked decisions and v1 exclusions — not yet a full financial specification |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` | Stack, runtime, deployment, persistence, technical exclusions |
| `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` | Folder structure, layer boundaries, dependency direction, reuse rules, naming |
| `docs/DESIGN_DIRECTION.md` | Locked visual & UX direction |
| `docs/FRONTEND_IMPLEMENTATION_SPEC.md` | Quick / Lite UI measurements, tokens, copy |
| `docs/design.md` | Design index and layout-frame notes |

Finished Quick execution plans live in `docs/archive/`. They are historical. Do not treat them as current authority.

### Authority order

If two documents appear to disagree:

- **financial behaviour (Quick / Lite)** → the Quick product/financial spec wins;
- **Detailed product decisions recorded so far** → the Detailed Feasibility decisions document wins, without inventing formulas it does not contain;
- **stack, runtime, persistence** → the tech-stack document wins;
- **code organisation and boundaries** → the architecture document wins;
- **visual / UX locked rules** → the design-direction document wins;
- **Quick UI measurements and copy** → the frontend implementation spec wins.

Do not resolve a disagreement by picking whichever is easier to implement. Report it.

---

## 2. Locked decisions

Anything marked **LOCKED / APPROVED** is a settled product decision. Do not reopen, redesign, "improve", optimise or replace it.

If you find a genuine contradiction that makes correct implementation impossible: **stop and report it.** Never silently change the design to work around it.

---

## 3. Coding philosophy

- This is a **small application**, not a large SaaS platform.
- Prefer the **simplest implementation** that satisfies the current requirement.
- Do not overengineer. Do not build speculative abstractions.
- Do not add dependencies for hypothetical future needs.
- Do not introduce a backend, database or authentication unless explicitly approved.
- **Financial formulas must never live inside React components.**
- **A financial formula has exactly one source of truth.**
- Reuse genuinely reusable components and helpers; create them when reuse is real, not anticipated.
- Never duplicate defaults, limits, labels or types.
- **Quick Calculation and Detailed Feasibility are separate business logics.** Do not unify them into a generic engine unless that is explicitly approved later.
- Trivial visual-only arithmetic (bar widths, layout ratios) may live in UI components. Anything displayed as a financial figure comes from the engine or the view model.
- Maintain the naming defined by the financial spec.
- Do not use terminology the product spec rejects — for example **`depreciation`** or **`netProfit`** — in identifiers, types, comments or strings.

---

## 4. Change discipline

Before modifying an existing formula:

1. **Identify its source-of-truth specification** in `docs/`.
2. **Check its tests** and understand what they assert.
3. **Update the specification first** if the product decision itself is changing.
4. **Never silently change financial behaviour** while refactoring, renaming or tidying.

A refactor that alters a number is not a refactor. It is a product change and requires a decision.

---

## 5. Testing

For any financial logic:

- run **typecheck**;
- run **tests**;
- run **lint**;
- preserve the **golden vectors** and the **structural invariants**;
- never "fix" a failing financial test by editing the expected number until you have checked the specification. The test is usually right.

---

## 6. Scope discipline

Implement **only the requested phase**. Nothing adjacent, nothing anticipatory.

If something outside the current phase seems necessary, say so and wait. Do not implement it.
