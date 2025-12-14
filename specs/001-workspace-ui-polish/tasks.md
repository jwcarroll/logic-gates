# Tasks: Workspace UI Polish

**Input**: Design documents from `/specs/001-workspace-ui-polish/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: TDD-first. Each story includes tests written before implementation (Vitest/RTL for UI, Playwright for e2e).  
**Organization**: Tasks are grouped by user story to keep delivery increments independently testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure docs, fixtures, and tooling are ready for workspace polish work.

- [X] T001 Validate feature docs alignment across plan/spec/research in `specs/001-workspace-ui-polish/`
- [X] T002 Create workspace test fixtures for grouped circuits and energized wires in `src/tests/fixtures/workspace/`
- [X] T003 [P] Add Playwright project config for workspace viewport matrix in `playwright.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core layout, tokens, and selectors that all stories depend on.

**⚠️ CRITICAL**: Complete before any user story work.

- [X] T004 Establish full-bleed workspace shell grid (no scrollbars) in `src/App.tsx` and `src/index.css`
- [X] T005 [P] Add workspace design tokens for canvas, selection, energized wires, breadcrumbs in `src/design/tokens/workspace.ts`
- [X] T006 [P] Add workspace performance markers (<100ms interactions) utility in `src/app/perf/workspacePerformance.ts`
- [X] T007 Create shared selectors for canvas size, selection, wire state, and group view in `src/app/store/workspaceSelectors.ts`
- [X] T008 [P] Document invariants and adapter boundaries for workspace UI in `specs/001-workspace-ui-polish/spec.md#Architecture`

**Checkpoint**: Foundation ready — user stories can proceed in parallel.

---

## Phase 3: User Story 1 - Immersive Workspace Canvas (Priority: P1) 🎯 MVP

**Goal**: Canvas fills workspace with floating toolbars/menus that stay accessible during pan/zoom.

**Independent Test**: Launch app on desktop/tablet widths; canvas auto-resizes to viewport; floating controls stay reachable without covering selected nodes.

### Tests (write first)

 - [X] T009 [P] [US1] RTL layout test for full-bleed canvas & floating anchors (include anchor-overlap reposition: 12–24px shift, edge fallback) in `src/tests/ui/workspaceLayout.test.tsx`
 - [X] T010 [P] [US1] Playwright e2e for viewport resize/pan/zoom with anchored controls; capture fullscreen perception rating for SC-001a in `src/tests/e2e/workspace-layout.spec.ts`

### Implementation

- [X] T011 [P] [US1] Implement workspace shell container with floating chrome slots in `src/ui/WorkspaceShell.tsx`
 - [X] T012 [P] [US1] Implement reusable floating toolbar/menu components with anchor props and collision handling (12–24px shift, edge fallback) in `src/ui/components/FloatingToolbar.tsx`
- [X] T013 [US1] Integrate React Flow canvas into shell; remove frame scrollbars in `src/ui/WorkspaceCanvas.tsx`
- [X] T014 [US1] Add responsive offsets and min-width guard (≥1024px) for controls in `src/design/layout.css`

**Checkpoint**: User Story 1 independently testable.

---

## Phase 4: User Story 2 - Clear Interaction Feedback (Priority: P2)

**Goal**: High-contrast selection cues and energized wire styling that respond within 100ms.

**Independent Test**: Create circuit, toggle selections, run simulation; cues and energized styling appear immediately and remain legible at multiple zoom levels.

### Tests (write first)

 - [X] T015 [P] [US2] Selection style mapping tests (tokens + non-scaling stroke) in `src/tests/ui/selectionStyles.test.tsx`
 - [X] T016 [P] [US2] Energized wire styling tests with simulated direction/intensity in `src/tests/ui/energizedWireStyles.test.tsx`
 - [X] T017 [P] [US2] Playwright e2e for selection vs energized states across zoom levels (include recognition timing ≤2s) in `src/tests/e2e/selection-energized.spec.ts`

### Implementation

