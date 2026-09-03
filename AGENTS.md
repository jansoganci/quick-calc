# AGENTS.md — Repository Guide for Coding Agents

This file applies to the entire repository. It is operational guidance, not a product or financial specification. Read it before changing code, then read the active source-of-truth documents relevant to the task.

## Project snapshot

This is a Turkey-focused financial feasibility calculator for food-and-beverage businesses.

- Stack: React 18, Vite, TypeScript, Tailwind CSS, daisyUI.
- Runtime: client-side calculations, static assets on Cloudflare.
- There is no database, authentication, or traditional application server.
- The Quick Calculation engine and UI are implemented.
- The Detailed Feasibility engine exists in `src/core/detailed/`; its feature UI is not implemented.
- Quick and Detailed are separate business models. They may intentionally produce different results.

## Sources of truth

Read `docs/README.md` for the current documentation index. Use the following authority order when documents overlap:

1. Quick financial behavior: `docs/quick-calculation-scope-v1.md`
2. Detailed product decisions and exclusions: `docs/DETAILED_FEASIBILITY_DECISIONS.md`
3. Detailed formulas, schema, defaults, edge states, and golden vector: `docs/DETAILED_FINANCIAL_SPEC.md`
4. Stack, runtime, persistence, and technical exclusions: `docs/TECH_STACK_AND_CONSTRAINTS.md`
5. Folder ownership and dependency direction: `docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`
6. Locked visual and UX rules: `docs/DESIGN_DIRECTION.md`
7. Quick UI measurements, tokens, field map, and copy: `docs/FRONTEND_IMPLEMENTATION_SPEC.md`
8. Layout-frame notes: `docs/design.md`

Documents under `docs/archive/` are historical execution plans, not current authority. `CLAUDE.md` is additional operating guidance, not a specification.

Anything marked `LOCKED` or `APPROVED` is settled. Do not redesign, optimize, or reinterpret it without an explicit new product decision. If active sources genuinely contradict one another, report the conflict instead of silently choosing the easier behavior.

## Repository map

```text
src/
  app/                  root composition, error boundary, global CSS
  core/quick/           pure Quick financial engine
  core/detailed/        pure Detailed financial engine
  features/quick-calc/  Quick form state, view model, labels, and UI
  components/           reusable domain-neutral UI primitives
  lib/                  generic parsing and formatting helpers
```

Tests are colocated as `*.test.ts`. Each engine exposes its supported public API through its own `index.ts`.

## Architecture rules

Keep the dependency direction simple:

```text
app -> features -> core -> lib
                  -> components -> lib
```

- `core/**` is pure TypeScript. It must not import React, UI state, features, components, benchmark data, browser APIs, time, randomness, storage, or network code.
- `components/**` is domain-neutral. It must not know about rent, VAT, margins, payback, or either engine.
- `features/**` owns screen composition, React state, labels, parsing orchestration, and engine-result-to-display mapping.
- `lib/**` contains generic helpers, not business rules.
- Quick and Detailed must never import business logic or feature code from one another.
- External consumers import an engine through `src/core/<mode>/index.ts`. Files within an engine import sibling modules directly, not through their own barrel.
- Avoid circular imports; ESLint enforces key boundaries.

Do not introduce service/repository layers, dependency injection, generic engine interfaces, state-management libraries, generic form frameworks, chart libraries, or speculative shared abstractions. Two real call sites justify sharing; a hypothetical future use does not.

## Financial logic rules

- A financial formula has exactly one implementation.
- Financial formulas never live in React components.
- Quick and Detailed defaults, limits, types, validation, and calculations remain owned by their respective engine folders.
- Do not duplicate defaults or input limits in a feature or component. Import the engine-owned values.
- Engines return raw numeric values. Presentation rounding and Turkish formatting belong in `src/lib/` and the feature view model.
- Any displayed monetary amount, margin, cost, earnings, break-even, or payback figure must come from an engine or view model. Components may calculate visual-only values such as bar widths.
- Validation returns structured errors; engines must not throw for documented input or edge states.
- Never allow a calculation to emit `NaN` or `Infinity`.
- Preserve the terminology in the financial specifications. In particular, do not introduce rejected names such as `depreciation`, `netProfit`, or `netProfitMargin`.
- Keep `posCommissionRate` and `cardPaymentShare` distinct.

Before changing a formula:

1. Identify the governing specification.
2. Read the relevant implementation and tests.
3. Update the specification first if the product decision itself is changing.
4. Add or update tests covering the change, including reconciliation and edge behavior.
5. Confirm unrelated golden-vector values have not drifted.

A refactor that changes a result is a financial product change, not a refactor. Never make a failing financial test pass by changing its expected number before checking the specification and calculation chain.

## Frontend rules

- Preserve the existing quiet, analytical, Turkish-first design system.
- Reuse the approved Tailwind tokens from `tailwind.config.ts`; do not add ad hoc colors in components.
- Global component styles live in `src/app/index.css`. Feature-specific structure stays with the feature.
- Keep labels and product copy centralized in the feature's `labels.ts`.
- Use `src/components/` only for genuinely reusable, domain-neutral controls. Do not wrap daisyUI solely to hide class names.
- Maintain responsive behavior and accessible names, labels, focus states, touch targets, and semantic HTML.
- For layout or styling changes, verify at least one desktop and one mobile viewport in a real browser.
- Do not add a large UI test or visual-regression framework unless explicitly requested.

## TypeScript and code style

- TypeScript is strict; account for `noUncheckedIndexedAccess` and exact optional types where applicable.
- Use explicit `.ts` and `.tsx` extensions for local imports, matching the existing codebase.
- Prefer named exports.
- Use PascalCase for React components and types, camelCase for functions/modules, verb-first function names, and `is`/`has`/`should` prefixes for booleans.
- Follow the local file's semicolon style; the repository currently contains both semicolon and semicolon-free modules.
- Split by responsibility, not by function count. Avoid both large mixed-purpose files and unnecessary one-function files.
- Do not create a generic `utils.ts` or a global type dumping ground.
- Do not add dependencies unless the task genuinely requires one and the approved stack permits it.

## Working discipline

- Implement only the requested scope. Do not build adjacent phases or anticipated Detailed UI work.
- Inspect the working tree before editing. Existing changes may belong to the user; preserve them and do not rewrite unrelated files.
- Do not use destructive Git commands or discard user changes.
- Prefer the smallest change that satisfies the requirement.
- Do not edit generated output in `dist/`.
- Do not deploy or alter Cloudflare configuration unless explicitly requested.
- When behavior or requirements are ambiguous, use the specifications and current tests first. Ask only when the choice would materially change product behavior.

## Commands and verification

```bash
npm install          # install dependencies when needed
npm run dev          # local Vite server
npm run test:run     # one-shot Vitest suite
npm run typecheck    # both TypeScript configurations
npm run lint         # ESLint and architecture checks
npm run build        # typecheck plus production Vite build
```

Use `npm run test:run`, not `npm test`, for a non-interactive verification run.

For a normal code change, run the narrowest relevant tests while iterating. Before handing off a completed implementation, run:

1. `npm run typecheck`
2. `npm run test:run`
3. `npm run lint`
4. `npm run build`

For financial changes, also verify the relevant golden vector, reconciliation invariants, validation cases, and unavailable edge states. For frontend changes, add desktop/mobile visual verification and check for application-origin console errors.

Report any failed check, skipped verification, documentation conflict, or unrelated pre-existing failure clearly in the final handoff.
