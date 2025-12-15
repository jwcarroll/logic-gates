# Quickstart: Delete Components

**Branch**: `001-delete-components`  
**Date**: December 15, 2025  

## Goal

Verify that users can delete selected items (nodes and wires) via keyboard and a visible UI affordance, and that deletion preserves circuit validity and supports undo.

## Run tests

From `/home/jwcarroll/dev/logic-gates`:

- Unit/component tests: `npm run test`
- Optional (if configured locally): `npm run test:e2e:pw`

## Manual verification (dev server)

From `/home/jwcarroll/dev/logic-gates`:

1. Start: `npm run dev`
2. In the workspace:
   - Place a switch and a gate and connect them with a wire.
   - Select the gate and press `Delete` (or `Backspace`).
   - Confirm the gate disappears and any connected wires are removed.
3. Select a wire and delete it:
   - Confirm only the wire is removed and nodes remain.
4. Multi-select a mix of nodes and wires and delete:
   - Confirm everything selected is removed and selection is cleared.
5. Undo/redo:
   - Confirm `Ctrl/Cmd+Z` restores deleted items and selection state.
   - Confirm `Ctrl/Cmd+Shift+Z` (or redo action) re-applies deletion.

## Expected behaviors (checklist)

- Deleting with nothing selected does nothing and does not error.
- Deleting a node removes all incident wires.
- Deleting a wire does not remove nodes.
- Deleting completes quickly for a moderate multi-selection (≥20 items).
