---
description: "Executable task list for implementing Custom Group Ports"
---

# Tasks: Custom Group Ports

**Input**: Design documents from `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/`  
**Prerequisites**: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/plan.md`, `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/spec.md`  
**Optional inputs used**: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/research.md`, `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/data-model.md`, `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/contracts/`, `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/quickstart.md`

**Tests**: TDD-first (per spec). Each user story includes tests written before implementation (Vitest for core; RTL/Playwright for UI flows).

## Format: `- [ ] T### [P?] [US#?] Description with absolute file path(s)`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: User story label (required only in user story phases)
- Every task includes at least one absolute file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add feature-scoped fixtures to support test-first development.

- [ ] T001 [P] Create fixtures directory and brief README in `/home/jwcarroll/dev/logic-gates/src/tests/fixtures/custom-group-ports/README.md`
- [ ] T002 [P] Add legacy schema payload fixture (v1.1 group without explicit interface) in `/home/jwcarroll/dev/logic-gates/src/tests/fixtures/custom-group-ports/legacy-v1.1-group.json`
- [ ] T003 [P] Add v1.2 sample export fixture that includes `group.data.interface` + `junction` nodes in `/home/jwcarroll/dev/logic-gates/src/tests/fixtures/custom-group-ports/sample-v1.2-group.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared core/data/adapter changes that MUST be complete before user story work.

**⚠️ CRITICAL**: No user story work should be merged until this phase is complete and compiles.

- [ ] T004 Update import schema gating to accept only v1.2 and hard-reject v1.0/v1.1 in `/home/jwcarroll/dev/logic-gates/src/core/io/schema.ts`
- [ ] T005 Update export default version to v1.2 and store fallback export version to v1.2 in `/home/jwcarroll/dev/logic-gates/src/core/io/importExport.ts` and `/home/jwcarroll/dev/logic-gates/src/app/store/index.ts`
- [ ] T006 [P] Update fixture export version to v1.2 in `/home/jwcarroll/dev/logic-gates/src/tests/fixtures/roundtrip-circuit.json`
- [ ] T007 [P] Update fixture export version to v1.2 in `/home/jwcarroll/dev/logic-gates/src/tests/fixtures/roundtrip-challenge.json`
- [ ] T008 [P] Update fixture export version to v1.2 in `/home/jwcarroll/dev/logic-gates/src/tests/fixtures/simple-circuits.json`
- [ ] T009 Extend core types with `junction` + explicit `GroupInterface`/`ExposedPort`, and update `GroupNode.data` to store `interface` (ordered, named ports) in `/home/jwcarroll/dev/logic-gates/src/core/types.ts`
- [ ] T010 [P] Add `createJunctionNode()` factory (with `inputPortId` + `outputPortId`) in `/home/jwcarroll/dev/logic-gates/src/core/factories.ts`
- [ ] T011 Add pure group-interface validation helpers (direction rules, uniqueness, required mapping; Option A mapping convention: exposed inputs map to junction `outputPortId`, exposed outputs map to junction `inputPortId`) in `/home/jwcarroll/dev/logic-gates/src/core/groupInterfaceValidation.ts`
- [ ] T012 Update wire validation port lookup to understand group interface ports and junction ports in `/home/jwcarroll/dev/logic-gates/src/core/validation.ts`
- [ ] T013 Update simulation to evaluate junction nodes and compute group I/O via interface/portMap in `/home/jwcarroll/dev/logic-gates/src/core/simulation.ts`
- [ ] T014 Update React Flow adapter to support `junction` nodes and to derive group port handles from `group.data.interface` in `/home/jwcarroll/dev/logic-gates/src/app/reactFlowAdapter.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin (and proceed in parallel where marked).

---

## Phase 3: User Story 1 - Define External Interface When Grouping (Priority: P1) 🎯 MVP

**Goal**: When grouping, the creator defines an explicit external interface (names + ordering + mapping); collapsed group shows only those ports.

