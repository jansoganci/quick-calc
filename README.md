# F&B Financial Feasibility Calculator

A Turkey-focused financial calculator and feasibility tool for food & beverage businesses. The initial preset is **Coffee Shop / Cafe**.

The product will offer two separate calculation experiences:

- **Quick / Lite Calculation** — a short, directional estimate from a handful of inputs. Intentionally simple: it answers "roughly, does this work?" and nothing more.
- **Detailed Feasibility** — a deeper financial model with its own input model, engine, and business logic. Planning is in progress; implementation has not started.

The two are **separate business logics** by design. They may reasonably produce different numbers, and they are not unified into one engine.

---

## Current status

| Area | Status |
| --- | --- |
| Product / financial scope (Quick / Lite) | Approved — `docs/quick-calculation-scope-v1.md` |
| Tech stack | Approved — `docs/TECH_STACK_AND_CONSTRAINTS.md` |
| Architecture and project structure | Approved — `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md` |
| Quick / Lite core | Implemented |
| Quick / Lite frontend | Implemented |
| Detailed Feasibility | Decision log only — `docs/DETAILED_FEASIBILITY_DECISIONS.md`. Not implemented |

Documentation index: [`docs/README.md`](docs/README.md).

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

Active specifications live in `docs/`. Finished execution plans live in `docs/archive/`.

| Document | Owns |
| --- | --- |
| [`docs/README.md`](docs/README.md) | Index of active vs archived documentation |
| [`docs/quick-calculation-scope-v1.md`](docs/quick-calculation-scope-v1.md) | Quick / Lite product & financial scope |
| [`docs/DETAILED_FEASIBILITY_DECISIONS.md`](docs/DETAILED_FEASIBILITY_DECISIONS.md) | Detailed Feasibility locked decisions (not a full financial spec yet) |
| [`docs/TECH_STACK_AND_CONSTRAINTS.md`](docs/TECH_STACK_AND_CONSTRAINTS.md) | Stack, runtime, persistence, technical exclusions |
| [`docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`](docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md) | Folder structure, layer boundaries, reuse rules, naming |
| [`docs/DESIGN_DIRECTION.md`](docs/DESIGN_DIRECTION.md) | Locked visual & UX direction |
| [`docs/FRONTEND_IMPLEMENTATION_SPEC.md`](docs/FRONTEND_IMPLEMENTATION_SPEC.md) | Quick / Lite UI measurements, tokens, copy |
| [`CLAUDE.md`](CLAUDE.md) | Operating guidance for AI coding models |

---

## Development

```bash
npm install
npm run dev          # Vite dev server
npm run test:run     # Vitest once
npm run typecheck
npm run lint
npm run build
```

---

## Principles

- Simple architecture.
- No unnecessary backend.
- One source of truth for every financial formula.
- Calculation logic separated from UI.
- Build the current requirement, not a hypothetical future one.
