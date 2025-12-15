# Research: Delete Components

**Branch**: `001-delete-components`  
**Date**: December 15, 2025  
**Spec**: `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/spec.md`  
**Plan**: `/home/jwcarroll/dev/logic-gates/specs/001-delete-components/plan.md`  

## Decisions

### 1) Selection is store-owned (nodes + wires)

**Decision**: Persist selection in the app store as two lists: `selectedNodeIds` and `selectedWireIds`. The graph-rendering layer emits selection intent/events; it is not a source of truth.

**Rationale**:
- Keeps deletion, undo/redo, and grouping actions consistent and deterministic.
- Allows the UI to render selection from a single canonical state.

**Alternatives considered**:
- Keep selection state only inside the rendering layer: rejected because it undermines store/history as the source of truth and makes deletion harder to test deterministically.

### 2) Wire selection tracking uses rendering-layer events, then re-renders from store

**Decision**: Capture wire selection changes from the rendering adapter layer (e.g., selection-change events) and write them into the store, then re-render wires as selected based on `selectedWireIds`.

**Rationale**:
- Enables selecting wires in the editor and deleting them, without relying on internal rendering-layer state.

**Alternatives considered**:
- Add bespoke edge-click handlers only: rejected because it misses box-selection and multi-select flows and is harder to keep consistent with node selection.

### 3) Delete triggers: keyboard + visible UI affordance

**Decision**: Provide deletion via both keyboard (`Delete`, `Backspace`) and a visible affordance (button/menu item) enabled only when there is a selection.

**Rationale**:
- Keyboard supports fast iteration; visible control improves discoverability and accessibility.

**Alternatives considered**:
- Keyboard-only deletion: rejected because it is not discoverable and excludes some users.

### 4) Cascading deletion preserves validity

**Decision**: Deleting a node deletes all incident wires; deleting a wire deletes only that wire. Unknown ids are treated as no-ops.

**Rationale**:
- Prevents wires referencing missing endpoints.
- Makes deletion behavior predictable and safe when state changes between selection and delete.

**Alternatives considered**:
- Leave dangling wires: rejected because it violates graph invariants and creates confusing UI artifacts.

### 5) Group deletion is recursive (delete group + children)

**Decision**: If a group node is deleted, also delete all of its child nodes (including junction nodes) to avoid leaving orphaned nodes that are hidden by group scoping.

**Rationale**:
- Prevents “invisible” nodes that cannot be reached from the root view after the group node is removed.

**Alternatives considered**:
- Forbid deleting groups: rejected because groups are selectable and users reasonably expect delete to work; also increases UX friction.

### 6) Junction nodes are not directly user-deletable

**Decision**: Junction nodes are treated as internal grouping mechanics; they should not be directly selectable/deletable by users in normal editing workflows.

**Rationale**:
- Deleting junction nodes can break group interface semantics.

**Alternatives considered**:
- Allow deleting junctions and attempt to auto-repair group interface mappings: rejected as out-of-scope complexity for this feature.