**Independent Test**: Create a grouped circuit with more internal ports than desired and verify the collapsed group exposes only the selected ports (with names/order) and behaves correctly (e.g., half adder truth table). (Spec: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/spec.md`)

### Tests for User Story 1 (write first; ensure FAIL before implementation)

- [ ] T015 [P] [US1] Add unit tests for group-interface invariants (FR-001..FR-007 + FR-006a Option A mapping convention) in `/home/jwcarroll/dev/logic-gates/src/tests/core/groupInterfaceValidation.test.ts`
- [ ] T016 [P] [US1] Add unit tests for junction simulation semantics (buffer + fan-out) in `/home/jwcarroll/dev/logic-gates/src/tests/core/junction.test.ts`
- [ ] T017 [P] [US1] Add unit tests for `createGroup` rewiring with explicit interface (ports count/order/names) in `/home/jwcarroll/dev/logic-gates/src/tests/core/createGroup.test.ts`
- [ ] T018 [P] [US1] Add unit tests for v1.2 import/export success and legacy version rejection (hard-fail) in `/home/jwcarroll/dev/logic-gates/src/tests/core/importExportV1_2.test.ts`
- [ ] T019 [P] [US1] Add RTL test: collapsed group renders port names in order (not raw ids) in `/home/jwcarroll/dev/logic-gates/src/tests/ui/groupPortLabels.test.tsx`
- [ ] T020 [P] [US1] Add RTL test: Group Interface Editor enforces “≥1 exposed port” and “each port mapped to a junction” (Option A mapping convention: inputs map to junction `outputPortId`, outputs map to junction `inputPortId`) in `/home/jwcarroll/dev/logic-gates/src/tests/ui/groupInterfaceEditor.test.tsx`
- [ ] T021 [US1] Add Playwright flow: group selected → define 2-in/2-out half-adder interface → verify outputs for 4 input combos in `/home/jwcarroll/dev/logic-gates/src/tests/e2e/playwright/us1-custom-group-interface.spec.ts`

### Implementation for User Story 1

- [ ] T022 [US1] Implement core `createGroup()` command (explicit interface required; auto-create junctions; deterministic rewiring) in `/home/jwcarroll/dev/logic-gates/src/core/commands.ts`
- [ ] T023 [P] [US1] Implement helper to build a default interface draft from selection boundary ports (names/order) in `/home/jwcarroll/dev/logic-gates/src/core/groupInterfaceDraft.ts`
- [ ] T024 [US1] Refactor core `cloneGroup()` to clone group `interface`, `portMap`, and any `junction` children consistently in `/home/jwcarroll/dev/logic-gates/src/core/commands.ts`
- [ ] T025 [US1] Refactor core `ungroup()` to rewire external wires through the new interface/junction mapping in `/home/jwcarroll/dev/logic-gates/src/core/commands.ts`
- [ ] T026 [P] [US1] Update node rendering to support `junction` (handles + label) in `/home/jwcarroll/dev/logic-gates/src/ui/components/LogicNode.tsx`
- [ ] T027 [P] [US1] Add styling for junction nodes and port labels (left/right of handles) in `/home/jwcarroll/dev/logic-gates/src/App.css`
- [ ] T028 [US1] Implement port-name display for group handles using `group.data.interface` in `/home/jwcarroll/dev/logic-gates/src/app/reactFlowAdapter.ts`
- [ ] T029 [P] [US1] Add Group Interface Editor UI (add/remove/reorder/rename ports, select mapping target) in `/home/jwcarroll/dev/logic-gates/src/ui/components/GroupInterfaceEditor.tsx`
- [ ] T030 [US1] Add store state for “group interface draft” (create mode) with validation + derived payload in `/home/jwcarroll/dev/logic-gates/src/app/store/groupInterfaceDraft.ts`
- [ ] T031 [US1] Render Group Interface Editor in the sidebar when active (and allow cancel/confirm) in `/home/jwcarroll/dev/logic-gates/src/App.tsx`
- [ ] T032 [US1] Change “Group selected” button to open the interface editor (required step) in `/home/jwcarroll/dev/logic-gates/src/ui/components/Toolbar.tsx`
- [ ] T033 [US1] Update store grouping flow to: start draft → confirm → call `createGroup` → select new group → re-simulate in `/home/jwcarroll/dev/logic-gates/src/app/store/index.ts`
- [ ] T034 [US1] Update any existing call sites/tests that still use legacy `groupNodes()` signature in `/home/jwcarroll/dev/logic-gates/src/tests/core/grouping.test.ts`
- [ ] T035 [US1] Ensure import/export errors are user-understandable when legacy schemas are rejected in `/home/jwcarroll/dev/logic-gates/src/app/store/index.ts`

**Checkpoint**: User Story 1 works end-to-end; collapsed group exposes only chosen ports with names/order; core + UI + Playwright tests pass.

---

## Phase 4: User Story 2 - Use Grouped Circuits Without Internal Knowledge (Priority: P2)

**Goal**: A consumer can wire and simulate a collapsed group using only the exposed ports (no need to open/understand internal wiring).

**Independent Test**: Place an existing grouped circuit into a new circuit and wire it successfully using only exposed ports; simulation matches expected behavior. (Spec: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/spec.md`)

### Tests for User Story 2 (write first; ensure FAIL before implementation)

- [ ] T036 [P] [US2] Update Playwright grouping/compose flow to use the new interface editor and exposed ports only in `/home/jwcarroll/dev/logic-gates/src/tests/e2e/playwright/us2-group-compose.spec.ts`
- [ ] T037 [P] [US2] Add core regression test that collapsed groups never surface internal-only ports in `/home/jwcarroll/dev/logic-gates/src/tests/core/groupPortExposure.test.ts`

### Implementation for User Story 2

- [ ] T038 [US2] Update “Add half-adder subcircuit” to create a grouped half adder with named interface (`A`,`B`,`SUM`,`CARRY`) via `createGroup` in `/home/jwcarroll/dev/logic-gates/src/app/store/index.ts`
- [ ] T039 [US2] Ensure root canvas view shows only group-level handles for grouped circuits (no accidental child-node handles) in `/home/jwcarroll/dev/logic-gates/src/app/reactFlowAdapter.ts`

