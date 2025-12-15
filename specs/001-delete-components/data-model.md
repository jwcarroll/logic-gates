# Data Model: Delete Components

**Branch**: `001-delete-components`  
**Date**: December 15, 2025  

## Core Entities (existing)

### Circuit

Represents the current editable circuit.

- **nodes**: list of `CircuitNode`
- **wires**: list of `Wire`

### CircuitNode

Represents a placeable item in the circuit graph.

- **id**: unique identifier
- **type**: one of `switch | gate | light | group | junction`
- **position**: `{ x, y }`
- **ports**: encoded in the node’s `data` shape (inputs/outputs depending on node kind)
- **group membership**: optional `groupId` to scope nodes inside a group

### Wire

Represents a connection between an output port and an input port.

- **id**: unique identifier
- **sourceNode / source**: source node id and source port id
- **targetNode / target**: target node id and target port id

## App State (store) changes for this feature

### SelectionState (derived for UI)

Selection used by the UI should include nodes, groups, and wires.

- **selectedNodes**: node ids that are not groups
- **selectedGroups**: node ids where node type is `group`
- **selectedWires**: wire ids
- **focusId**: first selected id (node/group), else null
- **updatedAt**: timestamp for selection-change performance instrumentation

### Store fields (source of truth)

Existing:

- **selectedNodeIds**: `string[]` — ids of selected nodes (including groups)
- **selectionUpdatedAt**: `number` — timestamp for selection updates

Add:

- **selectedWireIds**: `string[]` — ids of selected wires

### History snapshot (undo/redo)

Existing snapshots include:

- **circuit**
- **selectedNodeIds**
- **openGroupId**

For deletion to be safely undoable with selection restored, snapshots should also include:

- **selectedWireIds**

## Validation Rules (from requirements/invariants)

- Deleting a **node** implies deleting all incident wires (where `sourceNode` or `targetNode` matches).
- Deleting a **wire** deletes only that wire.
- The post-delete circuit has **no wires referencing missing endpoints**.
- If a **group node** is deleted, all of its **child nodes** are deleted as well to prevent orphaned hidden nodes.
- Unknown identifiers in a delete request are treated as no-ops (deterministic, no crash).
