# Implementation Plan: Sandbox Logic Circuit Builder

**Branch**: `001-logic-circuit-sandbox` | **Date**: 2025-12-09 | **Spec**: specs/001-logic-circuit-sandbox/spec.md
**Input**: Feature specification from `/specs/001-logic-circuit-sandbox/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an interactive canvas where learners place switches, gates, lights, and reusable
subcircuits to observe real-time signal flow, compose complex circuits, and complete guided
challenges. The approach centers on pure core commands for graph/simulation, React Flow as a
view adapter, enforced wiring invariants, deterministic simulation, and import/export with
documented schemas.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript, React (Vite)  
**Primary Dependencies**: React Flow, Zustand (store/orchestrator), Vitest + React Testing Library  
**Storage**: Local in-memory state with import/export files (no backend)  
**Testing**: Vitest unit, RTL component, e2e (Playwright/Cypress) per constitution  
**Target Platform**: Web browser (desktop + touch)  
**Project Type**: Single web app  
**Performance Goals**: Visual updates at ≥60 fps (≤16 ms per frame) for circuits of dozens
of nodes/wires; simulation convergence ≤100 iterations  
**Constraints**: Core remains pure/framework-agnostic; React Flow as adapter; schema
compatibility v1.0 + v1.1 metadata  
**Scale/Scope**: Single-user sandbox; curated challenge library; no real-time collaboration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Deep modules, narrow interfaces: keep core graph/simulation APIs small, pure, and framework-agnostic.
- Separation of concerns: map work to `src/core` (pure), `src/app` (store/adapter), `src/ui` (React/React Flow).
- Specification-driven: list contracts/invariants/errors to author before coding; link relevant specs.
- TDD-first coverage: define tests to write first (Vitest core, RTL/e2e for UI) that must fail before implementation.
- Explicit invariants: plan validation for graph rules, simulation bounds (≤100 iterations), import/export schemas (v1.0 + v1.1 metadata).
- Extensibility: state how node/command/menu/metadata extension points are preserved or migrated.

**Gate Assessment (pre-design)**: All gates satisfied with current approach (pure core,
adapter boundaries, spec/contracts written here, TDD-first test plan, invariants defined,
extension points preserved). No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-logic-circuit-sandbox/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── core/        # pure graph/simulation commands, invariants, import/export
├── app/         # store, selectors, command orchestration, RF adapter
├── ui/          # React components, React Flow nodes/edges, challenge UX
├── design/      # tokens, themes, canvas styles
└── tests/       # unit (core), component (RTL), e2e fixtures/specs

src/tests/
├── unit/        # core validation/simulation/import-export
├── component/   # canvas interactions, nodes, signals, challenge UI
└── e2e/         # build/compose circuits, challenges, import/export
```

**Structure Decision**: Single web app; core/app/ui/design directories per repo conventions;
tests grouped by unit/component/e2e under `src/tests` (or `tests` for e2e runner as needed)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None identified; all constitution gates satisfied.
