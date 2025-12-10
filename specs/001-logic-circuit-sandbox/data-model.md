# Data Model - Sandbox Logic Circuit Builder

## Entities

### Circuit
- **Fields**: `id`, `name?`, `components[]`, `wires[]`, `metadata?`, `challengeTarget?`,
  `createdAt?`
- **Relationships**: Contains components and wires; may reference challenge goals.
- **Validation**: Must satisfy graph invariants (direction output→input, one wire per
  input, no self-loops); import/export schema v1.0 with optional v1.1 metadata.

### Component
- **Fields**: `id`, `type` (`switch` | `gate` | `light` | `group`), `position`, `size?`,
  `data` (type-specific attributes), `ports[]`
- **Ports**: `{ id, nodeId, kind: input|output, index, position? }`
- **Validation**: Ports unique per component; required ports present for type; positions may
  be optional (derived).

### Gate (Component subtype)
- **Fields**: `gateType` (`AND|OR|NOT|NAND|NOR|XOR|XNOR`), `inputPortIds[]`, `outputPortId`
- **Validation**: Inputs length matches gate type rules (NOT has 1, others ≥2); ports exist
  on component.

### Switch (Component subtype)
- **Fields**: `state` (boolean), `outputPortId`
- **Validation**: Output port exists; state defined.

### Light (Component subtype)
- **Fields**: `state` (boolean derived), `inputPortId`
- **Validation**: Input port exists.

### Group/Subcircuit
- **Fields**: `label`, `childNodeIds[]`, `inputPortIds[]`, `outputPortIds[]`, `collapsed`,
  `metadata?`
- **Validation**: Group ports map to child ports; collapsed state hides children but preserves
  wiring; clone regenerates IDs while preserving structure.

### Connection/Wire
- **Fields**: `id`, `sourcePortId`, `targetPortId`, `sourceNodeId`, `targetNodeId`,
  `metadata?`
- **Validation**: Must be output→input; target input not already used; source/target nodes
  exist; no self-loop.

### SimulationState
- **Fields**: `nodeOutputs: Map<portId, boolean>`, `iterations`, `converged`
- **Validation**: `iterations` ≤100; defaults false for missing inputs; error state if not
  converged by cap.

### Challenge
- **Fields**: `id`, `title`, `description`, `starterCircuit`, `targetCriteria` (expected
  outputs/behaviors), `hints?`
- **Validation**: Starter circuit valid; target criteria mappable to circuit outputs; does
  not mutate library when loaded.

## Relationships & State
- Circuit owns components and wires; group components reference child nodes and remapped
  ports.
- Wires connect ports; simulation reads graph and produces `SimulationState`.
- Challenges reference a starter circuit and evaluation criteria; user modifications create
  a working circuit instance.

## Derived/Computed Data
- Port positions for gates/groups computed from geometry.
- Simulation outputs recomputed after any graph mutation or toggle.
- Challenge completion derived by comparing current outputs to `targetCriteria`.

## Invariants (from constitution/spec)
- Output→input direction, one wire per input, no self-loops; invalid operations reject
  without mutation.
- Simulation deterministic with ≤100 iterations; missing inputs default false; non-converged
  cycles return bounded error state.
- Import/export uses v1.0 schema with optional v1.1 metadata; invalid imports leave state
  unchanged.
