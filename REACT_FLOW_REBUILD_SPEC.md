# React Flow Rebuild Specification (V2)

Authoritative design for rebuilding the Logic Gate Simulator in **React** using **React Flow**, with V2 choices guided by Ousterhout’s “A Philosophy of Software Design”: deep modules, narrow interfaces, information hiding, specification-first, and TDD.

## V2 Design Principles
- Deep modules, narrow interfaces: core graph/simulation API is small, general, and framework-agnostic.
- Separation of concerns: core logic independent of rendering; React Flow is an adapter, not the source of truth.
- Specification-driven: every module has written contracts (inputs/outputs/invariants/errors) before coding.
- TDD-first: core logic fully unit-tested; UI covered by component and e2e tests; fast test loop.
- Invariants explicit: graph validity (ports/wires), simulation convergence bounds, import/export schemas.
- Extensibility: plugin-friendly surfaces for nodes, commands, menus, and metadata.

## Goals & Scope
- Rebuild with React + React Flow; maintain feature parity with Solid app while enabling a Miro-like UX.
- Custom nodes: switch, gate, light, group; wires/edges follow current connection rules.
- Import/export compatibility (v1.0); allow forward-compatible metadata (v1.1).
- Real-time visual signals, selection states, and wire states; smooth pan/zoom/drag on desktop and touch.

## Project Structure & Tooling
- Toolchain: Vite + React + TypeScript + React Flow.
- State: Zustand (default) as app store; core remains framework-free.
- Tests: Vitest (unit/core + React Testing Library), Playwright (or Cypress) for e2e.
- Lint/format: ESLint (typescript-eslint, react-hooks), Prettier, EditorConfig. Strict TS.
- Directories:
  - `src/core/`: types, IDs, validation, graph ops, simulation, import/export (pure, no React).
  - `src/app/`: Zustand store, commands, selectors, persistence, RF adapter.
  - `src/ui/`: React components, React Flow node/edge renderers.
  - `src/design/`: tokens, themes, icons, canvas styles, primitives.
  - `src/tests/`: unit/integration; `e2e/`: Playwright specs/fixtures.

## Specification Artifacts (to author before coding)
- Core API spec: commands, queries, invariants, error semantics.
- Simulation spec: convergence rules, defaults for missing inputs, handling cycles.
- Import/export spec: schemas, validation errors, migrations (v1.0 → v1.1 metadata).
- UI interaction spec: gestures, selection precedence, keyboard shortcuts, touch behaviors, wire flows.
- Design system spec: tokens, components (button, toolbar, panel, context menu, toast, dropdown), canvas theming, port/wire states.
- Testing spec: coverage goals, fixtures, golden files, performance budgets.

## Architecture & Separation
- Core (pure):
  - Data types and ID generation.
  - Graph operations: add/remove/move nodes; connect/disconnect; group/ungroup; clone; validation.
  - Simulation engine: deterministic, iterative with max iterations.
  - Import/export + schema validation.
  - Command APIs return new circuit state and Result objects; no side effects.
- App layer:
  - Zustand store orchestrates commands, manages selection, viewport, pending wire.
  - React Flow adapter maps core graph ↔ React Flow nodes/edges; enforces invariants on connect.
- UI layer:
  - React components + React Flow renderers; design-system primitives.
  - Consumes derived view models; never mutates core directly.

## Functional Requirements
- **Canvas & Viewport**: Infinite pan/zoom (auto-expands as content approaches edge); background grid; optional snap-to-grid (off by default). Zoom: default 100%, min 2%, max 400%; smooth wheel/trackpad zoom; pointer-based panning; inertial pan optional. Grid: base 20px at 100% (faint), heavier lines every 80px; at 2% major boxes ~5120px. Movement increment scales with zoom (e.g., 5px at 400%).
- **Palette/Toolbar**: Add switch, gates (AND, OR, NOT, NAND, NOR, XOR, XNOR), light; group/ungroup; clone; import/export; zoom reset. Keyboard-focusable.
- **Placement & Dragging**: Drag from palette; drag existing nodes; wires update with movement. Disable node drag during multi-touch.
- **Selection**: Click selects; Ctrl/Cmd+click toggles multi-select; selected nodes highlighted. Escape clears selection and pending wire.
- **Wire Creation**: Output→input; pending edge preview; click wire to delete. Edge style toggle: bezier default, straight option (per-canvas).
- **Wire Constraints**: Output→input only; one wire per input; outputs fan-out; no self-loop; reject invalid attempts with feedback.
- **Simulation**: Run after any mutation (toggle, add/remove/move, connect/disconnect, group/ungroup/clone, import). Iterative, max 100 iterations. Switches seed map; gates evaluate; groups map through children; lights default false if disconnected.
- **Grouping**:
  - Create from selection: compute bounds; detect boundary wires; create group I/O ports; remap external wires; store child IDs.
  - Collapse/expand (double-click): collapsed hides children, shows label/ports; expanded shows children.
  - Ungroup: dissolve, restoring wiring to child ports.
  - Clone: duplicate node/group at offset; new IDs/ports; duplicate internal wires; external wires not copied except via group internals.
