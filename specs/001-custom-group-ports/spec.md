# Feature Specification: Custom Group Ports

**Feature Branch**: `001-custom-group-ports`  
**Created**: 2025-12-14  
**Status**: Draft  
**Input**: User description: "I would like to simplify how input ports are managed in grouped circuits. At the moment if you create a group of gates like a half or full adder, the number of inputs is exactly mirrored in the resulting group. This limits the usefulness of creating grouped circuits because it means the end user has to understand internal wiring mechanics. I want to hide this implementation detail so the user creating a group can control how many ports are exposed externally when the group is collapsed. For instance, if a half adder is created, then only two input ports should be available. Again, the goal is to keep the ability to create and edit grouped circuits intuitive and useful to the group creator, while making hiding the implementation details to complex circuits to the consumer."

**Architecture Notes**: Core logic MUST stay pure and framework-agnostic; the visual editor is an adapter/view only; app state/orchestration mediates between core and UI.

## Clarifications

### Session 2025-12-14

- Q: When loading a grouped circuit created *before* custom group ports (i.e., it has no stored external interface / mappings), what should happen? → A: Hard-fail old schema loads
- Q: When a group’s external interface is edited, how should the system decide whether an existing wire stays connected to an exposed port? → A: Always disconnect all wires connected to that group on any interface edit (with a warning to the user)
- Q: How should the required interface-input/output junctions be created/managed when defining a group’s external interface? → A: Hybrid: auto-create by default, but junctions remain editable as explicit nodes inside the group
- Q: When creating a new group, should defining the external interface be required to finish group creation? → A: Required: user must define exposed ports before the group is created/saved

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define External Interface When Grouping (Priority: P1)

As a circuit author creating a grouped circuit (e.g., half adder, full adder), I can choose which ports are exposed on the collapsed group and hide internal-only ports, so the resulting group is usable without understanding the internal wiring.

**Why this priority**: This is the core value: grouped circuits become reusable “black boxes” with a clean interface.

**Independent Test**: Can be fully tested by creating a grouped circuit whose internal inputs/outputs exceed the intended external interface and verifying only the chosen ports appear on the collapsed group and function correctly.

**Acceptance Scenarios**:

1. **Given** a selection of gates that includes internal inputs/outputs beyond what should be exposed, **When** I create a group and define an external interface, **Then** the collapsed group shows only the ports I chose (with the chosen names and ordering).
2. **Given** a half adder circuit, **When** I create a group and set the external interface to exactly two inputs and two outputs, **Then** the collapsed group exposes exactly two input ports and two output ports and produces correct sum/carry behavior for all input combinations.

---

### User Story 2 - Use Grouped Circuits Without Internal Knowledge (Priority: P2)

As a circuit consumer using an existing grouped circuit, I can wire the collapsed group using only its exposed ports, without being forced to reason about internal wiring mechanics or extra internal ports.

**Why this priority**: This is the main benefit to reusability and sharing: consumers interact with an intentional interface, not a mirrored implementation detail.

**Independent Test**: Can be fully tested by inserting a grouped circuit into a new circuit and completing wiring using only the externally exposed ports to achieve expected outputs.

**Acceptance Scenarios**:

1. **Given** a grouped circuit with internal complexity, **When** I place it in a new circuit, **Then** I can complete wiring using only the exposed ports and the circuit simulates as expected.

---

### User Story 3 - Evolve a Group’s External Interface Safely (Priority: P3)

As a circuit author, I can change which ports are exposed on an existing grouped circuit, and the system warns me and disconnects all wires connected to that group on confirm, so interface changes are safe and explicit.

**Why this priority**: Grouped circuits should remain editable; authors need to refine interfaces without silently breaking downstream circuits.

**Independent Test**: Can be fully tested by wiring a grouped circuit, editing the group’s interface, confirming the warning, verifying all external wires to that group are removed, and verifying undo restores both the prior interface and all removed wires.

**Acceptance Scenarios**:

1. **Given** a circuit that uses a grouped circuit with wires connected to its exposed ports, **When** the group’s interface is edited in any way (including rename/reorder), **Then** all wires connected to that group are disconnected and the user is warned before confirming the edit.
2. **Given** a circuit that uses a grouped circuit, **When** the group’s interface edit is confirmed, **Then** the system disconnects all wires connected to that group and clearly communicates that rewiring is required (with undo support).

---

### Edge Cases

