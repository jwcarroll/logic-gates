# Implementation Plan: Delete Components

**Branch**: `001-delete-components` | **Date**: December 15, 2025 | **Spec**: `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/spec.md`
**Input**: Feature specification from `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a delete action for selected items (gates, switches, lights, groups, and wires), accessible by keyboard and a visible UI affordance, that updates selection and preserves circuit validity. Implement deletion as a pure core command that removes selected items (with cascading wire deletion for removed nodes), and connect it to the app store (history/undo integration + re-simulation) and UI selection state.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.3  
**Primary Dependencies**: React 19.2 + React Flow 11.11 + Zustand 5.0 + Vite 7.2  
**Storage**: N/A (in-memory editor state)  
**Testing**: Vitest (jsdom) + React Testing Library; Playwright configured  
**Target Platform**: Web (modern desktop browsers)  
**Project Type**: Web application (single Vite SPA)  
**Performance Goals**: Selection and delete interactions feel instantaneous (no visible frame drops on typical circuits)  
**Constraints**: Core logic is pure and framework-agnostic; UI is an adapter; invalid operations must not mutate circuit state  
**Scale/Scope**: Interactive editing for typical circuits (~100 nodes / ~200 wires); deletion supports mixed multi-selection (≥20 items)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Deep modules, narrow interfaces: keep core graph/simulation APIs small, pure, and framework-agnostic.
- Separation of concerns: map work to `src/core` (pure), `src/app` (store/adapter), `src/ui` (React/React Flow).
- Specification-driven: list contracts/invariants/errors to author before coding; link relevant specs.
- TDD-first coverage: define tests to write first (Vitest core, RTL/e2e for UI) that must fail before implementation.
- Explicit invariants: plan validation for graph rules, simulation bounds (≤100 iterations), import/export schemas (v1.0 + v1.1 metadata).
- Extensibility: state how node/command/menu/metadata extension points are preserved or migrated.

**Gate status**: PASS — deletion is planned as a single pure core command; UI/store only translate selection + intent into core operations and render derived state; invariants are explicitly preserved and tested first.

## Project Structure

### Documentation (this feature)

```text
/home/jwcarroll/dev/logic-gates/specs/001-delete-components/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
src/
├── core/                # Pure circuit graph + simulation + commands
├── app/                 # Store/orchestration, adapters (React Flow), hooks
├── ui/                  # React components and workspace shell
└── tests/               # Vitest specs (core/unit/component/e2e scaffolding)
```

**Structure Decision**: Single Vite web app with clear layering (`src/core` pure commands; `src/app` store/adapters; `src/ui` React/React Flow rendering). Tests live under `src/tests`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations are required for this feature.

## Phase 0: Outline & Research

**Output**: `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/research.md`

### Key Decisions (resolved)

- **Selection source of truth**: The app store remains the source of truth for selected node ids and selected wire ids; the React Flow layer only emits selection intent/events into the store and renders selection based on store state.
- **Wire selection tracking**: Capture wire selection changes from the React Flow adapter layer and persist `selectedWireIds` in the app store, similar to existing `selectedNodeIds`.
- **Delete triggers**: Support both keyboard (`Delete` and `Backspace`) and a visible UI affordance (toolbar/menu/button) to delete the current selection.
- **Cascading deletion**: Deleting any node deletes all incident wires; deleting selected wires deletes only those wires.
- **Group deletion**: Deleting a group node deletes the group node and all child nodes (including junction nodes) to avoid orphaned hidden nodes.

### Alternatives Considered (and why rejected)

- Keeping selection purely inside React Flow: rejected because it makes the rendering layer a source of truth and complicates undo/history.
- Implementing deletion only in UI without a core command: rejected because it duplicates graph rules and risks invalid state.

## Phase 1: Design & Contracts

**Outputs**:

- `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/data-model.md`
- `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/contracts/`
- `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/quickstart.md`

### Core Design (src/core)

- Add a pure command `deleteSelection(circuit, input)` that:
  - Accepts node ids and wire ids to delete.
  - Computes the full set of node ids to delete (including group children when a group is deleted).
  - Removes all wires incident to deleted nodes, plus any explicitly selected wires.
  - Returns a new circuit and never mutates inputs.
  - Treats unknown ids as no-ops (deterministic, no crash).

### App Orchestration (src/app)

- Extend store state to include `selectedWireIds` and update history snapshots to include both node and wire selection.
- Add a store action `deleteSelection()` that:
  - Pushes history snapshot (for undo/redo), applies the core delete command, clears selection, and re-runs simulation.
  - Is safe when nothing is selected (no-op).

### UI (src/ui)

- Wire keyboard handling in the workspace shell to trigger delete on `Delete`/`Backspace` when the editor is active and focus is not in a typing target (input/textarea/select/contenteditable).
- Add a visible delete affordance that is enabled only when something is selected.

### Testing-first Plan

- Core unit tests for: deleting a node cascades wires; deleting a wire only removes that wire; deleting mixed selections; deleting a group deletes its children; unknown ids are no-ops.
- UI/component tests for: keyboard delete triggers store deletion; UI delete affordance triggers deletion; selection cleared after delete.

**Constitution re-check (post-design)**: PASS — design keeps deletion logic in `src/core` as pure command, with `src/app` bridging selection/history and `src/ui` emitting intent only.

## Phase 2: Implementation Planning (stop point)

This plan intentionally stops before creating `tasks.md`. Next step is to generate executable tasks via `/speckit.tasks` based on the design outputs above.
