# Data Model: Custom Group Ports

This document describes the intended data model additions/changes needed to support explicit external interfaces for grouped circuits.

## Core Entities

### `Circuit`

- Fields
  - `id?: string`
  - `nodes: CircuitNode[]`
  - `wires: Wire[]`
  - `metadata?: CircuitMetadata`
- Invariants
  - All `Wire.sourceNode`/`Wire.targetNode` reference existing node ids.
  - All `Wire.source`/`Wire.target` reference ports that belong to the referenced nodes.

### `Wire`

- Fields
  - `id: string`
  - `source: string` (port id)
  - `target: string` (port id)
  - `sourceNode: string` (node id)
  - `targetNode: string` (node id)
- Invariants (existing)
  - Output → input only
  - One wire per input (no fan-in)
  - No self-loops

### `JunctionNode` (new)

Represents an explicit, editable connection point used to anchor a group interface.

- Node kind: `junction`
- Fields (node)
  - `id: string`
  - `type: 'junction'`
  - `position: {x,y}`, `width`, `height`
  - `groupId?: string` (expected to be set for interface junctions)
- Fields (data)
  - `label?: string` (optional, UI convenience)
  - `inputPortId: string`
  - `outputPortId: string`
- Behavior (simulation intent)
  - Output equals resolved input value (buffer).
  - Fan-out is permitted by attaching multiple wires to `outputPortId`.

### `GroupNode` (updated)

A container that owns child nodes and exposes an explicit interface when collapsed.

- Fields (node)
  - `id: string`
  - `type: 'group'`
  - `position: {x,y}`, `width`, `height`
- Fields (data)
  - `label: string`
  - `childNodeIds: string[]` (internal nodes owned by this group)
  - `collapsed: boolean`
  - `interface: GroupInterface` (new, required in new schema)
  - `portMap: GroupPortMap`
    - `inputs: Record<groupPortId, internalPortId>`
    - `outputs: Record<groupPortId, internalPortId>`
- Relationships
  - Each exposed group port maps to an internal junction port owned by a `JunctionNode` within the group.

### `GroupInterface` (new)

Defines the ports the creator wants to expose externally.

- Fields
  - `inputs: ExposedPort[]` (ordered)
  - `outputs: ExposedPort[]` (ordered)
- Invariants
  - Port ids are unique within the group.
  - Ordering is preserved by array order.

### `ExposedPort` (new)

- Fields
  - `id: string` (group port id; used by wires as handle ids)
  - `kind: 'input' | 'output'`
  - `name: string` (user-defined label)
  - `mapsToInternalPortId: string` (must refer to a junction port inside this group)
- Validation rules (from requirements)
  - Direction compatibility is enforced (inputs map to an internal junction output that drives internal wiring; outputs map to an internal junction output that reflects internal wiring).
  - No internal port is mapped by more than one exposed port.

## State Transitions

### Create Group (required interface)

1. User selects nodes + defines external interface (names/order/mappings).
2. Core command creates:
   - New `GroupNode` with `interface` and `portMap`.
   - New `JunctionNode`s as needed (default) and internal wires to connect the junctions to existing internal ports.
3. All selected child nodes receive `groupId = <newGroupId>`.

### Edit Group Interface (disconnect behavior)

1. User edits interface (add/remove/reorder/rename/remap).
2. UI warns that all existing external wires on that group will be disconnected.
3. Core command:
   - Removes all wires that connect outside ↔ group (any wire with `sourceNode === groupId` or `targetNode === groupId`).
   - Replaces `interface` and regenerates `portMap` and junctions as needed.
4. UI undo/redo treats the operation as a single reversible action.

## Import/Export Schema Impact

- A new circuit schema version must require `GroupNode.data.interface` and related invariants.
- Legacy versions without explicit interface support must be rejected with a clear, user-understandable error.
