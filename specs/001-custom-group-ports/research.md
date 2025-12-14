# Phase 0 Research: Custom Group Ports

This document captures decisions made from inspecting the existing codebase (no external research).

## Current Behavior (Observed)

- Grouping is created by `src/core/commands.ts` `groupNodes()`, which auto-creates group ports by:
  - Rewiring boundary-crossing wires to new group port ids.
  - Exposing any unconnected internal ports (so groups can act as templates).
- A `group` node stores `inputPortIds`, `outputPortIds`, and `portMap` in `src/core/types.ts`.
- Simulation treats group ports as aliases to internal ports via `portMap` (`src/core/simulation.ts`).
- UI has no per-port labels; ports are handles only (`src/ui/components/LogicNode.tsx`).
- “Grouping” in UI/store is a one-click action (no interface editor) (`src/app/store/index.ts`, `src/ui/components/Toolbar.tsx`).
- Import/export schema versioning exists (`src/core/io/schema.ts`) but currently validates only basic shape (version + nodes/wires array + wire endpoints).

## Decisions

### Decision: Introduce an explicit group interface model (ports with names + order)

- Decision: Add a dedicated `GroupInterface` structure on `GroupNode.data` that holds ordered exposed ports with user-defined names.
- Rationale: The feature requires naming and ordering and must stop “mirroring” internal ports; treating the interface as first-class avoids implicit behavior and keeps adapters simple.
- Alternatives considered:
  - Keep `inputPortIds`/`outputPortIds` as the sole interface and add a `labelsByPortId` map: simpler migration but keeps interface semantics implicit and makes validation harder to localize.
  - Infer interface from boundary wires only: fails the primary requirement (creator-controlled interface).

### Decision: Add an internal editable `junction` node type as the interface anchor

- Decision: Add a new pure-core node kind `junction` that acts as a pass-through/split point:
  - Single input port, single output port (fan-out is achieved by multiple wires from the output port, consistent with current validation rules).
  - Junction nodes live inside a group (have `groupId`) and are created for each exposed port by default.
- Rationale: The spec requires “hybrid: auto-create by default, but junctions remain editable as explicit nodes inside the group”. A junction node is a deep-module-friendly primitive that keeps wiring semantics explicit and testable.
- Alternatives considered:
  - Represent junctions as metadata-only “virtual ports”: keeps UI simpler but makes core simulation/validation more implicit and less debuggable.
  - Add multiple output ports per junction: unnecessary given current wire rules (outputs can already fan out).

### Decision: Preserve `portMap` but constrain its meaning

- Decision: Keep `GroupPortMap` as `groupPortId -> internalPortId`, but constrain internal ports to junction ports owned by the same group.
- Rationale: Existing simulation and grouping/ungrouping logic already relies on `portMap`; constraining the target to junction ports makes the interface stable and hides internal implementation details.
- Alternatives considered:
  - Remove `portMap` and compute mapping from `GroupInterface`: increases churn across core and tests and makes ungroup/clone harder.

### Decision: Interface edits always disconnect all external wires for the edited group node

- Decision: On any interface edit, remove all wires whose `sourceNode === groupId` or `targetNode === groupId` and regenerate group port ids.
- Rationale: Matches spec clarification (“Always disconnect all instance wires on any interface edit”) and avoids partial compatibility heuristics that would be fragile without explicit port identity rules today.
- Alternatives considered:
  - Attempt to keep compatible connections by name/order: adds complexity and risks silent mis-wiring; explicitly deferred by clarification.

### Decision: Require interface definition at group creation (UI flow), not as a post-step

- Decision: Change grouping UX so “Group selected” opens an interface definition step; only then does the store call the core command to create the group.
- Rationale: Matches spec clarification (“Required: user must define exposed ports before the group is created/saved”) and prevents creating invalid “half-groups” in state.
- Alternatives considered:
  - Create group immediately then force-edit: risks intermediate invalid state and complicates undo/redo semantics.

### Decision: Bump import/export schema version and hard-reject legacy group schemas

- Decision: Introduce a new schema version (e.g., `1.2`) that requires explicit group interfaces, and reject `1.0`/`1.1` imports with a clear error.
- Rationale: Directly matches spec clarification (“Hard-fail old schema loads”) and keeps codebase free of migration complexity for now.
- Alternatives considered:
  - Backward compatibility shim that infers interface from old `portMap`: explicitly out of scope per spec.

## Follow-on (Design Implications)

- Core validation must become stricter for group nodes:
  - Every exposed port maps to exactly one internal junction port.
  - No internal junction port is mapped by more than one exposed port.
  - Mapping direction compatibility (group inputs map to junction outputs; group outputs map to junction outputs or another explicitly defined convention) must be consistent and documented.
- UI must surface port naming and ordering; React Flow handles do not currently display names, so port labels likely require a custom renderer near handles.