- **Keyboard Shortcuts**: Delete/Backspace removes selected nodes; Escape clears selection and pending wire.
- **Touch**: PointerEvents; single-finger drag nodes; two-finger pan; pinch-to-zoom; targets ≥44x44; disable node drag during multi-touch.
- **Import/Export**: JSON v1.0 `{ version: "1.0", circuit: { nodes, wires } }`; validate; on success replace state and recompute signals; on failure leave state unchanged with clear error. Support v1.1 metadata `{ name, createdAt }`.

## Intelligent Canvas & Design System
- Canvas: custom RF background grid, configurable zoom bounds, smooth interactions. Context menus for canvas/nodes/wires (delete, clone, group/ungroup, rename group).
- Port affordances: clear hit areas; hover/focus states; signal colors (on/off/unknown); pending-wire preview.
- Wires: custom edge renderer with signal coloring; hover actions; selection; bezier default, straight toggle for debug.
- Plugins/extensibility: hook points for custom node types, commands, context menu items, and import/export metadata.
- Design tokens: spacing, radii, colors with contrast targets, typography, z-layers (canvas, wires, nodes, overlays, menus). Store in `src/design/tokens.ts`.
- Components: button, icon button, segmented control, toolbar, panel, modal, toast, context menu, dropdown. Keyboard accessible.

## Data Model (React-Oriented)
- **GateType**: `'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR'`.
- **Port**: `{ id: string; nodeId: string; kind: 'input' | 'output'; index: number; position?: { x: number; y: number } }`.
- **Node (React Flow)**: `{ id, type, position: { x, y }, width, height, data }`.
  - Switch: `type: 'switch'`, `data: { state: boolean; outputPortId: string }`.
  - Gate: `type: 'gate'`, `data: { gateType: GateType; inputPortIds: string[]; outputPortId: string }`.
  - Light: `type: 'light'`, `data: { state: boolean; inputPortId: string }`.
  - Group: `type: 'group'`, `data: { label: string; childNodeIds: string[]; inputPortIds: string[]; outputPortIds: string[]; collapsed: boolean }`. Children hidden when collapsed.
- **Edge/Wire**: `{ id: string; source: string; target: string; sourceNode: string; targetNode: string }` where source/target are port IDs; include styling metadata.
- **UI State**: selection: `string[]`; pendingWire: `{ fromPortId?: string }`; viewport: `{ pan: { x, y }, zoom: number }`; activePointers for touch gestures.

## Commands (Core API Sketch)
- `addNode(node)`, `removeNode(nodeId)`, `moveNode(nodeId, delta)`.
- `connect(fromPortId, toPortId)` with validation; returns Result.
- `disconnect(wireId)`.
- `createGroup(label, nodeIds)`, `ungroup(groupId)`, `toggleGroup(groupId)`, `cloneNode(nodeId, offset)`.
- `importCircuit(json) -> Result<Circuit, Error[]>`; `exportCircuit(circuit) -> string`.
- `simulate(circuit) -> SimulationResult` (map of port outputs, light states).
- Commands are pure and return new circuit state plus structured errors.

## Port Positioning
- Switch: output on right edge, vertically centered.
- Light: input on left edge, vertically centered.
- Gate: inputs along left edge, spaced by `height / (n + 1) * (index + 1)`; output on right center.
- Group: collapsed inputs on left, outputs on right, evenly spaced; expanded aligns ports to group bounding box edges.

## Wire Validation Rules
1. Direction: output → input only.
2. Uniqueness: one wire per input.
3. Fan-out: outputs may connect to multiple inputs.
4. No self-loop: source nodeId !== target nodeId.
5. Reject invalid connections without mutating state.

