# AGENTS.md - AI Assistant Guide for Logic Gate Simulator

> **Purpose**: This document provides comprehensive context for AI assistants (like Claude) working with this codebase. It explains the architecture, development workflows, key conventions, and common tasks to enable effective AI-assisted development.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start for AI Assistants](#quick-start-for-ai-assistants)
3. [Technology Stack](#technology-stack)
4. [Codebase Structure](#codebase-structure)
5. [Core Architecture Patterns](#core-architecture-patterns)
6. [Development Workflows](#development-workflows)
7. [Key Conventions](#key-conventions)
8. [Common Tasks & Patterns](#common-tasks--patterns)
9. [Recent Features & Context](#recent-features--context)
10. [Testing Guidelines](#testing-guidelines)
11. [Deployment](#deployment)
12. [AI Assistant Best Practices](#ai-assistant-best-practices)

---

## Project Overview

The **Logic Gate Simulator** is an interactive web application for creating and simulating digital logic circuits. Users can add switches (inputs), logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR), and lights (outputs), connect them with wires, and watch signals propagate in real-time.

### Key Characteristics

- **Framework**: SolidJS (fine-grained reactive framework, NOT React)
- **Type Safety**: TypeScript with strict mode enabled
- **Graphics**: Pure SVG rendering (no canvas, no external graphics libraries)
- **State Management**: Custom reactive store using SolidJS primitives
- **Dependencies**: Minimal - only SolidJS runtime (no UI libraries, state libs, etc.)
- **Deployment**: Static site on GitHub Pages via CI/CD
- **Platform Support**: Desktop (mouse/keyboard) + Mobile (touch gestures, pan/zoom)

### Core User Features

1. **Circuit Building**: Drag-and-drop components onto canvas
2. **Wire Connections**: Click-to-connect between component ports
3. **Signal Simulation**: Real-time logic evaluation and propagation
4. **Import/Export**: Save/load circuits as JSON files
5. **Component Grouping**: Create reusable sub-circuits from selected components
6. **Touch Support**: Pan, zoom, and interact on mobile devices
7. **Multi-Selection**: Select multiple components (Ctrl/Cmd + click) for grouping/deletion

---

## Quick Start for AI Assistants

### Essential Files to Read First

When approaching any task, familiarize yourself with:

1. **`/src/types/circuit.ts`** (82 lines) - All TypeScript type definitions
2. **`/src/store/circuitStore.ts`** (749 lines) - Core state and logic
3. **`/src/components/Canvas.tsx`** (551 lines) - Main interaction handler
4. **`/ARCHITECTURE.md`** (535 lines) - Detailed technical documentation

### Development Commands

```bash
npm install          # Install dependencies
npm run dev         # Start dev server at localhost:5173
npm run build       # Production build (tsc + vite build)
npm run preview     # Preview production build
```

### Common AI Assistant Tasks

| Task | Primary Files | Key Functions |
|------|--------------|---------------|
| Add new gate type | `types/circuit.ts`, `store/circuitStore.ts`, `components/Toolbar.tsx` | `evaluateGate()`, gateTypes array |
| Fix rendering issue | `components/Canvas.tsx`, `components/[Component].tsx` | Component render functions |
| Add new node type | `types/circuit.ts`, `store/circuitStore.ts`, `components/` | `createNode()`, add component file |
| Modify state logic | `store/circuitStore.ts` | Store methods, `propagateSignals()` |
| Update UI/styling | `App.css`, component files | CSS classes, SVG attributes |
| Fix import/export | `store/circuitStore.ts` | `importCircuit()`, `exportCircuit()` |

---

## Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "solid-js": "^1.9.10"  // ONLY runtime dependency
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "vite": "^7.2.4",
    "vite-plugin-solid": "^2.11.10",
    "@types/node": "^24.10.1"
  }
}
```

### Why SolidJS?

**Critical Understanding for AI Assistants:**

- SolidJS is **NOT React** - different reactivity model
- **Fine-grained reactivity**: Updates specific DOM nodes, not components
- **No Virtual DOM**: Direct DOM updates for performance
- **Signals and Stores**: `createStore()` returns reactive proxies
- **JSX Compilation**: Compiles to real DOM operations

**Key Differences from React:**

| Concept | React | SolidJS |
|---------|-------|---------|
| Component re-runs | On every state change | Only once (setup phase) |
| State updates | `useState()` | `createStore()`, `createSignal()` |
| Effects | `useEffect()` | `createEffect()` |
| Refs | `useRef()` | Direct variables or `ref` prop |
| Conditionals | `{condition && <Component />}` | `<Show when={condition}>` |
| Lists | `{arr.map(item => ...)}` | `<For each={arr}>` |

### Build Tools

- **Vite**: Next-gen bundler with HMR (Hot Module Replacement)
- **TypeScript**: Strict mode with all type checking enabled
- **GitHub Actions**: Automated deployment to GitHub Pages

---

## Codebase Structure

```
logic-gates/
├── src/
│   ├── components/          # 8 SolidJS UI components
│   │   ├── Canvas.tsx       # Main orchestrator (551 lines) - handles all interactions
│   │   ├── Toolbar.tsx      # Sidebar controls (138+ lines)
│   │   ├── Switch.tsx       # Input component (104 lines)
│   │   ├── Light.tsx        # Output component (98 lines)
│   │   ├── Gate.tsx         # Logic gate component (159 lines)
│   │   ├── Group.tsx        # Grouping component (138 lines) - NEW
│   │   └── Wire.tsx         # Connection component (85 lines)
│   ├── store/
│   │   └── circuitStore.ts  # State management (749 lines) - CORE LOGIC
│   ├── types/
│   │   └── circuit.ts       # TypeScript definitions (82 lines)
│   ├── utils/
│   │   └── helpers.ts       # Utility functions (8 lines)
│   ├── App.tsx              # Root component (18 lines)
│   ├── App.css              # All styles (global)
│   ├── index.tsx            # Entry point (8 lines)
│   └── index.css            # Base CSS reset
├── public/                  # Static assets
├── .github/workflows/       # CI/CD configuration
│   └── deploy.yml           # GitHub Pages deployment
├── half-adder-example.json  # Example circuit file
├── README.md                # User documentation
├── ARCHITECTURE.md          # Technical documentation
├── .cursorrules             # Development guidelines
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Build configuration
└── index.html               # HTML entry point
```

### File Responsibilities

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| **types/circuit.ts** | 82 | Type definitions | `CircuitNode`, `GateType`, `Wire`, `Port` |
| **store/circuitStore.ts** | 749 | State & logic | `circuitStore`, all mutation methods |
| **components/Canvas.tsx** | 551 | Main UI orchestrator | `Canvas` component |
| **components/Toolbar.tsx** | 138+ | Control panel | `Toolbar` component |
| **components/Gate.tsx** | 159 | Gate rendering | `Gate` component |
| **components/Group.tsx** | 138 | Group rendering | `Group` component |
| **components/Switch.tsx** | 104 | Switch rendering | `Switch` component |
| **components/Light.tsx** | 98 | Light rendering | `Light` component |
| **components/Wire.tsx** | 85 | Wire rendering | `Wire` component |

---

## Core Architecture Patterns

### 1. State Management (Singleton Store Pattern)

**Location**: `src/store/circuitStore.ts`

```typescript
// Pattern: Single exported store instance
function createCircuitStore() {
  // Multiple reactive stores
  const [circuit, setCircuit] = createStore<Circuit>({ nodes: [], wires: [] });
  const [dragState, setDragState] = createStore<DragState>({ ... });
  const [canvasState, setCanvasState] = createStore<CanvasState>({ ... });
  const [selectedNodeIds, setSelectedNodeIds] = createStore({ ids: [] });

  // Methods that mutate state
  const addNode = (node: CircuitNode) => { ... };
  const removeNode = (nodeId: string) => { ... };
  const propagateSignals = () => { ... };

  // Return public API
  return { circuit, dragState, canvasState, selectedNodeIds, addNode, removeNode, ... };
}

export const circuitStore = createCircuitStore();
```

**Key Points for AI Assistants:**

- All state lives in this ONE store
- Import and use: `import { circuitStore } from '../store/circuitStore'`
- Always use methods to mutate state (e.g., `circuitStore.addNode()`)
- NEVER mutate `circuit.nodes` or `circuit.wires` directly
- Use `produce()` from solid-js/store for complex nested updates

### 2. Node Type System (Discriminated Unions)

**Location**: `src/types/circuit.ts`

```typescript
// Base interface
interface BaseNode {
  id: string;
  type: string;  // Discriminator
  position: Position;
  width: number;
  height: number;
}

// Specific node types
interface SwitchNode extends BaseNode {
  type: 'switch';
  state: boolean;
  outputPort: Port;
}

interface GateNode extends BaseNode {
  type: 'gate';
  gateType: GateType;
  inputPorts: Port[];
  outputPort: Port;
}

interface LightNode extends BaseNode {
  type: 'light';
  state: boolean;
  inputPort: Port;
}

interface GroupNode extends BaseNode {
  type: 'group';
  label: string;
  childNodeIds: string[];
  inputPorts: Port[];
  outputPorts: Port[];
  collapsed: boolean;
}

// Discriminated union
type CircuitNode = SwitchNode | GateNode | LightNode | GroupNode;
```

**Type-Safe Pattern Matching:**

```typescript
function handleNode(node: CircuitNode) {
  switch (node.type) {
    case 'switch':
      // TypeScript knows: node.state, node.outputPort available
      break;
    case 'gate':
      // TypeScript knows: node.gateType, node.inputPorts available
      break;
    case 'light':
      // TypeScript knows: node.state, node.inputPort available
      break;
    case 'group':
      // TypeScript knows: node.label, node.childNodeIds available
      break;
  }
}
```

### 3. Signal Propagation Algorithm

**Location**: `src/store/circuitStore.ts` - `propagateSignals()` function

**Algorithm**: Iterative (NOT recursive) evaluation with max 100 iterations

```typescript
function propagateSignals() {
  const nodeOutputs = new Map<string, boolean>();

  // Step 1: Initialize with switch states (primary inputs)
  for (const node of circuit.nodes) {
    if (node.type === 'switch') {
      nodeOutputs.set(node.outputPort.id, node.state);
    }
  }

  // Step 2: Iteratively propagate signals through gates
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 100) {
    changed = false;
    for (const node of circuit.nodes) {
      if (node.type === 'gate') {
        const inputValues = getInputValues(node, nodeOutputs);
        const output = evaluateGate(node.gateType, inputValues);
        if (nodeOutputs.get(node.outputPort.id) !== output) {
          nodeOutputs.set(node.outputPort.id, output);
          changed = true;
        }
      } else if (node.type === 'group') {
        // Evaluate groups similarly
      }
    }
    iterations++;
  }

  // Step 3: Update light states based on final outputs
  for (const node of circuit.nodes) {
    if (node.type === 'light') {
      const wire = circuit.wires.find(w => w.toPortId === node.inputPort.id);
      node.state = wire ? (nodeOutputs.get(wire.fromPortId) ?? false) : false;
    }
  }
}
```

**When to Call:**

- After toggling a switch
- After adding/removing a wire
- After adding/removing a node
- After importing a circuit
- After ungrouping components

**Why Iterative:**

- Handles cycles gracefully (no stack overflow)
- Predictable performance (max iterations cap)
- Easy to debug and understand

### 4. Port Position Calculation

**Location**: `src/store/circuitStore.ts` - `getPortPosition()` function

Ports are positioned dynamically based on:
- Node type (switch, gate, light, group)
- Node position
- Port index (for multi-input gates)

```typescript
function getPortPosition(port: Port): Position {
  const node = circuit.nodes.find(n => n.id === port.nodeId);

  if (node.type === 'switch') {
    return { x: node.position.x + node.width, y: node.position.y + node.height / 2 };
  }

  if (node.type === 'gate') {
    if (port.type === 'input') {
      const spacing = node.height / (node.inputPorts.length + 1);
      return { x: node.position.x, y: node.position.y + spacing * (port.index + 1) };
    } else {
      return { x: node.position.x + node.width, y: node.position.y + node.height / 2 };
    }
  }

  // ... similar for light and group
}
```

### 5. Coordinate Systems

**Two Coordinate Systems:**

1. **Screen Coordinates**: Raw pixel coords from pointer events (relative to viewport)
2. **SVG Coordinates**: Logical coords in the SVG canvas (accounting for pan/zoom)

**Conversion Function** (`src/components/Canvas.tsx`):

```typescript
const getSvgPoint = (e: PointerEvent): Position => {
  const rect = svgRef.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom,
    y: (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom
  };
};
```

**When to Use:**

- Converting mouse/touch events to canvas positions
- Placing new components
- Hit-testing for selection

### 6. Component Grouping System (New Feature)

**Location**: `src/store/circuitStore.ts` - `createGroupFromSelected()` function

**Purpose**: Allow users to combine multiple components into a reusable group

**Algorithm:**

1. Calculate bounding box of selected nodes
2. Find wires crossing the boundary (external connections)
3. Create input/output ports on group for each external wire
4. Remap external wires to connect to group ports instead
5. Store child node IDs inside group
6. Support collapse/expand and ungroup operations

**Key Functions:**

- `createGroupFromSelected(label: string): string | null`
- `ungroupNode(groupId: string): void`
- `toggleGroupCollapse(groupId: string): void`
- `cloneGroup(groupId: string, position: Position): void`

---

## Development Workflows

### Adding a New Logic Gate Type

**Files to Modify:**

1. `src/types/circuit.ts` - Add to `GateType` union
2. `src/store/circuitStore.ts` - Add logic to `evaluateGate()`
3. `src/components/Toolbar.tsx` - Add to `gateTypes` array
4. `src/App.css` - Add styling (`.gate-NEWTYPE`)

**Example: Adding IMPLY gate**

```typescript
// 1. types/circuit.ts
export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'IMPLY';

// 2. store/circuitStore.ts - evaluateGate()
function evaluateGate(gateType: GateType, inputs: boolean[]): boolean {
  switch (gateType) {
    // ... existing cases
    case 'IMPLY':
      return !inputs[0] || inputs[1];  // A → B ≡ ¬A ∨ B
    default:
      return false;
  }
}

// 3. components/Toolbar.tsx - gateTypes array
const gateTypes: GateType[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'IMPLY'];

// 4. App.css
.gate-imply {
  fill: #9333ea;  /* Purple */
}
```

### Adding a New Node Type

**Steps:**

1. Define interface in `types/circuit.ts` extending `BaseNode`
2. Add to `CircuitNode` union type
3. Create factory function in `store/circuitStore.ts`
4. Create component file in `components/`
5. Update `Canvas.tsx` to render new type
6. Update `importCircuit()` validation if needed

**Example: Adding Buffer Component**

```typescript
// 1. types/circuit.ts
interface BufferNode extends BaseNode {
  type: 'buffer';
  inputPort: Port;
  outputPort: Port;
  delay?: number;  // Optional delay in ms
}

type CircuitNode = SwitchNode | GateNode | LightNode | GroupNode | BufferNode;

// 2. store/circuitStore.ts
function createBuffer(position: Position): BufferNode {
  const id = generateId('buffer');
  return {
    id,
    type: 'buffer',
    position,
    width: 60,
    height: 40,
    inputPort: { id: generateId('port'), nodeId: id, type: 'input', index: 0, position },
    outputPort: { id: generateId('port'), nodeId: id, type: 'output', index: 0, position },
    delay: 0
  };
}

// 3. components/Buffer.tsx
export const Buffer: Component<BufferProps> = (props) => {
  return (
    <g transform={`translate(${props.node.position.x}, ${props.node.position.y})`}>
      <polygon
        points="0,0 60,20 0,40"
        fill="#10b981"
        stroke="#fff"
      />
      {/* Add ports */}
    </g>
  );
};

// 4. components/Canvas.tsx - Add to render logic
{node.type === 'buffer' && (
  <Buffer node={node} onStartDrag={handleStartDrag} onPortClick={handlePortClick} />
)}
```

### Modifying the UI

**CSS Organization** (`src/App.css`):

```css
/* Global resets */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* Layout containers */
.app { ... }
.canvas-container { ... }

/* Toolbar */
.toolbar { ... }
.toolbar-btn { ... }

/* Components */
.gate { ... }
.gate-and { fill: #3b82f6; }
.gate-or { fill: #ef4444; }
.switch { ... }
.light { ... }

/* States */
.selected { stroke: #eab308; stroke-width: 3; }
```

**Naming Convention**: BEM-like (component-element-modifier)

### Working with Touch Gestures

**Pointer Event Handling** (`src/components/Canvas.tsx`):

```typescript
// Track active pointers for multi-touch
const [activePointers, setActivePointers] = createStore<ActivePointer[]>([]);

const handlePointerDown = (e: PointerEvent) => {
  // Add to active pointers
  setActivePointers([...activePointers, { id: e.pointerId, x: e.clientX, y: e.clientY }]);

  if (activePointers.length >= 2) {
    // Two-finger gesture → pan + pinch-to-zoom
    initPinchZoom();
  } else {
    // Single finger → drag component or canvas
  }
};

const handlePointerMove = (e: PointerEvent) => {
  if (activePointers.length === 2) {
    // Calculate pinch zoom delta and midpoint movement
    updatePinchZoom(e);
  }
};

const handlePointerUp = (e: PointerEvent) => {
  // Remove from active pointers
  setActivePointers(activePointers.filter(p => p.id !== e.pointerId));
};
```

**Key Principles:**

- Use `PointerEvent` (not `MouseEvent` or `TouchEvent`) for universal support
- Track pointers by ID for multi-touch
- Prevent conflicts: disable component drag during multi-touch

---

## Key Conventions

### TypeScript Conventions

**Strict Mode Enabled:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Rules for AI Assistants:**

- ✅ Use type imports: `import type { Circuit } from '../types/circuit'`
- ✅ Define Props interfaces for all components
- ✅ Use discriminated unions for type safety
- ✅ Leverage TypeScript narrowing in switch statements
- ❌ Avoid `any` type unless absolutely necessary
- ❌ No type assertions (`as`) without justification
- ❌ No non-null assertions (`!`) without validation

### Component Conventions

**File Structure:**

```typescript
// 1. Imports (grouped: solid-js, types, store, components)
import { Component } from 'solid-js';
import type { GateNode, Position } from '../types/circuit';
import { circuitStore } from '../store/circuitStore';

// 2. Props interface
interface GateProps {
  node: GateNode;
  onStartDrag: (nodeId: string, clientPos: Position) => void;
  onPortClick: (portId: string, nodeId: string, type: 'input' | 'output') => void;
  isSelected: boolean;
}

// 3. Component (named export)
export const Gate: Component<GateProps> = (props) => {
  // Event handlers
  const handleClick = (e: MouseEvent) => { ... };

  // Render
  return <g>...</g>;
};
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `Canvas`, `Switch`, `Toolbar` |
| Functions/Variables | camelCase | `handleClick`, `nodeId`, `propagateSignals` |
| Types/Interfaces | PascalCase | `CircuitNode`, `GateType`, `Position` |
| CSS Classes | kebab-case | `toolbar-btn`, `gate-and`, `canvas-container` |
| Event Handlers | `handle` prefix | `handlePointerDown`, `handlePortClick` |
| File Names | PascalCase for components | `Canvas.tsx`, `Gate.tsx` |

### Wire Connection Rules

**Enforced Constraints:**

1. ✅ Output → Input (correct direction)
2. ❌ Input → Input (invalid)
3. ❌ Output → Output (invalid)
4. ✅ One output to many inputs (fan-out allowed)
5. ❌ Many inputs to one input (only ONE wire per input port)
6. ❌ Node to itself (no self-loops)

**Validation** (`src/store/circuitStore.ts` - `addWire()`):

```typescript
function addWire(fromPortId: string, toPortId: string): string | null {
  const fromPort = findPort(fromPortId);
  const toPort = findPort(toPortId);

  // Validate direction
  if (fromPort.type !== 'output' || toPort.type !== 'input') {
    return null;  // Invalid direction
  }

  // Check for existing wire to input
  const existingWire = circuit.wires.find(w => w.toPortId === toPortId);
  if (existingWire) {
    return null;  // Input already connected
  }

  // Check self-connection
  if (fromPort.nodeId === toPort.nodeId) {
    return null;  // Cannot connect to self
  }

  // Add wire
  const wire = { id: generateId('wire'), fromPortId, toPortId, ... };
  setCircuit('wires', [...circuit.wires, wire]);
  propagateSignals();
  return wire.id;
}
```

---

## Common Tasks & Patterns

### Task: Debugging Signal Propagation Issues

**Symptoms:**

- Lights not updating when switches toggle
- Gates producing wrong output
- Circuit doesn't evaluate correctly

**Debug Checklist:**

1. Verify `propagateSignals()` is called after state changes
2. Check wire connections are valid (output → input)
3. Inspect `evaluateGate()` logic for the specific gate type
4. Check for cycles (might hit 100 iteration limit)
5. Verify port IDs are correct in wires
6. Add console.log in `propagateSignals()` to trace evaluation

**Debugging Pattern:**

```typescript
function propagateSignals() {
  console.log('=== Starting propagation ===');
  console.log('Nodes:', circuit.nodes.length);
  console.log('Wires:', circuit.wires.length);

  // ... propagation logic

  console.log('Final nodeOutputs:', nodeOutputs);
  console.log('Iterations:', iterations);
}
```

### Task: Adding Keyboard Shortcuts

**Location**: `src/components/Canvas.tsx` - `handleKeyDown()`

**Current Shortcuts:**

- `Delete` - Remove selected node
- `Escape` - Clear selection / cancel wire drawing

**Adding New Shortcut:**

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Delete':
    case 'Backspace':
      if (selectedNodeIds.ids.length > 0) {
        circuitStore.deleteSelected();
      }
      break;
    case 'Escape':
      circuitStore.clearSelection();
      circuitStore.cancelWireDrawing();
      break;
    // NEW: Duplicate selected node
    case 'd':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        circuitStore.duplicateSelected();
      }
      break;
  }
};
```

### Task: Improving Import/Export Format

**Current Format** (`src/store/circuitStore.ts`):

```json
{
  "version": "1.0",
  "circuit": {
    "nodes": [...],
    "wires": [...]
  }
}
```

**Adding New Fields (with backward compatibility):**

```typescript
function exportCircuit(): string {
  return JSON.stringify({
    version: "1.1",  // Bump version
    circuit: {
      nodes: circuit.nodes,
      wires: circuit.wires
    },
    metadata: {  // NEW
      createdAt: new Date().toISOString(),
      name: "Untitled Circuit"
    }
  }, null, 2);
}

function importCircuit(jsonString: string): { success: boolean; error?: string } {
  const data = JSON.parse(jsonString);

  // Support both v1.0 and v1.1
  if (data.version === "1.0" || data.version === "1.1") {
    // Load circuit
    setCircuit({ nodes: data.circuit.nodes, wires: data.circuit.wires });

    // Load metadata if available (v1.1+)
    if (data.metadata) {
      // Handle metadata
    }

    propagateSignals();
    return { success: true };
  } else {
    return { success: false, error: `Unsupported version: ${data.version}` };
  }
}
```

### Task: Optimizing Performance for Large Circuits

**Potential Optimizations:**

1. **Virtualization**: Only render visible components
2. **Wire Culling**: Skip rendering off-screen wires
3. **Memoization**: Cache expensive calculations (port positions)
4. **Debouncing**: Limit propagation frequency during rapid changes
5. **Spatial Indexing**: Use quadtree for collision detection

**Example: Debouncing Propagation**

```typescript
let propagationTimeout: number | null = null;

function debouncedPropagateSignals() {
  if (propagationTimeout !== null) {
    clearTimeout(propagationTimeout);
  }
  propagationTimeout = setTimeout(() => {
    propagateSignals();
    propagationTimeout = null;
  }, 50);  // 50ms debounce
}
```

---

## Recent Features & Context

### Component Grouping (PR #7, #8)

**Commit History:**

- `1f9c705` - feat: Improve component selection UX for grouping
- `fdc20c0` - feat: Add component grouping functionality for reusable circuits

**What Changed:**

1. **Multi-Selection**: Users can now Ctrl/Cmd + click to select multiple nodes
2. **Group Creation**: Selected nodes can be grouped into a reusable component
3. **Group Node Type**: New `GroupNode` type with collapse/expand functionality
4. **External Port Mapping**: Groups expose ports for wires crossing the boundary
5. **Ungroup Support**: Groups can be dissolved back into individual components

**New Files:**

- `src/components/Group.tsx` - Group rendering component

**Modified Files:**

- `src/types/circuit.ts` - Added `GroupNode` interface
- `src/store/circuitStore.ts` - Added grouping functions
- `src/components/Canvas.tsx` - Added multi-select logic
- `src/components/Toolbar.tsx` - Added Group/Ungroup buttons

**Key Implementation Details:**

```typescript
// Multi-selection in Canvas.tsx
const handleStartDrag = (nodeId: string, clientPos: Position, isMultiSelect?: boolean) => {
  if (isMultiSelect) {
    // Toggle selection
    circuitStore.toggleSelection(nodeId);
  } else {
    // Clear and select only this node
    circuitStore.setSelection([nodeId]);
  }
};

// Group creation in circuitStore.ts
function createGroupFromSelected(label: string): string | null {
  if (selectedNodeIds.ids.length === 0) return null;

  // 1. Find bounding box
  const bounds = calculateBoundingBox(selectedNodeIds.ids);

  // 2. Find external wires (crossing boundary)
  const externalWires = circuit.wires.filter(wire => {
    const fromSelected = selectedNodeIds.ids.includes(wire.fromNodeId);
    const toSelected = selectedNodeIds.ids.includes(wire.toNodeId);
    return fromSelected !== toSelected;  // XOR - one selected, one not
  });

  // 3. Create group with input/output ports
  const groupNode = createGroup(label, selectedNodeIds.ids, externalWires, bounds);

  // 4. Remap external wires to group ports
  remapWiresToGroup(externalWires, groupNode);

  return groupNode.id;
}
```

### Import/Export Functionality (PR #4, #5, #6)

**Commit History:**

- `168ed9c` - feat: Add JSON import/export functionality for logic gate diagrams
- `a9afa54` - docs: Add half adder circuit example for testing import functionality
- `eae0bbd` - Claude/logic gate import export (merged PR)

**What Changed:**

1. Export circuits as JSON files with versioned format
2. Import circuits with multi-stage validation
3. Example file: `half-adder-example.json` for testing
4. Error handling with user-friendly messages

### Touch Support (PR #2, #3)

**Commit History:**

- `150371f` - feat: Add mobile and touch-friendly support
- `16bea7f` - fix: Add touch canvas navigation and fix lightbulb placement

**What Changed:**

1. Pinch-to-zoom gesture detection
2. Two-finger pan for canvas navigation
3. Touch-friendly button sizes (min 44x44px)
4. PointerEvent API for universal input handling

---

## Testing Guidelines

### Current State

**No Automated Tests** - All testing is manual

**Manual Testing Checklist:**

```markdown
### Component Functionality
- [ ] Add switch - toggles on/off
- [ ] Add each gate type (AND, OR, NOT, NAND, NOR, XOR, XNOR)
- [ ] Add light - responds to input signal
- [ ] Add group - created from selection

### Wire Connections
- [ ] Connect switch to gate input
- [ ] Connect gate output to light
- [ ] Connect gate to gate
- [ ] Verify input accepts only ONE wire
- [ ] Verify output accepts MULTIPLE wires
- [ ] Click wire to delete

### Signal Propagation
- [ ] Toggle switch updates connected lights
- [ ] Multi-gate circuits evaluate correctly
- [ ] Verify truth table for each gate type
- [ ] Test circuits with cycles (should stabilize)

### Grouping
- [ ] Multi-select with Ctrl/Cmd + click
- [ ] Create group from selection
- [ ] Collapse/expand group (double-click)
- [ ] Ungroup components
- [ ] Clone group

### Import/Export
- [ ] Export circuit saves JSON file
- [ ] Import valid circuit loads correctly
- [ ] Import half-adder-example.json works
- [ ] Import invalid JSON shows error
- [ ] Import preserves all connections

### Touch/Mobile
- [ ] Single finger drag moves components
- [ ] Two finger pan moves canvas
- [ ] Pinch-to-zoom works
- [ ] Touch targets are large enough

### Keyboard Shortcuts
- [ ] Delete key removes selected node
- [ ] Escape clears selection
- [ ] Escape cancels wire drawing
```

### Future Testing Recommendations

**Unit Tests (with Vitest):**

```typescript
// Example: store/circuitStore.test.ts
import { describe, test, expect } from 'vitest';
import { evaluateGate } from './circuitStore';

describe('evaluateGate', () => {
  test('AND gate with true inputs returns true', () => {
    expect(evaluateGate('AND', [true, true])).toBe(true);
  });

  test('AND gate with mixed inputs returns false', () => {
    expect(evaluateGate('AND', [true, false])).toBe(false);
  });

  // ... more tests for all gate types
});
```

**Component Tests (with Solid Testing Library):**

```typescript
// Example: components/Switch.test.tsx
import { render, fireEvent } from '@solidjs/testing-library';
import { Switch } from './Switch';

test('Switch toggles state on click', () => {
  const mockToggle = vi.fn();
  const { getByRole } = render(() => (
    <Switch node={mockSwitchNode} onToggle={mockToggle} />
  ));

  fireEvent.click(getByRole('button'));
  expect(mockToggle).toHaveBeenCalled();
});
```

**E2E Tests (with Playwright):**

```typescript
// Example: e2e/circuit-building.spec.ts
import { test, expect } from '@playwright/test';

test('Build and test half adder circuit', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Add components
  await page.click('[data-testid="add-switch"]');
  await page.click('.canvas-container', { position: { x: 100, y: 100 } });

  // Connect wires
  // ...

  // Toggle inputs and verify outputs
  await page.click('[data-testid="switch-1"]');
  const light = await page.locator('[data-testid="light-1"]');
  await expect(light).toHaveClass(/state-on/);
});
```

---

## Deployment

### GitHub Pages CI/CD

**Workflow**: `.github/workflows/deploy.yml`

**Trigger**: Push to `main` or `master` branch

**Steps:**

1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm install`)
4. Build with dynamic BASE_URL: `BASE_URL=/${{ github.event.repository.name }}/ npm run build`
5. Upload `dist/` as artifact
6. Deploy to GitHub Pages

**Environment Variable:**

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [solidPlugin()],
});
```

**Deployment URL:**

```
https://<username>.github.io/<repository-name>/
```

### Manual Deployment

```bash
# Build
npm run build

# Output: dist/ directory

# Serve locally to test
npm run preview

# Or serve with any static server
npx serve dist
```

---

## AI Assistant Best Practices

### Before Making Changes

**Always:**

1. ✅ Read relevant files first (use Read tool)
2. ✅ Understand existing patterns and conventions
3. ✅ Check type definitions in `types/circuit.ts`
4. ✅ Review ARCHITECTURE.md for context
5. ✅ Search for similar existing code (use Grep tool)

**Never:**

1. ❌ Modify files without reading them first
2. ❌ Assume React patterns (this is SolidJS!)
3. ❌ Add new dependencies without asking
4. ❌ Break TypeScript strict mode
5. ❌ Ignore existing naming conventions

### When Adding Features

**Checklist:**

- [ ] Define TypeScript types first
- [ ] Update store methods if state changes needed
- [ ] Create/modify components following existing patterns
- [ ] Update CSS in App.css following naming conventions
- [ ] Call `propagateSignals()` if circuit logic changes
- [ ] Test manually with dev server
- [ ] Consider backward compatibility for import/export
- [ ] Update this AGENTS.md if adding major features

### When Fixing Bugs

**Process:**

1. Reproduce the bug (understand the issue)
2. Identify the root cause (read relevant code)
3. Find the appropriate file(s) to modify
4. Make minimal, focused changes
5. Verify the fix doesn't break other functionality
6. Consider edge cases

### Code Style Preferences

**Prefer:**

```typescript
// ✅ Explicit types
const position: Position = { x: 100, y: 100 };

// ✅ Destructuring in function params
export const Gate: Component<GateProps> = (props) => { ... };

// ✅ Early returns
if (!node) return null;

// ✅ Descriptive variable names
const selectedNodeIds = circuitStore.selectedNodeIds.ids;

// ✅ Switch statements for type discrimination
switch (node.type) {
  case 'switch': // ...
  case 'gate': // ...
}
```

**Avoid:**

```typescript
// ❌ Implicit any
const data = JSON.parse(jsonString);  // Should type the result

// ❌ Type assertions without justification
const node = nodes[0] as GateNode;  // Use type guards instead

// ❌ Nested ternaries
const color = state ? (selected ? 'yellow' : 'green') : 'gray';  // Use if/else

// ❌ Magic numbers
const x = node.position.x + 80;  // Use node.width instead

// ❌ Mutating store directly
circuit.nodes.push(newNode);  // Use circuitStore.addNode(newNode)
```

### Understanding SolidJS Reactivity

**Key Concepts:**

```typescript
// createStore returns a proxy - mutations are tracked
const [circuit, setCircuit] = createStore({ nodes: [], wires: [] });

// ✅ Correct: Use setter
setCircuit('nodes', [...circuit.nodes, newNode]);

// ❌ Wrong: Direct mutation (won't trigger reactivity)
circuit.nodes.push(newNode);

// ✅ Correct: Path-based updates
setCircuit('nodes', nodeId, 'position', { x: 100, y: 100 });

// ✅ Correct: Using produce for complex updates
setCircuit(produce(draft => {
  draft.nodes.push(newNode);
  draft.wires = draft.wires.filter(w => w.fromNodeId !== nodeId);
}));
```

### Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Using React hooks | SolidJS uses different primitives | Use `createSignal()`, `createStore()`, `createEffect()` |
| Mutating store directly | Breaks reactivity | Use setter functions from `createStore()` |
| Forgetting to call `propagateSignals()` | Circuits don't update | Call after any circuit state change |
| Wrong coordinate system | Components placed incorrectly | Use `getSvgPoint()` for screen→SVG conversion |
| Adding wire without validation | Invalid connections | Check port types, existing wires, self-loops |
| Not handling group nodes | Incomplete feature support | Update all node-iterating code for groups |

### When to Ask for Clarification

**Ask the user if:**

- The task requires changing the architecture significantly
- Multiple valid approaches exist (ask for preference)
- Adding new dependencies is needed
- Breaking changes to import/export format are required
- The task is ambiguous or underspecified
- You need to make assumptions about desired behavior

---

## Additional Resources

### Documentation Files

- **README.md** - User-facing documentation and features
- **ARCHITECTURE.md** - Deep technical details and design decisions
- **.cursorrules** - Development guidelines for AI assistants (focused on code patterns)
- **This file (AGENTS.md)** - Comprehensive AI assistant guide

### Example Files

- **half-adder-example.json** - Working example circuit for testing import

### Key External Links

- [SolidJS Documentation](https://solidjs.com) - Framework docs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Language reference
- [Vite Guide](https://vite.dev/guide/) - Build tool docs
- [SVG Specification](https://www.w3.org/TR/SVG2/) - Graphics reference

---

## Changelog

### 2025-11-28 - Initial Creation

- Created comprehensive AI assistant guide
- Documented codebase structure and architecture
- Included recent features (grouping, import/export, touch support)
- Added development workflows and common tasks
- Provided SolidJS-specific guidance
- Included testing guidelines and deployment info

---

**Document Maintained By**: AI Assistants (Claude)
**Last Updated**: 2025-11-28
**Version**: 1.0
