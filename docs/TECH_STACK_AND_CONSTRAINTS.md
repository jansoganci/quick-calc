# Tech Stack & Technical Constraints

**Version:** v1.0
**Status:** All items in this document are **LOCKED / APPROVED**.
**Phase:** Planning — **not** Implementation
**Companion document:** `docs/quick-calculation-scope-v1.md` (product & financial scope)

This document records the project's technical decisions. It does not redesign the product, define financial formulas, or authorise implementation.

**Do not write code until implementation is explicitly requested.**

---

## 0. How to read this document

| This document IS | This document is NOT |
| --- | --- |
| A record of approved technical decisions | Permission to start building |
| The source of truth for stack, runtime, persistence and engineering constraints | A product or financial specification |
| Binding on any future implementation | A redesign of Quick Calculation or Detailed Feasibility |

Decisions marked **LOCKED** are approved. They are not to be reopened, re-optimised or replaced unless a future requirement genuinely forces a change, and that change is explicitly approved.

---

## 1. Approved stack **[LOCKED]**

| Layer | Choice |
| --- | --- |
| Frontend | **React** |
| Build tool | **Vite** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** |
| UI component library | **daisyUI** |
| Hosting / runtime | **Cloudflare** |
| Deployment model | **Cloudflare Workers + Static Assets** |

All application code — UI and financial calculation — is TypeScript. There is no second language in the stack.

---

## 2. Runtime / deployment model **[LOCKED]**

The application must deploy cleanly on Cloudflare as:

```
Static frontend assets
        +
Cloudflare Workers  —  only where needed
        +
No traditional always-on application server
```

### 2.1 What this means in practice

- The UI is a static Vite build (HTML, JS, CSS) served as Cloudflare Static Assets.
- Cloudflare Workers exist in the architecture as the hosting/runtime surface, **not** as a default place to put business logic.
- There is **no** always-on Node, Python, or other application server.
- There is **no** separate backend process to operate, scale or pay for.

### 2.2 Workers usage rule

Workers are used **only where needed**. Client-side TypeScript is the default place for financial calculations (§3). A Worker is not introduced for calculation, persistence, auth, or API routing unless a future requirement genuinely cannot be met client-side, and that requirement is explicitly approved.

### 2.3 Cloudflare products not in the initial architecture **[LOCKED]**

Do **not** introduce the following unless a concrete, approved requirement needs them:

- D1
- KV
- R2
- Durable Objects
- Queues
- Workflows
- Vectorize
- Workers AI
- Hyperdrive
- any other Cloudflare data, queue or AI product

The initial architecture is Static Assets (+ a Worker only if hosting requires it). That is the entire Cloudflare footprint for v1.

---

## 3. Calculation architecture **[LOCKED]**

### 3.1 Two separate calculation logics

```
Quick Calculation  →  its own simplified calculation logic
Detailed Feasibility (later)  →  a separate, more detailed financial logic
```

- **Do not force both modes into one shared financial engine.**
- Quick Calculation is **not** a wrapper around Detailed Feasibility.
- Detailed Feasibility is **not** required to reuse Quick Calculation's formulas, types or result shape.
- Shared **generic utilities** are acceptable where useful (safe division, percentage helpers, money formatting, validation primitives).
- **Business calculation logic may remain separate.**

This matches the product decision in `docs/quick-calculation-scope-v1.md` §3. That document owns the Quick Calculation formulas. This document owns the technical placement of those formulas.

### 3.2 Where calculations run

- Financial calculations run in **TypeScript**.
- They run **primarily client-side**.
- **Do not introduce server-side calculation infrastructure** unless a future requirement genuinely needs it, and that need is explicitly approved.

### 3.3 Separation from the UI **[LOCKED]**

| Must | Must not |
| --- | --- |
| Calculation logic lives outside UI components | Financial formulas inside React components |
| Presentation consumes results; it does not recompute them | Presentation adjusting or rounding inside the calculation chain |
| Each mode's business formulas live in one place | Duplicate financial formulas across files or modes |

Quick Calculation formulas belong in a Quick calculation module. Detailed Feasibility formulas will later belong in a Detailed calculation module. Generic helpers may be shared. UI components call these modules; they do not contain the math.

---

## 4. Persistence decisions **[LOCKED]**

### 4.1 Quick Calculation

| Decision | Rule |
| --- | --- |
| Account system | **No** |
| Database | **No** |
| Mandatory persistence | **No** |
| Shareable state | **May later** use URL / query parameters if useful |

