# Data Model - Workspace UI Polish

## Entities

### Workspace Canvas
- **Fields**: `viewportWidth` (number, px), `viewportHeight` (number, px), `pan` ({x:number,y:number}), `zoom` (number), `theme` ("light"|"dark"), `floatingControls` (array of `ControlAnchor`).
- **Constraints**: viewport sizes derive from shell; canvas must avoid scrollbars; pan/zoom constrained to graph extents.
- **Relationships**: renders `ElementSelection`, `WireState`, `GroupedCircuit` projections.

### ControlAnchor
- **Fields**: `id`, `position` ("top-left"|"top-right"|"bottom-left"|"bottom-right"), `offset` ({x:number,y:number}), `type` ("toolbar"|"menu"|"breadcrumb"|"status"), `visibility` (boolean).
- **Constraints**: Anchors avoid overlapping selected nodes when possible; responsive offsets at ≥1024px.

### ElementSelection
- **Fields**: `selectedNodes` (string[] ids), `selectedWires` (string[] ids), `selectedGroups` (string[] ids), `focusId` (string|null), `updatedAt` (timestamp).
- **Constraints**: High-contrast tokens applied; updates must apply within 100ms of change; multi-select allowed; focus distinguishes keyboard target.
- **State transitions**: `select(id,type)`, `multiSelect(ids,type)`, `clear()`, `focus(id)`.

### WireState
- **Fields**: `wireId`, `energized` (boolean), `direction` ("forward"|"reverse"|null), `intensity` (0-1), `updatedAt` (timestamp).
- **Constraints**: Derived from simulation output; resets when simulation stops or pauses; animations tied to `energized` true.
- **State transitions**: `updateFromSimulation(payload)`, `reset()`.

### GroupedCircuit
- **Fields**: `groupId`, `parentId`, `graph` (subgraph reference), `isOpen` (boolean), `breadcrumb` (array of ids/names), `status` ("live"|"paused"), `selection` (`ElementSelection` inside group).
- **Constraints**: Opening uses inline drill-in overlay; identifiers unchanged; edits sync back before close; status banner reflects simulation state.
- **State transitions**: `open(groupId)`, `close()`, `applyEdits(changeset)`, `syncToParent()`.

## Validation Rules
- Canvas size recalculated on viewport resize events; `zoom` must stay within configured bounds (e.g., 0.25–2.5).
- Selection must not violate graph invariants (no selecting nonexistent ids); group open/close must preserve parent layout.
- Wire animations run only when `energized` is true and simulation state is "running"; pause clears animation.
- Breadcrumb must always include parent when `isOpen` is true; `syncToParent()` must maintain schema versioning.
