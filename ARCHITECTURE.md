# Architecture Documentation

## Overview

The Logic Gate Simulator is a web-based application that allows users to create and simulate digital logic circuits. Built with SolidJS and TypeScript, it emphasizes reactive state management, SVG rendering, and touch-friendly interactions.

## Core Architecture

### State Management

The application uses a centralized store pattern with SolidJS's `createStore`:

```typescript
// src/store/circuitStore.ts
const [circuit, setCircuit] = createStore<Circuit>({
  nodes: [],
  wires: [],
});
```

**Store Structure:**
- `circuit`: Main circuit data (nodes and wires)
- `dragState`: Component dragging state
- `wireDrawState`: Wire drawing in progress
- `canvasState`: Pan and zoom transforms
- `selectedNodeId`: Currently selected component

**Why This Approach:**
- Single source of truth for all circuit data
- SolidJS fine-grained reactivity ensures efficient updates
- Functional API with methods like `addNode()`, `addWire()`
- Easy to serialize for import/export

### Data Models

#### Node Hierarchy

```typescript
interface BaseNode {
  id: string;
  position: Position;
  width: number;
  height: number;
}

type CircuitNode = SwitchNode | GateNode | LightNode;
```

**SwitchNode (Input)**
- Has: `state: boolean` (on/off), `outputPort: Port`
- Purpose: Primary circuit inputs controlled by user

**GateNode (Logic)**
- Has: `gateType: GateType`, `inputPorts: Port[]`, `outputPort: Port`
- Types: AND, OR, NOT, NAND, NOR, XOR, XNOR
- Purpose: Perform boolean logic operations

**LightNode (Output)**
- Has: `state: boolean` (on/off), `inputPort: Port`
- Purpose: Display circuit outputs

#### Ports

```typescript
interface Port {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  index: number;      // For gates with multiple inputs
  position: Position; // Calculated dynamically
}
```

Ports are connection points on nodes:
- Generated with unique IDs when nodes are created
- Position calculated in `getPortPosition()` based on node type and index
- Input ports: left side of node
- Output ports: right side of node

#### Wires

```typescript
interface Wire {
  id: string;
  fromPortId: string;
  toPortId: string;
  fromNodeId: string; // Cached for performance
  toNodeId: string;   // Cached for performance
}
```

Wire connection rules:
- Must connect output → input (not input → input)
- Input ports can have only ONE incoming wire
- Output ports can have MULTIPLE outgoing wires
- Cannot connect a node to itself

### Signal Propagation Algorithm

The circuit evaluation uses an iterative propagation algorithm:

```typescript
function propagateSignals() {
  const nodeOutputs = new Map<string, boolean>();

  // 1. Initialize with switch states
  for (const node of circuit.nodes) {
    if (node.type === 'switch') {
      nodeOutputs.set(node.outputPort.id, node.state);
    }
  }

  // 2. Iteratively propagate until stable (max 100 iterations)
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 100) {
    changed = false;
    for (const node of circuit.nodes) {
      if (node.type === 'gate') {
        // Get input values from connected wires
        const inputValues = node.inputPorts.map(port => {
          const wire = circuit.wires.find(w => w.toPortId === port.id);
          return wire ? (nodeOutputs.get(wire.fromPortId) ?? false) : false;
        });

        // Evaluate gate
        const output = evaluateGate(node.gateType, inputValues);

        // Update if changed
        if (nodeOutputs.get(node.outputPort.id) !== output) {
          nodeOutputs.set(node.outputPort.id, output);
          changed = true;
        }
      }
    }
    iterations++;
  }

  // 3. Update light states
  for (const node of circuit.nodes) {
    if (node.type === 'light') {
      const wire = circuit.wires.find(w => w.toPortId === node.inputPort.id);
      node.state = wire ? (nodeOutputs.get(wire.fromPortId) ?? false) : false;
    }
  }
}
```

**Why Iterative (Not Recursive):**
- Handles cycles gracefully (no stack overflow)
- Predictable performance
- Max iterations prevents infinite loops
- Simple to understand and debug

**When Called:**
- After toggling a switch
- After adding/removing a wire
- After removing a node
- After importing a circuit

### Component Architecture

#### Canvas Component (`src/components/Canvas.tsx`)

The main orchestrator component that:
- Renders the SVG canvas with grid pattern
- Manages pan/zoom transforms
- Handles all pointer events (mouse/touch)
- Coordinates wire drawing
- Delegates rendering to child components