## Signal Evaluation
- `nodeOutputs = Map<portId, boolean>`.
- Seed switches: `nodeOutputs[outputPortId] = switch.state`.
- Iterate (≤100):
  - Gates: gather input values (missing defaults false); evaluate:
    - AND: all true
    - OR: any true
    - NOT: !a
    - NAND: !(AND)
    - NOR: !(OR)
    - XOR: (sum(inputs) % 2) === 1
    - XNOR: !XOR
  - Groups: map group inputs into child graph, evaluate children, emit group outputs.
  - Track changes; stop when stable or limit hit.
- Lights: set from connected input wire, else false.
- Trigger after any graph mutation or switch toggle.

## UI/UX Requirements
- Rendering stack: React Flow edges are SVG; nodes are HTML/React components (can embed small SVG icons). Ports drawn as signal-colored handles/circles. No canvas requirement; vector edges keep crisp scaling.
- Wires reflect signal state; pending wire previews cursor line.
- Selection outline; hover highlights ports; invalid attempts give feedback.
- Group labels visible; collapsed shows ports/counts; double-click toggles collapse.
- Accessibility: focusable controls; adequate contrast; keyboard toggles for switches; context menus keyboard-operable.

## Menu & Command System
- Command registry: central typed registry for actions (add node, connect, delete, group, import/export, toggle snap, toggle edge style, zoom controls). UI invokes commands; commands delegate to core/app store mutations.
- Menu registry: data-driven menus for toolbar, canvas/global, and context menus. Renderers consume registry; contributions can register items with predicates (e.g., based on selection or node type).
- Extensibility: future plugins can add commands and menu items via registry hooks (app layer), without modifying core logic.

## Import/Export Specification
- **v1.0 shape**:
  - `nodes`: id/type/position/width/height + type data (ports, gateType, state, label, childNodeIds, collapsed).
  - `wires`: `{ id, fromPortId, toPortId }` (map to `source/target`).
- **Validation**: referenced ports exist; direction correct; no duplicate input wires; supported gate types; supported version.
- **Behavior**: on success set state, recompute ports, run simulation; on failure keep prior state and show error.
- **Export**: `version: "1.0"`; allow optional metadata `{ name, createdAt }` (v1.1).

## Touch & Pointer Handling
- PointerEvents.
- Single pointer: drag nodes.
- Two pointers: pan; pinch-to-zoom.
- Disable node drag during multi-touch; track active pointers.
- Targets ≥44x44.

## Keyboard & Mouse Interactions
- Delete/Backspace: remove selected nodes (and attached wires).
- Escape: clear selection and cancel pending wire.
- Click wire: deletes wire.
- Double-click group: collapse/expand.

## Testing Strategy
- Unit (Vitest): graph ops, validation, simulation truth tables, import/export round-trips, group/ungroup/clone rewiring.
- Component (RTL): node renderers, port states, pending wire preview, context menus.
- Integration (Playwright/Cypress): canvas interactions, grouping flows, import/export fixtures (half-adder), shortcuts, basic touch gestures (if supported).
- Golden fixtures: sample circuits for import/export and simulation outputs.
- Performance checks: propagation on dense graphs within target; responsive pan/zoom.

## Testing Checklist (Manual)
- Add switch/gate/light/group; drag to move; selection highlight works.
- Wire constraints enforced; invalid connects blocked; wire deletion works.
- Toggle switch updates gates/lights; gate truth tables hold; cycles stabilize within cap.
- Group: create from selection; external wires remapped; collapse/expand; ungroup restores wiring; clone duplicates internals with new IDs.
- Clone non-group node offsets position with new ports.
- Import valid file loads; invalid rejected with clear error; half-adder works.
- Touch: single drag moves node; two-finger pan; pinch zoom.
- Keyboard: Delete/Backspace removes selection; Escape clears selection/pending wire.
- Performance: large graphs stay responsive for pan/zoom/propagation.

## React Implementation Notes
- Use custom RF nodes for switch/gate/light/group; ports via `Handle` keyed by port IDs.
- `onConnect` enforces wire rules before adding edge; app store is source of truth; RF consumes derived graph.
- Simulation state in store, not components; rerun on graph mutations.
- Groups: do not render children when collapsed; expanded renders children and internal edges; external edges stay on group handles.

## Open Decisions (to lock pre-implementation)
- All above decisions locked: Zustand; bezier default with straight option; snap-to-grid optional with specified grid sizes; zoom bounds and infinite pan; menu/command registries for extensibility. No pending decisions.
