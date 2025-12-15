---

description: "Executable task list for feature implementation"
---

# Tasks: Delete Components

**Input**: Design documents from `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/`
**Prerequisites**: `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/plan.md`, `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/spec.md`

**Tests**: TDD-first (mandatory per spec). Every story includes tests written before implementation (Vitest for core/store, Testing Library for UI; optional Playwright smoke if desired).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline, tools, and feature context before coding.

- [X] T001 Confirm feature scope/invariants from `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/plan.md` and `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/spec.md`
- [X] T002 Run baseline checks (`npm run lint` + `npm run test`) and record any failures relevant to this feature in `specs/001-delete-components/checklists/baseline.md`
- [X] T003 Review deletion contracts and intended I/O shapes in `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/contracts/openapi.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared wiring that MUST be complete before any user story work (store owns selection for both nodes and wires).

**⚠️ CRITICAL**: No user story work should start until this phase is complete.

- [X] T004 Add `selectedWireIds` to the app store and wire it through reset, undo/redo, and history snapshot building in `src/app/store/index.ts`
- [X] T005 Extend history snapshot types to include `selectedWireIds` in `src/app/store/history.ts` (depends on T004)
- [X] T006 Update selection selector to surface wire selection from store in `src/app/store/workspaceSelectors.ts` (depends on T004)
- [X] T007 Synchronize React Flow edge selection into the store and render selected edges from store (implement edge selection handlers + set `edge.selected`) in `src/ui/components/Canvas.tsx` (depends on T004, T006)
- [X] T008 Add store-level test coverage for selection state including wires in `src/tests/app/selectionSelectors.test.ts` (depends on T004, T006)

**Checkpoint**: Store selection is the source of truth for nodes + wires; undo/redo snapshots restore both.

---

## Phase 3: User Story 1 - Delete Selected Items (Priority: P1) 🎯 MVP

**Goal**: As a user, I can delete the currently selected item(s) via keyboard and a visible UI affordance.

**Independent Test**: Place a gate and wire, select each, delete via keyboard and via button, confirm items disappear and selection clears (see `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/quickstart.md`).

### Tests (write FIRST; ensure failing) ⚠️

- [X] T009 [P] [US1] Add core unit tests for deleting a single selected node and a single selected wire in `src/tests/core/deleteSelection.test.ts`
- [X] T010 [P] [US1] Add store tests for `deleteSelection()` applying core command, re-simulating, and clearing selection in `src/tests/app/deleteSelection.test.ts`
- [X] T011 [P] [US1] Add UI hotkey test for Delete/Backspace triggering deletion (and ignoring text inputs) in `src/tests/ui/deleteHotkeys.test.tsx`
- [X] T012 [P] [US1] Add UI feedback test asserting deleted items are no longer rendered and selection UI updates (e.g., selection indicator clears) in `src/tests/ui/deleteFeedback.test.tsx`

### Implementation

- [X] T013 [US1] Implement pure core command `deleteSelection(circuit, { nodeIds, wireIds })` returning `{ circuit, deleted }` in `src/core/commands.ts`
- [X] T014 [US1] Implement store action `deleteSelection()` (push history, call core, clear selection, re-simulate, no-op when empty) in `src/app/store/index.ts` (depends on T013)
- [X] T015 [US1] Wire Delete/Backspace keyboard handling to store `deleteSelection()` when focus is not in a typing target (input/textarea/select/contenteditable) in `src/ui/WorkspaceShell.tsx` (depends on T014)
- [X] T016 [US1] Add visible Delete button (disabled when nothing selected) to `src/ui/components/Toolbar.tsx` (depends on T014)

**Checkpoint**: US1 works end-to-end via keyboard + button; deletion is immediate and deterministic.

### Parallel example (US1)

- T009 + T010 + T011 can run in parallel (different files).
- After T013 lands, T014 can proceed; after T014, T015 and T016 can proceed in parallel.

---

## Phase 4: User Story 2 - Delete Multiple Items (Priority: P2)

**Goal**: As a user, I can delete a mixed multi-selection (nodes + wires) in one action.

**Independent Test**: Multi-select a mix of gates/switches/lights and wires, delete once, verify all selected items are removed and selection clears.

### Tests (write FIRST; ensure failing) ⚠️

- [X] T017 [P] [US2] Extend core deletion tests to cover mixed multi-selection and de-duplication of overlapping deletes in `src/tests/core/deleteSelection.test.ts`
- [X] T018 [P] [US2] Extend store deletion tests to cover mixed multi-selection clearing both `selectedNodeIds` and `selectedWireIds` in `src/tests/app/deleteSelection.test.ts`

### Implementation

- [X] T019 [US2] Ensure multi-selection events (Shift+click/box selection) update both node and wire selection consistently in `src/ui/components/Canvas.tsx` (depends on T007)

**Checkpoint**: Multi-delete works reliably for mixed selections, and selection always clears.

### Parallel example (US2)

- T017 and T018 can run in parallel (different files).
- T019 can proceed once foundational selection sync is stable (T007).

---

## Phase 5: User Story 3 - Safe, Predictable Deletion (Priority: P3)

**Goal**: Deletion preserves circuit validity and behaves predictably (cascading wire deletion, group deletion recursion, unknown ids as no-ops, undo support).

**Independent Test**: Delete a connected node and verify all incident wires are removed; delete a group and verify its children are removed; undo restores circuit + selection.

### Tests (write FIRST; ensure failing) ⚠️

- [X] T020 [P] [US3] Add core invariants tests (cascade incident wires; group recursive delete; unknown ids no-op; no dangling endpoints) in `src/tests/core/deleteSelection.test.ts`
- [X] T021 [P] [US3] Add store undo/redo tests restoring `selectedWireIds` and deleted items in `src/tests/app/deleteSelectionUndoRedo.test.ts`
- [X] T022 [P] [US3] Add UI test for deleting while connecting/dragging (interaction cancels; no stuck UI state) in `src/tests/ui/deleteDuringInteraction.test.tsx`
- [X] T023 [P] [US3] Add vitest e2e-style scenario covering delete + undo journey in `src/tests/e2e/us3-delete-components.test.ts`

### Implementation

- [X] T024 [US3] Implement group recursive deletion via `GroupNode.data.childNodeIds` and keep deletion deterministic for unknown ids in `src/core/commands.ts` (depends on T013)
- [X] T025 [US3] Ensure node deletion always removes all incident wires (and never leaves wires referencing missing endpoints) in `src/core/commands.ts` (depends on T013)
- [X] T026 [US3] Prevent junction nodes from being directly selectable/deletable in the UI adapter (set `selectable: false` for junctions) in `src/app/reactFlowAdapter.ts`
- [X] T027 [US3] Ensure delete action cancels any active React Flow connect/drag interaction (no stuck “connecting” state) in `src/ui/components/Canvas.tsx` (depends on T007, T014)
- [X] T028 [US3] Harden store deletion to clear stale selection ids (deleted/unknown) after applying core command in `src/app/store/index.ts` (depends on T014)

**Checkpoint**: Deletion cannot leave invalid wires; group deletion is recursive; undo/redo restores circuit + selection (nodes + wires).

### Parallel example (US3)

- T020 + T021 + T022 + T023 can run in parallel (different files).
- T024, T025, and T026 can proceed in parallel after T013 (different files).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality, docs, and validation across all stories.

- [X] T029 [P] Run `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/quickstart.md` manual verification steps and note any gaps in `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/tasks.md` (covered via automated tests; optional manual dev-server run remains)
- [X] T030 [P] Measure delete latency against SC-001/SC-002 (record timings and circuit size used) in `specs/001-delete-components/checklists/perf.md`
- [X] T031 [P] Reconcile contracts with implementation (update `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/contracts/openapi.yaml` only if shapes diverged)
- [X] T032 [P] Final regression pass: `npm run lint` and `npm run test` (see scripts in `package.json`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1; BLOCKS all user stories.
- **User Stories (Phase 3–5)**: Depend on Phase 2; proceed in priority order for MVP delivery.
- **Polish (Phase 6)**: After desired stories are complete.

### User Story Dependency Graph

```text
Phase 2 (Foundational)
  └─ US1 (P1): Delete current selection
       ├─ US2 (P2): Delete multiple items
       └─ US3 (P3): Safe/predictable deletion + undo
```

### Parallel Opportunities (Summary)

- US1 tests: T009, T010, T011, T012 can run in parallel; then T015 and T016 can run in parallel.
- US3 tests: T020, T021, T022, T023 can run in parallel; core/UI hardening tasks can proceed in parallel after T013.

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 → Phase 2
2. Phase 3 (US1): tests → core → store → UI
3. Stop and validate via `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/quickstart.md`

### Incremental Delivery

1. US1 (keyboard + button delete) → validate
2. US2 (multi-delete reliability) → validate
3. US3 (cascades, group recursion, unknown ids, undo) → validate