**Key Responsibilities:**
1. **Interaction Management**
   - Pointer down/move/up for dragging
   - Multi-touch detection for pan/zoom
   - Click handling for selection

2. **Transform Management**
   - Pan: `translate(pan.x, pan.y)`
   - Zoom: `scale(zoom)`
   - Converts screen coords to SVG coords

3. **Wire Creation Flow**
   - Click port 1 → store in `wireStart` state
   - Click port 2 → call `addWire()`, clear `wireStart`
   - Render preview while drawing

#### Toolbar Component (`src/components/Toolbar.tsx`)

Collapsible sidebar with controls:
- Add buttons for switches, gates, lights
- Import/export buttons with file handling
- Delete selected and clear all
- Help section with instructions

**File Handling:**
- Export: Creates blob, triggers download
- Import: Hidden file input, reads as text, validates and loads

#### Node Components

**Switch.tsx**
- Renders rectangle with toggle state (green/gray)
- Click to toggle state
- Drag to move
- Output port on right

**Gate.tsx**
- Renders rectangle with gate type label
- Color-coded by type (blue for AND, red for OR, etc.)
- Input ports on left (1 or 2)
- Output port on right
- Drag to move

**Light.tsx**
- Renders circle (light bulb shape)
- Yellow when on, gray when off
- Input port on left
- Drag to move

**Wire.tsx**
- Renders Bezier curve between ports
- Color indicates signal state (green=on, gray=off)
- Click to delete
- Uses SVG path with quadratic curves

### Coordinate Systems

The application uses two coordinate systems:

**1. Screen Coordinates**
- Raw pixel coordinates from pointer events
- Relative to viewport

**2. SVG Coordinates**
- Logical coordinates in the SVG canvas
- Account for pan and zoom transforms

**Conversion Formula:**
```typescript
svgX = (screenX - rect.left - pan.x) / zoom
svgY = (screenY - rect.top - pan.y) / zoom
```

**Port Position Calculation:**
- Computed dynamically based on node position and type
- For gates: input ports evenly spaced on left edge
- Output ports: centered on right edge
- Lights: centered on left edge
- Switches: centered on right edge

### Touch Gesture Handling

Uses PointerEvents for universal input:

```typescript
interface ActivePointer {
  id: number;
  x: number;
  y: number;
}
```

**Gesture Detection:**
- Track all active pointers in array
- 1 pointer → drag component
- 2 pointers → pan canvas + pinch zoom

**Pinch-to-Zoom Algorithm:**
1. Calculate distance between two pointers
2. Compare to previous distance → zoom delta
3. Calculate midpoint → zoom center
4. Apply zoom around center point
5. Track midpoint movement → pan delta

**Conflict Prevention:**
- When 2+ pointers active, disable component dragging
- When releasing to <2 pointers, reset pinch state

### Import/Export System

#### Export Format

```json
{
  "version": "1.0",
  "circuit": {
    "nodes": [
      {
        "id": "node-123",
        "type": "gate",
        "gateType": "AND",
        "position": { "x": 100, "y": 100 },
        "width": 80,
        "height": 60,
        "inputPorts": [
          { "id": "port-1", "nodeId": "node-123", "type": "input", "index": 0, "position": {...} }
        ],
        "outputPort": { "id": "port-2", "nodeId": "node-123", "type": "output", "index": 0, "position": {...} }
      }
    ],
    "wires": [
      {
        "id": "wire-456",
        "fromPortId": "port-2",
        "toPortId": "port-3",
        "fromNodeId": "node-123",
        "toNodeId": "node-456"
      }
    ]
  }
}
```

**Version Field:**
- Allows future format changes
- Current version: "1.0"

#### Import Validation

Multi-stage validation process:

1. **Parse JSON**: Catch syntax errors
2. **Validate Structure**: Check `circuit.nodes` and `circuit.wires` arrays exist
3. **Validate Nodes**: Each node has required fields (id, type, position, ports)
4. **Validate Wires**: Each wire has required fields and references valid ports
5. **Load Circuit**: Replace current circuit with imported data
6. **Propagate Signals**: Compute initial state

**Error Handling:**
- Returns `{ success: false, error: "message" }` on failure
- Shows user-friendly alert with error message
- Does not modify circuit if validation fails

## Styling Architecture

### CSS Organization

All styles in `src/App.css`:

