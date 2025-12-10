---

description: "Task list for Sandbox Logic Circuit Builder"
---

# Tasks: Sandbox Logic Circuit Builder

**Input**: Design documents from `/specs/001-logic-circuit-sandbox/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD-first. Every story includes tests written before implementation (Vitest for core, RTL component, e2e where applicable).

**Organization**: Tasks are grouped by user story so each slice is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions
- Include explicit tasks for invariants (graph validity, simulation bounds, import/export schemas) and extension points (nodes/commands/menus/metadata)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline tooling

- [x] T001 Install workspace dependencies in `package.json` using npm install at repo root
- [x] T002 [P] Review and align build/type settings in `vite.config.ts` and `tsconfig.json` for sandbox needs
- [x] T003 [P] Ensure feature directory scaffolds exist per plan in `src/core`, `src/app`, `src/ui`, `src/design`, `src/tests`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core scaffolds and invariants required before user stories

- [x] T004 Define core entity/type shells from data-model in `src/core/types.ts`
- [x] T005 [P] Author import/export schema definitions (v1.0 + v1.1 metadata) and validators in `src/core/io/schema.ts`
- [x] T006 [P] Stub import/export command surface returning structured validation results in `src/core/io/importExport.ts`
- [x] T007 Set up deterministic simulation pipeline shell with iteration cap constant in `src/core/simulation.ts`
- [x] T008 [P] Scaffold Zustand store and command adapters for circuits in `src/app/store.ts`
- [x] T009 [P] Scaffold React Flow adapter shell and canvas style tokens in `src/app/reactFlowAdapter.ts`

---

## Phase 3: User Story 1 - Build and observe simple circuits (Priority: P1) 🎯 MVP

**Goal**: Learners place switches, basic gates, and lights on a canvas and see real-time signal flow.

**Independent Test**: Build a two-input AND circuit with switches and a light; toggling switches updates the light without errors or delays.

### Tests for User Story 1 (write first)

- [x] T010 [P] [US1] Add wiring invariant unit tests for switches/gates/lights in `src/tests/core/graph-validation.test.ts`
- [x] T011 [P] [US1] Add simulation truth-table tests for AND/OR/NOT with toggle timing caps in `src/tests/core/simulation/*.test.ts`
- [x] T012 [P] [US1] Add store/selector tests for signal propagation and error states in `src/tests/app/circuit-store.test.ts`
- [x] T013 [P] [US1] Add canvas interaction tests for placement, wiring feedback, and toggles in `src/tests/component/canvas-basic.test.tsx`

### Implementation for User Story 1

- [x] T014 [US1] Implement graph invariants and port helpers for basic components in `src/core/types.ts` and `src/core/validation.ts`
- [x] T015 [P] [US1] Implement circuit commands (create circuit, add components, connect wires with validation) in `src/core/commands.ts`
- [x] T016 [P] [US1] Implement deterministic simulation for basic gates with ≤100-iteration cap and defaults in `src/core/simulation.ts`
- [x] T017 [P] [US1] Wire store actions/selectors to circuit commands and simulator in `src/app/store.ts`
- [x] T018 [P] [US1] Implement React Flow node/edge adapters for switches/gates/lights with signal styling in `src/app/reactFlowAdapter.ts` and `src/ui/components/LogicNode.tsx`
- [x] T019 [US1] Build sandbox canvas page with palette, drag/drop, wiring feedback, and toggle interactions in `src/ui/components/Canvas.tsx`
- [x] T020 [US1] Connect simulation updates to visual indicators with debounced render sync in `src/ui/hooks/useSimulationSync.ts`

**Checkpoint**: User Story 1 independently deliverable and testable

---

## Phase 4: User Story 2 - Compose reusable subcircuits (Priority: P2)

**Goal**: Learners group selections into reusable blocks and compose them into larger circuits.

**Independent Test**: Group a half-adder subcircuit, reuse it twice, and wire outputs into an indicator to verify composed behavior.

### Tests for User Story 2 (write first)

- [x] T021 [P] [US2] Add core tests for grouping/ungrouping, port exposure, and cloning in `src/tests/core/grouping.test.ts`
- [x] T022 [P] [US2] Add component tests for grouping UX and reuse on canvas in `src/tests/component/grouping-ui.test.tsx`

### Implementation for User Story 2

- [x] T023 [US2] Implement grouping commands (create group, expose ports, clone instances) in `src/core/commands.ts`
- [x] T024 [P] [US2] Extend simulator to evaluate grouped subcircuits and propagate signals across instances in `src/core/simulation.ts`
- [x] T025 [P] [US2] Extend store to manage grouped nodes and instance placement in `src/app/store.ts`
- [x] T026 [P] [US2] Add React Flow handling for subcircuit blocks with port mapping UI in `src/app/reactFlowAdapter.ts` and `src/ui/components/LogicNode.tsx`
- [x] T027 [US2] Add canvas grouping/ungrouping controls and selection flow in `src/ui/components/Canvas.tsx`

**Checkpoint**: User Story 2 independently deliverable and testable

---

## Phase 5: User Story 3 - Explore guided learning challenges (Priority: P3)

**Goal**: Learners load curated challenges and verify completion against target behaviors.

**Independent Test**: Load a sample challenge, edit wiring, and verify the sandbox reports success when outputs match the target pattern.

### Tests for User Story 3 (write first)

- [x] T028 [P] [US3] Add unit tests for challenge loading, duplication safety, and success criteria evaluation in `src/tests/app/challenges.test.ts`
- [x] T029 [P] [US3] Add component tests for challenge list/load/run and success indicator in `src/tests/component/challenge-runner.test.tsx`

### Implementation for User Story 3

- [x] T030 [US3] Implement challenge library loader and duplication guard using schemas in `src/app/challenges/challengeService.ts`
- [x] T031 [P] [US3] Implement challenge success evaluation and target comparison in `src/core/commands/challengeCommands.ts`
- [x] T032 [P] [US3] Add challenge UI (library list, load action, run/validate) in `src/ui/pages/ChallengePanel.tsx`
- [x] T033 [US3] Integrate challenge load/run flows with canvas/store to keep templates immutable in `src/app/store.ts`

**Checkpoint**: User Story 3 independently deliverable and testable

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Performance, schemas, documentation, and resilience across stories

- [x] T034 [P] Add import/export round-trip fixtures for circuits/challenges and usage notes in `specs/001-logic-circuit-sandbox/quickstart.md`
- [x] T035 [P] Add performance and convergence regression tests using perf fixture in `src/tests/unit/core/perf-latency-30x50.test.ts`
- [x] T036 Harden error messaging and logging for invariant violations in `src/app/logging/errorReporting.ts`
- [x] T037 [P] Validate quickstart flows (dev/build/test) and document findings in `specs/001-logic-circuit-sandbox/checklists/validation.md`
- [x] T038 Add application error boundary and fallback UI wrapping React tree to surface render/runtime errors in `src/ui/components/ErrorBoundary.tsx` and `src/main.tsx`
- [x] T039 [P] Extend Playwright e2e to assert no runtime errors when interacting with canvas nodes in `src/tests/e2e/playwright/us1-build-and-circuit.spec.ts`
- [x] T040 [P] Prevent selection change loops by skipping redundant Zustand updates in `src/app/store.ts`

---

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) → Polish
- US1 has no story prerequisites once foundational completes; US2 relies on foundational and US1 primitives for reuse; US3 relies on schemas, store hooks, and stable simulation from prior phases.
- Within each story: tests → core commands/simulation → store → adapters/UI; keep React Flow as view adapter only.

## User Story Dependency Graph

- US1 (P1): foundational prerequisites only.
- US2 (P2): depends on foundational + US1 primitives (components/simulator) to ensure grouped behavior mirrors base nodes.
- US3 (P3): depends on foundational schemas and simulator; can start after US1 core ready, with minimal coupling to US2 aside from optional grouped challenge content.

## Parallel Execution Examples

- US1: T010–T013 in parallel; T015–T018 in parallel after T014; T019–T020 follow adapter/store wiring readiness.
- US2: T021–T022 in parallel; T023/T024/T025 in parallel after tests; T026–T027 in parallel once store/simulator updated.
- US3: T028–T029 in parallel; T030/T031/T032 in parallel after schema + simulator readiness; T033 follows store integration.

## Implementation Strategy

- MVP first: Complete Phases 1–3 to deliver basic circuit building and simulation.
- Incremental: Add subcircuits (Phase 4) then challenges (Phase 5), validating each phase independently.
- Maintain adapter boundaries: core logic in `src/core`, orchestration in `src/app`, view/React Flow in `src/ui`; preserve import/export schema compatibility (v1.0 + v1.1 metadata) and simulation convergence cap (≤100 iterations).
