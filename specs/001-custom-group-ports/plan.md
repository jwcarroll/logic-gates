# Implementation Plan: Custom Group Ports

**Branch**: `001-custom-group-ports` | **Date**: 2025-12-14 | **Spec**: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/spec.md`  
**Input**: Feature specification from `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Allow a group creator to define an explicit external interface (exposed inputs/outputs with names and ordering) when creating or editing a grouped circuit, so collapsed groups behave like reusable “black boxes” and do not mirror internal wiring ports. Interface edits warn and disconnect existing wires; import/export rejects legacy schemas without an explicit interface.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript ~5.9.3  
**Primary Dependencies**: React ^19.2, React Flow ^11.11, Zustand ^5.0, Vite ^7.2  
**Storage**: In-memory circuit state; import/export via JSON payloads (clipboard/prompt)  
**Testing**: Vitest + jsdom + React Testing Library; Playwright for browser flows  
**Target Platform**: Browser (SPA served by Vite; production bundle via `vite build`)  
**Project Type**: Web application (single frontend; no backend)  
**Performance Goals**: Preserve interactive editing feel; keep grouping/interface operations linear in nodes+wires; preserve simulation convergence cap (≤100 iterations)  
**Constraints**: `src/core` remains pure and framework-agnostic; React Flow is view-only adapter; legacy schema loads without explicit group interface are rejected (no migration)  
**Scale/Scope**: Typical circuits in tests/fixtures; expect tens to low-hundreds of nodes/wires (performance fixture exists for 30×50-scale wiring)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Deep modules, narrow interfaces: keep core graph/simulation APIs small, pure, and framework-agnostic.
- Separation of concerns: map work to `src/core` (pure), `src/app` (store/adapter), `src/ui` (React/React Flow).
- Specification-driven: author explicit group-interface contracts (port definitions, mapping rules, schema validation errors) before changing behavior.
- TDD-first coverage: add failing unit tests in `src/tests/core/` for interface validation + rewiring; update/add RTL and Playwright coverage for UI flows.
- Explicit invariants: enforce graph rules (output→input, one wire per input, no self-loops), simulation bounds (≤100 iterations), and import/export schema (new required group interface) with user-understandable validation errors.
- Extensibility: state how node/command/menu/metadata extension points are preserved or migrated.

**Gate Result**: PASS (no constitution violations required for this feature plan).

## Project Structure

### Documentation (this feature)

```text
specs/001-custom-group-ports/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── core/                # Pure graph/simulation/commands (framework-agnostic)
│   ├── commands.ts
│   ├── simulation.ts
│   ├── validation.ts
│   └── io/              # Import/export validation & schema versioning
├── app/                 # Store + adapters/derived state
└── ui/                  # React components + React Flow canvas

src/tests/               # Vitest suites (core/unit/component/e2e)
```

**Structure Decision**: Web application (single frontend) with pure core in `src/core` and UI as adapter.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Phase 0 — Outline & Research (output: `research.md`)

### Unknowns to resolve

- Current behavior and invariants for grouping/ungrouping/cloning (core + UI adapters)
- Current import/export schema versions and validation coverage
- How ports are represented/rendered today (no per-port labels) and what UX surface is needed for naming/ordering
- Best-fit representation for “junction” nodes in the pure core (simulation + validation implications)

### Research deliverable expectations

All “unknowns” above must end in an explicit decision with rationale and alternatives considered in `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/research.md`.

## Phase 1 — Design & Contracts (outputs: `data-model.md`, `contracts/*`, `quickstart.md`)

### Core data model changes (design intent)

- Introduce an explicit `GroupInterface` representation for groups:
  - Ordered inputs and outputs
  - Per-port stable identity and human-readable name
  - Mapping from exposed port → internal connection point
- Add a first-class internal “junction” node type to serve as an editable connection point inside groups (hybrid: auto-create by default, editable thereafter).

### Core command/query surface (design intent)

- Create group with required interface definition (no implicit mirroring).
- Edit group interface with warning + disconnect behavior; operation must be undoable in UI (store-level) and deterministic in core.
- Validation helpers to produce structured, user-actionable errors (what, where, how to fix).

### Import/export schema (design intent)

- Bump schema version to require explicit group interface definitions and reject older versions without migration (per spec clarifications).

### Constitution Check (post-design)

PASS — The design keeps `src/core` pure, models UI as adapter/orchestrator, specifies contracts/invariants up-front, and plans test-first coverage before implementation.

## Phase 2 — Planning (output: tasks list in `tasks.md`, created by `/speckit.tasks`)

This run stops after Phase 2 planning inputs are captured in this plan; task generation itself is deferred to `/speckit.tasks`.