```css
/* Global resets and base styles */
body { ... }

/* Layout containers */
.app { ... }
.app-container { ... }
.canvas-container { ... }

/* Toolbar styles */
.toolbar { ... }
.toolbar-section { ... }
.toolbar-btn { ... }

/* Component-specific styles */
.gate { ... }
.gate-and { ... }
.gate-or { ... }
.switch { ... }
.light { ... }
.wire { ... }

/* State modifiers */
.selected { ... }
.active { ... }
.collapsed { ... }
```

**Naming Convention:**
- Component classes: `.component-name`
- Modifiers: `.component-name-modifier`
- States: `.state-name`

**Color Scheme:**
- Background: Dark (#1a1a1a)
- Grid: Very dark gray (#2a2a2a)
- Components: Varied by type
- Signals: Green (on), Gray (off)
- Selection: Yellow outline

### Responsive Design

**Mobile Optimizations:**
- Touch-friendly button sizes (min 44x44px)
- Collapsible toolbar to save space
- Viewport-relative component placement
- Pan/zoom for navigation on small screens

**Desktop Enhancements:**
- Keyboard shortcuts (Delete, Escape)
- Hover effects on buttons
- Precise mouse positioning

## Performance Considerations

### Reactivity Optimization

SolidJS provides fine-grained reactivity:
- Only affected components re-render
- No virtual DOM overhead
- Efficient array updates with `<For>`

### Rendering Optimization

**SVG Performance:**
- Components render as SVG primitives (fast)
- Transform group reduces layout calculations
- Bezier curves for smooth wires

**State Updates:**
- Batch updates using `produce()` from solid-js/store
- Single propagation pass per change
- Max iteration limit prevents runaway computation

### Memory Management

- Cleanup on component unmount (event listeners)
- Revoke object URLs after download
- Reset file input after import

## Error Handling

### User-Facing Errors

1. **Import Failures**
   - JSON parse errors
   - Invalid circuit structure
   - Missing required fields
   - User sees alert with description

2. **Export Failures**
   - Blob creation errors
   - Download trigger failures
   - User sees alert with error

3. **Circuit Errors**
   - Invalid wire connections (silently ignored)
   - Missing nodes (handled gracefully)
   - Signal propagation limits (max 100 iterations)

### Developer Experience

- TypeScript catches type errors at compile time
- Console warnings for debugging
- Clear function names and comments

## Testing Strategy

### Current Approach

Manual testing checklist:
- [ ] Add each gate type
- [ ] Connect gates with wires
- [ ] Toggle switches
- [ ] Verify light outputs
- [ ] Export circuit
- [ ] Import circuit
- [ ] Test on mobile device
- [ ] Test pan/zoom gestures
- [ ] Test keyboard shortcuts

### Future Testing

Potential additions:
- Unit tests for `evaluateGate()` logic
- Unit tests for signal propagation
- Component tests with Solid Testing Library
- E2E tests with Playwright
- Visual regression tests

## Deployment

### Build Process

1. TypeScript compilation (`tsc -b`)
2. Vite bundling (minification, code splitting)
3. Output to `dist/` directory

### GitHub Pages

- Deployed via GitHub Actions workflow
- Builds on push to main branch
- Serves static files from `dist/`

### Environment

- No backend required
- No API keys or secrets
- Fully client-side application

## Future Architecture Considerations

### Scalability

**Large Circuits:**
- Consider virtualization for 100+ components
- Optimize wire rendering (cull offscreen wires)
- Implement spatial indexing for collision detection

**Complex Features:**
- Undo/redo: Command pattern with history stack
- Subcircuits: Nested circuit data structure
- Collaboration: CRDT for real-time sync

### Extensibility

**Plugin System:**
- Custom gate types via registry
- External component libraries
- Import/export format plugins

**State Persistence:**
- LocalStorage for auto-save
- Cloud sync with user accounts
- Versioned file format for migrations

### Accessibility

**Potential Improvements:**
- Keyboard-only navigation
- Screen reader support (ARIA labels)
- High contrast mode
- Reduced motion mode

## Conclusion

The Logic Gate Simulator demonstrates:
- **Modern Web Architecture**: SolidJS + TypeScript + Vite
- **Reactive State Management**: Centralized store with fine-grained updates
- **Efficient Rendering**: SVG with smart transforms
- **Touch-First Design**: Multi-touch gestures for mobile
- **Data Portability**: JSON import/export

The architecture prioritizes simplicity, maintainability, and user experience while remaining extensible for future enhancements.
