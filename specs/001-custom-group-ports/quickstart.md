# Quickstart: Custom Group Ports

This quickstart explains how the *feature is intended to behave* once implemented.

## Local setup

- Install: `npm install`
- Run dev: `npm run dev`
- Run tests: `npm run test`

## Primary flows

### Create a group with a custom interface (required)

1. Build a small circuit (e.g., half adder) with internal wiring.
2. Select the nodes to group.
3. Click “Group selected”.
4. In the interface editor:
   - Add/remove exposed inputs/outputs.
   - Name ports (e.g., `A`, `B`, `SUM`, `CARRY`) and order them.
   - Map each exposed port to an internal port on the selected nodes (e.g., a gate input/output).
     (The core will auto-create internal `junction` nodes to anchor the interface.)
5. Confirm to create the group.

Expected result:

- The collapsed group exposes only the chosen ports (count + order + names).
- Simulation results match the ungrouped circuit for equivalent wiring.

### Edit a group’s external interface (disconnect behavior)

1. Select a group that already has wires connected to its exposed ports.
2. Open “Edit interface”.
3. Make any interface change (rename/reorder/add/remove/remap).
4. Click “Update interface”, then confirm the warning that existing connections will be removed.

Expected result:

- All external wires connected to that group’s exposed ports are disconnected.
- Undo (Ctrl/Cmd+Z) restores the previous interface and wiring.

## Import/export behavior

- Exports include explicit group interface definitions and port mappings.
- Imports reject legacy circuit schema versions that do not have explicit group interfaces (no migration/back-compat for now).

## Design contracts

- Core command contracts: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/contracts/core-commands.openapi.yaml`
- Circuit export schema: `/home/jwcarroll/dev/logic-gates/specs/001-custom-group-ports/contracts/circuit-v1.2.schema.json`
