# Feature Specification: Delete Components

**Feature Branch**: `001-delete-components`  
**Created**: December 15, 2025  
**Status**: Draft  
**Input**: User description: "I need the ability to delete components. Right now I can select gates, switches, lights, and wires, but I have no way to delete them."

**Architecture Notes**: Core logic MUST stay pure and framework-agnostic; the graph-rendering layer is an
adapter/view only; store/orchestration mediates between core and UI.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Delete Selected Items (Priority: P1)

As a user building a circuit, I can delete the currently selected items so I can quickly fix mistakes and iterate.

**Why this priority**: Without deletion, mistakes are permanent and users must restart their work.

**Independent Test**: Can be fully tested by placing a gate and wire, selecting them, deleting, and verifying they are removed from the canvas and circuit state.

**Acceptance Scenarios**:

1. **Given** a circuit with at least one gate, **When** the user selects the gate and performs the delete action, **Then** the gate is removed from the circuit and is no longer visible on the canvas.
2. **Given** a circuit with at least one wire, **When** the user selects the wire and performs the delete action, **Then** the wire is removed from the circuit and is no longer visible on the canvas.

---

### User Story 2 - Delete Multiple Items (Priority: P2)

As a user, I can delete multiple selected items in one action so I can clean up a region of the circuit efficiently.

**Why this priority**: Circuits often involve groups of gates and wires; deleting one-by-one is slow and frustrating.

**Independent Test**: Can be fully tested by multi-selecting a mix of gates, switches, lights, and wires and deleting them in one step.

**Acceptance Scenarios**:

1. **Given** multiple selected items on the canvas, **When** the user performs the delete action, **Then** all selected items are removed and the selection is cleared.

---

### User Story 3 - Safe, Predictable Deletion (Priority: P3)

As a user, I can confidently delete items without leaving the circuit in a broken or confusing state.

**Why this priority**: Deleting nodes and wires can have cascading effects; behavior must be understandable and keep the circuit valid.

**Independent Test**: Can be fully tested by deleting a node that has wires attached and verifying all affected wires are also removed and no “dangling” connections remain.

**Acceptance Scenarios**:

1. **Given** a gate with one or more connected wires, **When** the user deletes the gate, **Then** all wires connected to that gate are also removed.
2. **Given** a group that contains one or more child nodes, **When** the user deletes the group, **Then** the group and all of its child nodes are removed and no hidden/orphaned nodes remain.

---

### Edge Cases

- Deleting when nothing is selected results in no changes and no errors.
- Deleting a selection that includes both a node and some of its connected wires deletes everything once (no errors from double-removal).
- Deleting a node removes all incident wires (incoming and outgoing), leaving no wires that reference missing endpoints.
- Deleting a wire that is the only input connection to a gate input leaves that input unconnected and the circuit remains valid.
- Deleting while an item is being dragged/connected ends the interaction and removes the item(s) cleanly.
- Deleting a very large selection completes without the app becoming unresponsive.
- Deleting a group deletes the group and all of its child nodes (including junction nodes), and removes any incident wires so no hidden/orphaned nodes remain.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to delete selected items (gates, switches, lights, groups, and wires).
- **FR-002**: The delete action MUST be available via standard keyboard shortcuts (`Delete` and `Backspace`) when the editor is active and focus is not in a text input (input/textarea/select/contenteditable).
- **FR-003**: The delete action MUST be available via a visible, non-keyboard interaction (e.g., a button or menu item) so it is discoverable and accessible.
- **FR-004**: When deleting a node-type item (gate/switch/light/group), the system MUST also delete all wires connected to that item.
- **FR-005**: When deleting one or more wires, the system MUST remove only those wires and MUST NOT delete any nodes unless they are also selected.
- **FR-006**: Deleting multiple selected items MUST remove all selected items in a single user action.
- **FR-007**: If nothing is selected, performing the delete action MUST make no changes and MUST NOT display an error.
- **FR-008**: After deletion, the selection state MUST be updated so it does not reference deleted items.
- **FR-009**: Deletion MUST preserve circuit validity invariants (no wires referencing missing endpoints; no duplicate wires created as a side effect).
- **FR-010**: Deletion MUST provide clear user feedback that the action occurred (the deleted items are no longer visible immediately after the action completes).
- **FR-011**: The system SHOULD allow users to reverse an accidental deletion via an undo capability if the product provides undo/redo for other edit actions.

### Assumptions

- The editor is single-user and local; there are no permission roles affecting deletion.
- “Delete components” includes nodes (gates/switches/lights/groups) and wires currently supported by selection.
- Deleting a node removes its connected wires, rather than leaving disconnected wire fragments.

### Key Entities *(include if feature involves data)*

- **Circuit**: The user’s current design consisting of nodes (components) and wires (connections).
- **Component (Node)**: A placeable circuit item such as a gate, switch, or light; has ports for connections.
- **Wire (Connection)**: A link between an output port and an input port.
- **Selection**: The current set of items the user has selected for editing (including deletion).
- **Delete Action**: The user-triggered operation that removes items from the circuit and updates related state.

## Architecture & Boundaries *(mandatory)*

- **Core surface**: A single “delete selection” command that accepts a circuit state plus selected item identifiers and returns an updated circuit state (pure, deterministic, no view-library types).
- **Adapters**: The UI layer translates the user’s selection and delete intent into the core delete command; the visual graph view reflects the resulting circuit state (the view is not a source of truth).
- **Extension points**: Adding new node types in the future must automatically participate in deletion (including removal of incident wires) without requiring bespoke delete logic per node type.

## Contracts & Invariants *(mandatory for core logic)*

- **Graph validity**: After deletion, no wire may reference a missing node/port; the remaining circuit continues to satisfy existing connection rules (e.g., directionality and any “one wire per input” constraints).
- **Deletion semantics**: Deleting a node implies deleting all wires incident to its ports; deleting a wire affects only that wire.
- **Simulation stability**: Deletion does not cause simulation to crash; the simulator treats removed items as absent and continues to evaluate the remaining circuit within existing convergence bounds.
- **Import/export compatibility**: If a circuit is exported after deletions, it represents only the remaining items and loads successfully via the existing import behavior.
- **Error semantics**: Deleting items that do not exist in the current circuit state results in a no-op for those identifiers (no crash), while preserving determinism.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can delete a selected single item in under 2 seconds without leaving the editor workflow.
- **SC-002**: Users can delete a mixed multi-selection (≥20 items including nodes and wires) in under 5 seconds without the editor becoming unresponsive.
- **SC-003**: In usability testing, at least 90% of participants successfully delete a selected item on their first attempt (without assistance).
- **SC-004**: Reported user issues requesting “how do I delete items?” decrease after release (measured via support tickets/feedback tags over a 30-day period).

## Testing Strategy *(TDD-first, mandatory)*

- **Core**: Unit specs for deleting nodes, deleting wires, deleting mixed selections, and preserving graph invariants (including cascading wire deletion).
- **UI**: Component tests that validate the delete affordance(s) trigger deletion for selected nodes/wires and that selection state updates correctly.
- **End-to-end**: Flows that create a small circuit, delete items, and verify the remaining circuit simulates and renders as expected.
- **Fixtures**: Circuit samples that include connected subgraphs for deletion scenarios and regression coverage.