**Checkpoint**: User Story 2 works: consumers wire groups using exposed ports only; Playwright flow passes.

---

## Phase 5: User Story 3 - Evolve a Group’s External Interface Safely (Priority: P3)

**Goal**: Editing a group interface warns the user, disconnects all external wires on confirm, updates that group node, and is undoable.

**Independent Test**: Wire a group, edit the group interface, confirm all external wires are disconnected with clear feedback, then undo restores both interface and wires. (Spec: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/spec.md`)

### Tests for User Story 3 (write first; ensure FAIL before implementation)

- [ ] T040 [P] [US3] Add unit tests for core `updateGroupInterface` (disconnect-all; returns disconnected ids; validates interface incl. FR-006a Option A mapping convention) in `/home/jwcarroll/dev/logic-gates/src/tests/core/updateGroupInterface.test.ts`
- [ ] T041 [P] [US3] Add store test for undo/redo around interface edits (undo restores wires + interface) in `/home/jwcarroll/dev/logic-gates/src/tests/app/undoRedoGroupInterface.test.ts`
- [ ] T042 [P] [US3] Add RTL test for edit-interface warning copy and “rewiring required” feedback in `/home/jwcarroll/dev/logic-gates/src/tests/ui/groupInterfaceEditWarning.test.tsx`
- [ ] T043 [US3] Add Playwright flow: wire group → edit interface → confirm disconnect → undo restores in `/home/jwcarroll/dev/logic-gates/src/tests/e2e/playwright/us3-edit-group-interface.spec.ts`

### Implementation for User Story 3

- [ ] T044 [US3] Implement core `updateGroupInterface()` (validate; disconnect external wires; update interface/junctions; return disconnected ids) in `/home/jwcarroll/dev/logic-gates/src/core/commands.ts`
- [ ] T045 [US3] Add minimal undo/redo history stack for circuit mutations in `/home/jwcarroll/dev/logic-gates/src/app/store/history.ts`
- [ ] T046 [US3] Integrate history into store actions (at minimum: group create, connect/disconnect wire, update interface) in `/home/jwcarroll/dev/logic-gates/src/app/store/index.ts`
- [ ] T047 [US3] Add keyboard shortcuts for undo/redo (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z) in `/home/jwcarroll/dev/logic-gates/src/ui/WorkspaceShell.tsx`
- [ ] T048 [US3] Add “Undo”, “Redo”, and “Edit interface” actions to the toolbar when a group is selected in `/home/jwcarroll/dev/logic-gates/src/ui/components/Toolbar.tsx`
- [ ] T049 [US3] Extend Group Interface Editor to support edit mode (preload existing interface; show disconnect warning on confirm) in `/home/jwcarroll/dev/logic-gates/src/ui/components/GroupInterfaceEditor.tsx`
- [ ] T050 [US3] Ensure after interface edit the group remains selected and all external wires are removed from circuit state in `/home/jwcarroll/dev/logic-gates/src/app/store/index.ts`

**Checkpoint**: User Story 3 works: edit warns → disconnects all external wires → undo restores.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Align docs/contracts, tighten errors, and run full validation.

- [ ] T051 [P] Reconcile mapping convention docs with implementation (junction input/output mapping) in `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/contracts/group-interface.openapi.yaml`
- [ ] T052 [P] Update quickstart to match final UI labels and flows in `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/quickstart.md`
- [ ] T053 [P] Document v1.2 schema expectations and legacy rejection behavior in `/home/jwcarroll/dev/logic-gates/src/core/io/schema.ts`
- [ ] T054 Run full test suite and address any snapshot changes via scripts in `/home/jwcarroll/dev/logic-gates/package.json`
- [ ] T055 [P] Run ESLint and fix any new issues using config in `/home/jwcarroll/dev/logic-gates/eslint.config.js`

---

## Dependencies & Execution Order

### User Story Dependency Graph

```text
US1 (Create groups with explicit interface) ──┬──> US2 (Consume groups via exposed ports)
                                              └──> US3 (Edit interface safely + undo)
```

### Execution Order Summary

- Phase 1 → Phase 2 are strict prerequisites for everything.
- MVP is Phase 3 (US1) only.
- US2 and US3 can start after US1, and can proceed in parallel if staffed.

---

## Parallel Execution Examples (per story)

### US1

Parallel test authoring:
- T015, T016, T017, T018, T019, T020 can be done in parallel (separate files).

Parallel UI work after core types compile:
- T026 and T027 and T029 can be done in parallel (separate UI files).

### US2

- T036 and T037 can be done in parallel.

### US3

Parallel test authoring:
- T040, T041, T042 can be done in parallel (separate files).

Parallel implementation after `updateGroupInterface()` exists:
- T045 and T049 can be done in parallel (separate files).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) end-to-end with tests.
3. Stop and validate against `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/quickstart.md`.

### Incremental Delivery

1. US1 → validate (MVP)
2. US2 → validate consumer workflows
3. US3 → validate edit + disconnect + undo
