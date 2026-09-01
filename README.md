# F&B Financial Feasibility Calculator

A Turkey-focused financial calculator and feasibility tool for food & beverage businesses. The initial preset is **Coffee Shop / Cafe**.

The product will offer two separate calculation experiences:

- **Quick Calculation** — a short, directional estimate from a handful of inputs. Intentionally simple: it answers "roughly, does this work?" and nothing more.
- **Detailed Feasibility** — a later, deeper financial model with richer inputs, scenario storage and fuller simulation.

The two are **separate business logics** by design. They may reasonably produce different numbers, and they are not unified into one engine.

---

## Current status

Planning is complete. Implementation has **not started**.

| Area | Status |
| --- | --- |
| Product / financial scope (Quick Calculation) | Planned and approved |
| Tech stack | Approved |
| Architecture and project structure | Approved |
| Quick Calculation core implementation plan | Approved |
| Quick Calculation core (code) | **Not implemented yet** |
| Visual design / frontend | **Not implemented yet** |
| Detailed Feasibility | **Not implemented yet** |

The repository currently contains planning documents only.

---

## Stack

- **React** + **Vite** + **TypeScript**
- **Tailwind CSS** + **daisyUI**
- **Cloudflare** for hosting
- **No database**, **no authentication**
- **Financial calculations run client-side**

Full detail and the reasoning behind each choice: `docs/TECH_STACK_AND_CONSTRAINTS.md`.

---

## Architecture overview

```
src/
  core/         financial & business logic — pure TypeScript, no React
  features/     product screens, forms, composition
  components/   reusable, domain-neutral UI primitives
  lib/          generic helpers (formatting, predicates)
  data/         benchmark / reference data, when needed
```

The one boundary that matters: **financial logic lives in `core/`, never in React components.**

Quick Calculation and Detailed Feasibility each own their own logic inside `core/` and do not import business logic from one another.

Full rules, dependency direction and naming conventions: `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`.

---

## Documentation

| Document | Owns |
| --- | --- |
| [`docs/quick-calculation-scope-v1.md`](docs/quick-calculation-scope-v1.md) | Quick Calculation product & financial scope: inputs, formulas, outputs, terminology |
| [`docs/TECH_STACK_AND_CONSTRAINTS.md`](docs/TECH_STACK_AND_CONSTRAINTS.md) | Stack, runtime, deployment, persistence, technical exclusions |
| [`docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`](docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md) | Folder structure, layer boundaries, reuse rules, testing boundaries, naming |
| [`docs/QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md`](docs/QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md) | Execution plan for the Quick Calculation core: files, sequence, result contract, test plan |
| [`CLAUDE.md`](CLAUDE.md) | Operating guidance for AI coding models working in this repository |

---

## Development

There is **no package tooling in the repository yet** — no `package.json`, no source files. Implementation has not started, so there are no install, build or test commands to run.

The first implementation phase is the Quick Calculation core, described in `docs/QUICK_CALCULATION_CORE_IMPLEMENTATION_PLAN.md`. That phase creates the project tooling along with the engine, and defines the scripts for install, test, typecheck and lint. This section should be updated with the real commands once those files exist.

---

## Principles

- Simple architecture.
- No unnecessary backend.
- One source of truth for every financial formula.
- Calculation logic separated from UI.
- Build the current requirement, not a hypothetical future one.