- Collapsing a group that has internal ports not mapped to the external interface.
- Attempting to map an exposed port to a non-junction internal port.
- Attempting to map an exposed input to a junction `inputPortId` (must map to junction `outputPortId`).
- Attempting to map an exposed output to a junction `outputPortId` (must map to junction `inputPortId`).
- Attempting to map multiple exposed ports to the same junction connection point.
- Removing an exposed port that is currently wired to the group.
- Editing a group interface (including rename/reorder) while wires are connected to the group (should warn and disconnect all wires after confirmation).
- Importing/exporting circuits with group interfaces.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a group creator to define the collapsed group’s external interface as an explicit, ordered set of **exposed ports** (inputs and outputs).
- **FR-001a**: Creating/saving a new group MUST require defining its external interface (at least one exposed port), and the group MUST NOT be created/saved until the interface is valid.
- **FR-002**: For each exposed port, the group creator MUST select exactly one **junction** connection point inside the group that the exposed port represents.
- **FR-003**: System MUST allow the group creator to set a user-facing name for each exposed port and MUST preserve port ordering as defined by the creator.
- **FR-004**: When a group is collapsed, the UI MUST display only the defined exposed ports (not a mirror of all internal ports).
- **FR-005**: System MUST treat internal ports that are not mapped to any exposed port as internal-only implementation details and MUST NOT surface them on the collapsed group.
- **FR-006**: System MUST validate group interfaces so that exposed inputs map only to **interface-input junctions** and exposed outputs map only to **interface-output junctions**.
- **FR-006a**: **Mapping convention (normative)**: Exposed **input** ports MUST map to a junction `outputPortId` (the junction output drives internal wiring), and exposed **output** ports MUST map to a junction `inputPortId` (the junction input reflects the internal wiring source). Any mapping to a non-junction port MUST be rejected.
- **FR-007**: System MUST prevent invalid group interfaces from being saved (e.g., missing mapping, wrong direction, duplicate mapping to the same internal port connection point).
- **FR-007a**: When defining or editing a group interface, the system MUST auto-create any required interface-input/interface-output junctions by default, and those junctions MUST remain explicit, editable nodes inside the group.
- **FR-008**: When a group interface changes, the system MUST update that **group node** to the new interface.
- **FR-009**: Before confirming a group interface change, the system MUST warn the user that all existing wires connected to that group will be disconnected.
- **FR-010**: After confirming a group interface change, the system MUST disconnect all existing wires connected to that group and MUST clearly communicate that rewiring is required.
- **FR-011**: Group interface changes MUST be reversible via the standard undo/redo behavior available to the user.
- **FR-012**: Exported and imported circuits MUST include group interface definitions (exposed ports, names, ordering, and mappings); importing/loading circuits from legacy schema versions MUST be rejected with a clear, user-understandable error (no migration/back-compat for now).

### Key Entities *(include if feature involves data)*

- **Grouped Circuit**: A reusable circuit definition composed of internal gates/wires plus an explicit external interface.
- **Exposed Port**: A user-facing port (input or output) on the collapsed grouped circuit, with a name, order, and a mapping to a specific internal port connection point.
- **Port Mapping**: The association between an exposed port and the internal port connection point it represents, including direction compatibility rules.
- **Junction**: A first-class connection point used to define a group’s external interface; junctions act like solder points/splitters (single inbound, fan-out to N).

## Architecture & Boundaries *(mandatory)*

- **Core surface**: Commands/queries with inputs/outputs (pure, deterministic, no view-layer-specific types)
- **Adapters**: How app state and the visual editor consume/translate core state; the visual editor is not a source of truth
- **Extension points**: Node/command/menu/metadata registries touched; migration needs if any change

## Contracts & Invariants *(mandatory for core logic)*

- **Graph validity**: Exposed port mappings must be directionally correct; every exposed port maps to exactly one internal port connection point; no internal port connection point is mapped by more than one exposed port.
- **Simulation bounds**: Collapsing/expanding a group must not change simulation results for a circuit, except where the user intentionally changed wiring or the group interface.
- **Import/export**: Circuit data includes versioned group interface definitions; legacy schema versions are rejected rather than migrated (for now); invalid mappings are reported as user-understandable validation errors.
- **Error semantics**: Interface validation failures must be reported in a structured way that adapters can present as actionable feedback (what is wrong, where, and how to fix).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A group creator can define a grouped circuit’s exposed interface (names, ordering, mappings) in under 60 seconds for a typical small circuit (≤10 internal gates).
- **SC-002**: For a half adder grouped circuit, the collapsed group exposes exactly 2 inputs and 2 outputs (as defined by the creator) and produces correct outputs for all 4 input combinations.
- **SC-003**: In a usability check with representative users, at least 90% can successfully wire and use a grouped circuit without opening/expanding it.
- **SC-004**: Reports/feedback about “extra” or “confusing” ports on grouped circuits decrease by at least 50% compared to the current behavior.

## Testing Strategy *(TDD-first, mandatory)*

- **Core**: Unit specs covering graph operations, interface validation, simulation truth tables, and import/export round-trips
- **UI**: Component tests for grouped-circuit editing and wiring; end-to-end coverage for primary interaction flows
- **Fixtures**: Golden circuits and schema samples; new behavior adds or updates fixtures before implementation

## Scope

### In Scope

- A group creator can explicitly define which ports are exposed on a collapsed grouped circuit.
- A grouped circuit consumer interacts only with exposed ports when the group is collapsed.
- Safe handling of interface evolution for existing groups (warn user; disconnect all wires connected to that group; undo support).
- Clear rejection (hard-fail) for legacy exported/imported circuit schema versions (no migration/back-compat for now).

### Out of Scope

- Changing the simulation semantics of existing gates beyond what is required to route signals through a defined group interface.
- Introducing user accounts, sharing, permissions, or publishing workflows for grouped circuits.
- Backwards compatibility or migration for legacy circuit schema versions (deferred until there are additional users / compatibility requirements).

## Assumptions

- Grouped circuits are intended to behave like reusable components with an intentional external interface.
- Hiding internal ports is achieved by defining an explicit external interface (rather than mirroring all internal ports by default).
- When a group interface changes, the group updates immediately; all wires connected to that group are disconnected after confirmation, with a clear warning and undo support.