Quick Calculation is stateless from the server's point of view. A user can compute, read the result, and leave. Nothing is saved unless a later, explicitly approved feature (for example URL-encoded shareable state) is added. URL/query sharing is **permitted**, not required, and needs no backend.

### 4.2 Detailed Feasibility (when it is built)

| Decision | Rule |
| --- | --- |
| Saved scenarios / calculations | **`localStorage`** |
| Portability | **JSON export / import** |
| Cloud sync | **No** in the initial version |
| User accounts | **No** |

Scenarios live on the user's device. JSON export/import is the backup and transfer mechanism. There is no cloud copy of a user's scenarios in the initial version.

### 4.3 Persistence that is out of scope for the initial architecture

No database, no cloud object storage, no synced user store, no server-side session. Persistence, where it exists at all, is **browser-local** (`localStorage` and optional URL state).

---

## 5. Explicitly excluded technologies **[LOCKED]**

Do not add these to the project unless a real future requirement needs them **and** that requirement is explicitly approved.

### 5.1 Backend and data

- Separate backend server
- Python backend
- Database of any kind (Postgres, MySQL, SQLite, D1, …)
- Authentication / user accounts
- Supabase
- Firebase, Auth0, Clerk, or any other auth/BaaS provider
- Cloud sync
- REST/GraphQL API layer for the financial engine

### 5.2 Cloudflare products (repeat of §2.3, listed here as exclusions)

- D1, KV, R2, Durable Objects, Queues, Workflows, Vectorize, Workers AI, Hyperdrive

### 5.3 Application architecture

- Microservices
- Always-on application server
- Server-side calculation infrastructure
- Unnecessary state-management library (Redux, Zustand, MobX, …) — see §6
- Unnecessary extra UI kits on top of daisyUI

### 5.4 Languages and runtimes outside the approved stack

- A second application language (Python, Go, Rust, …) for product logic
- A separate CSS framework replacing or stacking on Tailwind + daisyUI

---

## 6. Engineering constraints **[LOCKED]**

The project must remain **deliberately simple and inexpensive to operate**.

| # | Rule |
| --- | --- |
| E1 | **No unnecessary backend.** |
| E2 | **No database** unless a real future requirement needs one. |
| E3 | **No authentication** unless a real future requirement needs one. |
| E4 | **No microservices.** |
| E5 | **No premature abstractions.** Build the module that is needed now; do not invent a platform. |
| E6 | **No unnecessary state-management library.** Prefer React state and hooks unless complexity later justifies something else. |
| E7 | **No financial formulas inside UI components.** |
| E8 | **Keep calculation logic separated from presentation logic.** |
| E9 | **Avoid duplicate financial formulas.** Each formula has one home. |
| E10 | **Avoid adding dependencies without a clear current need.** A library must earn its place against a problem that exists today. |
| E11 | **Optimize for maintainability, fast iteration, and low Cloudflare operating cost.** |

### 6.1 Cost and operations implication

Because there is no always-on server, no database and no auth, the operating surface is a static site on Cloudflare. That is the intended cost model. Any proposal that adds a billed Cloudflare product, a backend, or a third-party SaaS must justify itself against E1–E3 and E11 before it is accepted.

### 6.2 Dependency rule

The approved runtime dependencies are those implied by the stack in §1:

- React
- Vite
- TypeScript
- Tailwind CSS
- daisyUI

Anything else (routers, form libraries, chart libraries, date libraries, …) is added only when a current, concrete need exists. "We might need it later" is not a current need.

---

## 7. Future extension rules **[LOCKED]**

These rules govern how the architecture may grow. They do not authorise building the extensions.

### 7.1 When a new capability is proposed

Ask, in order:

1. Can it run **client-side in TypeScript** with the existing stack?
2. If it needs persistence, can it use **`localStorage` and/or JSON export/import** (or URL state for Quick Calculation)?
3. If it still cannot, is the requirement real, current, and explicitly approved — not speculative?

Only after (3) may a backend, database, auth, or extra Cloudflare product be considered. The default answer is no.

### 7.2 Adding Detailed Feasibility later

- Add it as a **sibling** calculation module, not as a parent of Quick Calculation.
- Give it its own input types, formulas and result types.
- Share generic utilities only.
- Persist its scenarios in `localStorage` with JSON export/import, per §4.2.
- Do **not** retrofit Quick Calculation to wrap the new engine.
- Do **not** introduce a database or accounts to "support" it.

