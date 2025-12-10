# Feature Specification: Sandbox Logic Circuit Builder

**Feature Branch**: `001-logic-circuit-sandbox`  
**Created**: 2025-12-09  
**Status**: Draft  
**Input**: User description: "To build a sandbox circuit builder canvas that allows for learning about logic gates. Allows the user to create both simple and complex circuits and combine them together to better understand how they work in a fun and interactive way."

**Architecture Notes**: Core logic MUST stay pure and framework-agnostic; React Flow is an
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

### User Story 1 - Build and observe simple circuits (Priority: P1)

Learners assemble basic gates, switches, and lights on a canvas to see how signals flow in
real time.

**Why this priority**: Core promise of the sandbox is instant feedback while exploring
logic behavior.

**Independent Test**: Build a two-input AND circuit with switches and a light; toggling
switches updates the light without errors or delays.

**Acceptance Scenarios**:

1. **Given** an empty canvas, **When** the user places switches, a gate, and a light then
   wires them validly, **Then** the circuit simulates immediately and the light reflects
   correct truth-table outputs.
2. **Given** a wired circuit, **When** the user toggles a switch, **Then** the visual
   signal states update within the sandbox and the light reflects the new output.

---

### User Story 2 - Compose reusable subcircuits (Priority: P2)

Learners combine multiple simple circuits into modular blocks to build more complex designs
and reuse them.

**Why this priority**: Composition enables exploring complex logic without rebuilding from
scratch and reinforces how pieces interact.

**Independent Test**: Group a half-adder subcircuit, reuse it twice, and wire outputs into
an indicator to verify composed behavior.

**Acceptance Scenarios**:

1. **Given** a selection of nodes and wires, **When** the user groups them into a reusable
   block with exposed inputs/outputs, **Then** the block can be placed elsewhere and behaves
   identically to the original selection.
2. **Given** a canvas containing grouped subcircuits, **When** the user connects outputs
   from one block to inputs of another, **Then** simulation propagates across blocks and
   outputs stay correct.

---

### User Story 3 - Explore guided learning challenges (Priority: P3)

Learners load example circuits or challenge prompts and adjust them to meet a target output
or behavior.

**Why this priority**: Curated challenges keep engagement high and demonstrate complex
circuits without overwhelming first-time users.

**Independent Test**: Load a sample challenge that expects a specific output pattern, make
an edit, and verify success criteria are checked within the sandbox.

**Acceptance Scenarios**:

1. **Given** a library of sample circuits, **When** the user opens a challenge and presses
   "Run", **Then** the circuit loads with an explanation and initial state ready to edit.
2. **Given** a challenge with a stated target (e.g., light blinks when inputs differ),
   **When** the user adjusts wiring and runs simulation, **Then** the sandbox reports
   completion when the observed outputs match the target behavior.
3. **Given** a challenge template, **When** the user loads it and edits the circuit,
   **Then** the original template remains unchanged and reloading restores the baseline.

### Edge Cases

- Invalid connections attempted (input→input, output→output, duplicate wire to same input)
  must be rejected with clear feedback and no state corruption.
- Cycles or oscillations should converge or halt within the simulation iteration cap,
  flagging unresolved states instead of freezing the UI.
- Large or dense circuits (dozens of nodes/wires) should remain navigable and simulate
  within defined bounds.
- Deleting or ungrouping components with external connections should preserve remaining
  valid wiring and report any dropped connections.
- Loading malformed or incompatible circuit files should leave the current workspace
  unchanged and surface errors.
- Non-converging cycles must halt within the ≤100-iteration cap, emit a bounded error state, and leave prior valid state intact.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Provide a canvas with a palette of logic components (switches, basic gates,
  lights) that can be placed, moved, and removed.
- **FR-002**: Allow users to wire components with connection rules enforced
  (output→input, one wire per input, no self-loops) and give immediate feedback on invalid
  attempts.
- **FR-003**: Run deterministic simulation automatically after edits or toggles, updating visual signal states and outputs within ≤50 ms of a toggle (and within the 60 fps render budget) for supported circuit sizes.
  visual signal states and outputs in real time.