- [X] T018 [P] [US2] Extend design tokens for selection/energized variants (light/dark) documenting WCAG AA 4.5:1 targets and ≥3:1 zoom extremes in `src/design/tokens/workspace.ts`
- [X] T019 [US2] Implement selection style hook bridging store to React Flow elements in `src/app/hooks/useSelectionStyles.ts`
- [X] T020 [US2] Implement energized wire overlay/gradient animation component in `src/ui/components/EnergizedWireOverlay.tsx`
- [X] T021 [US2] Wire selection and energized styles into canvas render path with 100ms budget checks in `src/ui/WorkspaceCanvas.tsx`
- [X] T022 [US2] Add perf instrumentation (markers + throttling) for selection/energized updates in `src/app/perf/workspacePerformance.ts`

**Checkpoint**: User Story 2 independently testable.

---

## Phase 5: User Story 3 - Inspectable Grouped Circuits (Priority: P3)

**Goal**: Inline drill-in overlay with breadcrumb/back; edits persist to parent circuit without context loss.

**Independent Test**: Open grouped circuit, edit wiring inside overlay, return to parent; changes persist and navigation is clear.

### Tests (write first)

- [X] T023 [P] [US3] Component test for drill-in overlay + breadcrumb/back controls in `src/tests/ui/groupOverlay.test.tsx`
- [X] T024 [P] [US3] Core/store sync test for group open/close and changeset persistence in `src/tests/core/groupSync.test.ts`
 - [X] T025 [P] [US3] Playwright e2e for open-edit-exit flow with running simulation status; assert <20s completion for SC-004a in `src/tests/e2e/group-drill-in.spec.ts`

### Implementation

- [X] T026 [P] [US3] Implement inline drill-in overlay component with breadcrumb/back in `src/ui/components/GroupDrillInOverlay.tsx`
- [X] T027 [P] [US3] Implement group view hook for open/close, breadcrumb state, simulation status banner in `src/app/hooks/useGroupView.ts`
- [X] T028 [US3] Integrate overlay entry/exit with canvas + store sync of edits to parent graph in `src/ui/WorkspaceCanvas.tsx`
- [X] T029 [US3] Add simulation status banner component for live/paused indicator in `src/ui/components/GroupStatusBanner.tsx`

**Checkpoint**: User Story 3 independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

 - [X] T030 [P] Add visual regression snapshots for light/dark + zoom extremes with automated contrast check enforcing FR-007 ratios in `src/tests/ui/__snapshots__/workspace-visuals.spec.ts.snap`
- [X] T031 Profile pan/zoom/select/energized timings with npm script in `scripts/profile-workspace.mjs`
 - [X] T032 Update feature docs with final contracts, invariants, and decisions in `specs/001-workspace-ui-polish/spec.md` and `specs/001-workspace-ui-polish/plan.md`
 - [X] T033 [P] Add usability/telemetry validation for SC-001–SC-004a in `src/tests/e2e/workspace-usability.spec.ts` and log results to `specs/001-workspace-ui-polish/spec.md#Success-Criteria`

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → User Stories (P1 → P2 → P3) → Polish.
- User stories can run in parallel after Phase 2 if staffing allows; maintain story independence.
- Within each story: tests → tokens/hooks/models → components → integration → e2e.
- Shared file `src/ui/WorkspaceCanvas.tsx` is touched in US1, US2, US3; serialize changes or use feature branches to avoid conflicts.

### User Story Dependency Graph

- US1 (P1): depends on Phase 2; no other story dependency.
- US2 (P2): depends on Phase 2; can run parallel with US1 after canvas container exists.
- US3 (P3): depends on Phase 2; benefits from US1 shell and US2 styling but should remain independently testable.

### Parallel Execution Examples

- After Phase 2: T011 and T012 can run parallel; T019 and T020 can run parallel; T026 and T027 can run parallel.
- Tests marked [P] across stories can execute concurrently in CI once their fixtures are in place.

## Implementation Strategy

### MVP First (deliver US1)
1) Complete Phases 1–2  
2) Finish US1 (T009–T014)  
3) Validate e2e and layout tests, demo MVP

### Incremental Delivery
1) Ship US1 → demo  
2) Ship US2 → demo (selection + energized)  
3) Ship US3 → demo (drill-in overlay)  
4) Apply Phase 6 polish and profiling