### 7.3 Adding URL-shareable Quick Calculation state later

Permitted by §4.1. Implementation, if requested, stays client-side: encode inputs in the query string, decode on load, no server. A version identifier should travel with the payload so an old link is not silently re-scored by new formulas. This remains optional until explicitly requested.

### 7.4 Adding a Cloudflare product later

A Cloudflare product (D1, KV, R2, Durable Objects, Queues, …) may be added only when:

- a named product requirement cannot be met client-side, and
- that requirement is explicitly approved, and
- the operating-cost impact is accepted.

"It would be more scalable" is not a requirement.

### 7.5 Changing the stack later

Replacing React, Vite, TypeScript, Tailwind, daisyUI or Cloudflare requires an explicit new decision. This document does not authorise substitutions.

---

## 8. Decisions register

All items below are **LOCKED / APPROVED**.

| # | Decision | Resolution |
| --- | --- | --- |
| T1 | Frontend | React |
| T2 | Build tool | Vite |
| T3 | Language | TypeScript |
| T4 | Styling | Tailwind CSS |
| T5 | UI component library | daisyUI |
| T6 | Hosting / runtime | Cloudflare |
| T7 | Deployment model | Cloudflare Workers + Static Assets |
| T8 | Separate backend server | **No** |
| T9 | Python backend | **No** |
| T10 | Database | **No** |
| T11 | Authentication | **No** |
| T12 | Supabase | **No** |
| T13 | Calculation engines | **Two separate logics.** Quick and Detailed are not forced into one shared financial engine. Generic utilities may be shared. |
| T14 | Calculation runtime | TypeScript, **primarily client-side**. No server-side calculation infrastructure unless a future requirement genuinely needs it. |
| T15 | Quick Calculation persistence | No accounts, no database, no mandatory persistence. Shareable state **may later** use URL / query parameters. |
| T16 | Detailed Feasibility persistence | `localStorage` + JSON export/import. No cloud sync and no user accounts in the initial version. |
| T17 | Extra Cloudflare products (D1, KV, R2, Durable Objects, Queues, …) | **Not in the initial architecture** unless a concrete requirement needs them. |
| T18 | Always-on application server | **No** |
| T19 | Microservices | **No** |
| T20 | State-management library | **No**, unless complexity later justifies one. Prefer React state / hooks. |
| T21 | Formulas in UI components | **Forbidden.** Calculation logic stays separated from presentation. |
| T22 | Duplicate financial formulas | **Avoid.** Each formula has one home. |
| T23 | Extra dependencies | **Not without a clear current need.** |
| T24 | Operating objective | Maintainability, fast iteration, low Cloudflare operating cost. |

---

## 9. Technical contradictions

**There are no blocking technical decisions remaining, and no genuine technical contradictions.**

Notes that are **not** contradictions:

- **Workers vs. client-side calculation.** Calculations run in the browser. Workers are the Cloudflare hosting/runtime surface and are used only where needed (typically to serve Static Assets). They are not a second calculation engine.
- **URL sharing vs. "no persistence".** URL/query state is optional, client-side, and does not require a database, accounts, or a backend. It is compatible with §4.1.
- **Two calculation modules vs. "avoid duplicate formulas".** Duplicate *formulas* are forbidden; two *engines* with different formulas are required. Generic helpers are the only shared calculation code. This is the same rule as in the product spec.
- **daisyUI + Tailwind.** daisyUI is a Tailwind component library. They are used together, not as alternatives.

---

## 10. Relationship to other planning documents

| Document | Owns |
| --- | --- |
| `docs/quick-calculation-scope-v1.md` | Quick Calculation product scope, inputs, formulas, outputs |
| `docs/TECH_STACK_AND_CONSTRAINTS.md` (this file) | Stack, runtime, calculation *placement*, persistence, exclusions, engineering constraints |
| `docs/DETAILED_FEASIBILITY_DECISIONS.md` | Detailed Feasibility locked decisions (not yet a full financial specification) |
| `docs/README.md` | Index of active vs archived documentation |

If this document and the Quick Calculation spec ever appear to disagree about **financial** behaviour, the Quick Calculation spec wins. If they appear to disagree about **stack, runtime or persistence**, this document wins.

---

## 11. Changelog

| Version | Change |
| --- | --- |
| v1.0 | Initial locked record of approved tech stack, runtime, calculation architecture, persistence, exclusions, engineering constraints and future extension rules |