- **FR-004**: Enable grouping of selected components into reusable subcircuits with defined
  external inputs/outputs and the ability to place multiple instances.
- **FR-005**: Support composing subcircuits with base components so signals propagate across
  all connections without manual recalculation.
- **FR-006**: Provide a library of starter/example circuits and challenges that users can
  load, duplicate, and modify without altering the originals.
- **FR-007**: Offer import/export of circuits in a documented schema so users can save work
  and reload it accurately.
- **FR-008**: Surface clear success/goal indicators for challenges (e.g., target outputs or
  behaviors) and signal when goals are met.
- **FR-009**: Starter circuits loadable from a curated library must be duplicable without mutating the original templates.
### Key Entities *(include if feature involves data)*

- **Circuit**: Collection of components, wires, and simulation state representing the
  current workspace.
- **Component**: Individual element such as switch, gate, light with ports for signals.
- **Subcircuit/Module**: Grouped set of components exposed as a reusable block with input
  and output ports mapped to its internal nodes.
- **Connection/Wire**: Directed link from an output port to an input port, carrying signal
  state.
- **Challenge**: Saved circuit plus goals/targets presented for learners to edit and
  complete.

## Assumptions & Dependencies

- Single-user, browser-based sandbox; no real-time collaboration required for this scope.
- Circuits persist through import/export of the documented schema; no backend storage is
  assumed for this iteration.
- Challenge library is curated content provided with the app; authoring new challenges is
  out of scope.
- Performance targets apply to circuits up to the stated test size (dozens of nodes/wires).

## Architecture & Boundaries *(mandatory)*

- **Core surface**: Commands/queries with inputs/outputs (pure, deterministic, no React/React Flow types)
- **Adapters**: How `src/app` and React Flow consume/translate core state; React Flow not a source of truth
- **Extension points**: Node/command/menu/metadata registries touched; migration needs if any change

## Contracts & Invariants *(mandatory for core logic)*

- **Graph validity**: Direction (output→input), one wire per input, no self-loops; invalid
  attempts reject without mutating state and surface a specific message.
- **Simulation bounds**: Deterministic evaluation with a hard cap of ≤100 iterations; missing
  inputs default to false; cycles that do not converge by the cap return a bounded error
  state.
- **Import/export**: Schema versions v1.0 plus optional v1.1 metadata; on invalid data the
  workspace remains unchanged and returns validation errors.
- **Error semantics**: Commands return structured results distinguishing validation errors,
  convergence failures, and success; adapters must not mask or reorder errors.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: First-time learners can build and verify a two-input gate circuit in under
  3 minutes without assistance.
- **SC-002**: Users can compose at least two reusable subcircuits into a larger circuit and
  observe correct outputs within 10 minutes of start.
- **SC-003**: Challenge completion rate of at least 80% for provided starter challenges, measured over a scripted run set of ≥10 attempts per challenge via in-sandbox success indicators.
- **SC-004**: Visual signal updates and output indicators render at least 60 fps (≤16 ms per
  frame) on the `perf-latency-30x50.json` circuit fixture measured via automated perf tests.
- **SC-005**: Importing and exporting a circuit preserves all connections, groupings, and
  signals with 0% data loss across a round trip.

## Testing Strategy *(TDD-first, mandatory)*

- **Core**: Unit specs covering wiring validation rules, simulation truth tables, grouping/
  ungrouping effects, and import/export round-trips for sample circuits and challenges.
- **UI**: Component tests for canvas interactions (drag/drop, selection, grouping), visual
  signal rendering, and challenge status indicators; e2e flows for building basic circuits
  and completing a challenge.
- **Fixtures**: Golden circuits for simple gates, half-adder/subcircuit reuse, and challenge
  scenarios; schema samples for import/export with and without metadata; perf fixtures for
  60 fps target circuits.
- **Negative-path imports**: malformed/invalid schemas leave workspace unchanged and surface structured errors.
- Round-trip import/export tests verify 0% data loss across golden fixtures.
- Cycle/oscillation fixtures assert bounded error at ≤100 iterations.
- Timing harness for US1/US2 flows records completion under stated time goals.
