# Feature Specification: Workspace UI Polish

**Feature Branch**: `001-workspace-ui-polish`  
**Created**: 2025-12-12  
**Status**: Implemented (in progress)  
**Input**: User description: "I want to clean up the user interface and provide some polish so that user interactions are more intuitive, and the entire application feels more professional. - Ensure that the canvas fills up the entire workspace instead of being in a frame. I want the toolbars and menus to be elements that float on the workspace similar to how Miro works visually. - Provide better visual feedback when elements are selected - Provide a more polished visual style for wires that have current running through them - Grouped circuits should have a better way to view the internal details and edit them"

**Architecture Notes**: Core logic MUST stay pure and framework-agnostic; React Flow is an adapter/view only; store/orchestration mediates between core and UI. Visual states (selection, current flow) are derived from core simulation/store state, not from view-only artifacts.

## Clarifications

### Session 2025-12-13

- Q: Preferred interaction pattern for viewing/editing grouped circuits without losing context? → A: Inline drill-in overlay with breadcrumb/back control that replaces canvas content while keeping workspace chrome.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immersive Workspace Canvas (Priority: P1)

A designer opens a circuit and immediately sees the canvas filling the available workspace with floating toolbars/menus that stay accessible without shrinking the canvas.

**Why this priority**: Establishes the primary interaction surface; without it the product still feels framed and cramped.

**Independent Test**: Launch app on desktop and tablet widths; verify canvas auto-resizes to viewport and floating controls remain reachable without overlapping critical nodes.

**Acceptance Scenarios**:

1. **Given** the user opens the app, **When** the workspace loads on any supported viewport, **Then** the canvas expands to fill available space with no surrounding frame padding beyond global layout margins.
2. **Given** toolbars are enabled, **When** the user pans/zooms the canvas, **Then** floating toolbars remain pinned to workspace edges or anchors and do not obscure selected nodes; when a selected element would overlap a control anchor, the anchor shifts 12–24px away from the selection bounding box, and if still colliding moves in priority order top-right → top-left → bottom-left → bottom-right.

---

### User Story 2 - Clear Interaction Feedback (Priority: P2)

When a user selects gates, wires, or groups, the selection state is visually obvious; active wires carrying current are styled distinctly so the flow is readable at a glance.

**Why this priority**: Directly impacts usability and error prevention; users must see what is selected or energized before editing.

**Independent Test**: Create a simple circuit, toggle selections and run simulation; confirm selection cues and energized-wire styling appear immediately and are distinguishable from idle state.

**Acceptance Scenarios**:

1. **Given** a node, wire, or group is selected, **When** the user looks at the canvas, **Then** the selected element shows a high-contrast outline/glow and handle affordances without changing its logical state.
2. **Given** a simulation is running, **When** current flows through a wire, **Then** the wire displays an animated or color-differentiated style that is clearly visible over the canvas background and remains legible at multiple zoom levels.

---

### User Story 3 - Inspectable Grouped Circuits (Priority: P3)

Users can open a grouped circuit to view and edit its internal components from the workspace without losing context of the parent circuit.

**Why this priority**: Enables refinement of reusable modules; poor visibility into groups blocks advanced use.

**Independent Test**: Create a grouped circuit, enter its detail view, edit an internal connection, and return to parent; verify changes persist and navigation is obvious.

**Acceptance Scenarios**:

1. **Given** a grouped circuit on the canvas, **When** the user chooses to inspect it, **Then** the UI reveals its contents via an inline drill-in overlay that replaces the canvas content while keeping workspace chrome and a breadcrumb/back control to exit.
2. **Given** the user edits wiring or gate placement inside the group, **When** they save/exit, **Then** the parent canvas reflects those changes and preserves overall layout and connections.

### Edge Cases

- Canvas and floating controls on very small viewports (e.g., 1024px wide) should remain usable without overlapping critical nodes or clipping menus.
- High zoom-out or zoom-in must keep selection and energized-wire indicators legible (e.g., minimum stroke/contrast) without overwhelming the canvas.
- Multiple selections, including nested group selections, should not blend cues (e.g., group selection vs. child selection remain distinguishable).
- Offline or paused simulation should revert energized-wire styling to idle promptly to avoid stale cues.
- Opening a group while a simulation is running should clearly indicate whether the nested view is live or paused to prevent misleading states.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workspace canvas MUST automatically size to fill the available shell area on load and on viewport resize without introducing scrollbars around the canvas.
- **FR-002**: Primary toolbars and context menus MUST render as floating overlays within the workspace, remaining accessible while panning/zooming and avoiding overlap with selected elements where possible.
- **FR-003**: Selection state for nodes, wires, and groups MUST present a high-contrast visual treatment (outline/glow/handle highlights) that is consistent across element types and responsive within 100ms of selection change.
- **FR-004**: Wires carrying simulated current MUST display a distinct animated or color-differentiated style that conveys direction/intensity and remains legible at common zoom levels.
- **FR-005**: Users MUST be able to open a grouped circuit via an inline drill-in overlay that replaces the canvas content while keeping workspace chrome, presents a breadcrumb/back control, and allows returning to the parent without a separate page load.
- **FR-006**: Edits made inside a grouped circuit (adding/removing/moving gates or wires) MUST persist and reflect in the parent circuit once the user exits the group view.
- **FR-007**: Visual themes for selection and energized wires MUST maintain ≥4.5:1 contrast (WCAG AA) against the canvas in both light and dark design tokens; outlines/glows must remain ≥3:1 at zoom extremes.
- **FR-008**: Canvas, selection cues, and floating controls MUST remain performant, keeping interactive latency (pan/zoom/select) under 100ms on target hardware defined for the app.

### Key Entities *(include if feature involves data)*

- **Workspace Canvas**: The drawable area that renders nodes, wires, groups, and floating UI; tracks viewport size and pan/zoom state.
- **Element Selection**: State representing currently selected nodes, wires, or groups; includes multiple selection sets and focus element.
- **Wire State**: Simulation-derived status indicating whether current is present and (if available) its direction/intensity for styling.
- **Grouped Circuit**: Compound element containing a subgraph; supports entering/exiting a detail view and persisting internal edits back to the parent graph.

## Assumptions & Dependencies

- Target viewports are desktop and tablet widths ≥1024px; mobile-optimized layouts are out of scope for this polish pass.
- Core simulation already emits wire energized state (and direction when available) that the UI can map to visual styles.
- Existing theme tokens support light and dark backgrounds; no new brand palette creation is required, only application of tokens.
- Grouped circuit schema and persistence are already supported; this effort focuses on visibility and editing affordances rather than schema changes.

## Architecture & Boundaries *(mandatory)*

- **Core surface**: Selection and wire state originate from core/store commands/queries; UI reads these states but does not mutate simulation directly.
- **Adapters**: React Flow (or other view layer) acts as a projection of core graph state; floating toolbars anchor to workspace layout but must not become a source of truth for node positions or selection.
- **Workspace shell**: Layout uses a full-bleed grid (header + sidebar + canvas) with `overflow: hidden`; scrollbars are limited to sidebar panels only. Canvas sizing derives from selectors, not DOM queries inside React Flow.
- **Selectors**: `src/app/store/workspaceSelectors.ts` is the sole entry for canvas sizing, selection grouping, wire view state, and group breadcrumb projection. UI code must not read raw store slices directly for these concerns.
- **Performance**: Interaction timing budgets (100ms) are enforced via `workspacePerformance` markers; rendering code emits markers but never throttles simulation or core updates.
- **Anchors & tokens**: Floating controls and visual treatments (selection/energized/breadcrumb) consume design tokens from `src/design/tokens/workspace.ts`; tokens declare collision shift ranges (12–24px) and contrast budgets.
- **Extension points**: Existing node/command/menu registries may expose new view metadata (e.g., selection style tokens, energized-wire display hints) without changing core simulation semantics; migrations limited to UI metadata, not graph schema.

## Contracts & Invariants *(mandatory for core logic)*

- **Graph validity**: Direction output→input, single wire per input, no self-loops; group entry/exit must not violate graph invariants when internal edits sync back.
- **Simulation bounds**: Simulation iterations stay within configured limits (≤100); wire energized state resets promptly when simulation stops or fails.
- **Import/export**: Grouped circuits maintain schema versioning; entering/exiting groups must not change identifiers used for persistence; exports include view metadata for selection/energized styling only as optional decorations.
- **Error semantics**: UI surfaces structured errors when group edits cannot sync or when selection operations target invalid elements; errors do not leave partial selection states.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users report the canvas feels full-screen and uncluttered in usability sessions of the redesigned workspace.
- **SC-002**: Selection recognition accuracy (users correctly identify what is selected) reaches 95% in moderated tests with no verbal hints.
- **SC-003**: Energized wires are identified correctly within 2 seconds by 90% of test users during live simulation tasks.
- **SC-004**: Entering a group, editing one connection, and returning to the parent can be completed in under 20 seconds by 90% of test participants.
- **SC-005**: Interactive actions (pan, zoom, select) respond within 100ms on target hardware in 95% of sampled interactions.
- **SC-001a**: Usability sessions record “full-screen/uncluttered” rating with ≥95% positive responses.
- **SC-002a**: Selection recognition accuracy logged per session remains ≥95% without hints.
- **SC-003a**: Energized wire identification time is ≤2 seconds for ≥90% of users across sessions.
- **SC-004a**: Group open-edit-return flow completes in <20 seconds for ≥90% of sessions (timed).

### Automated Validation (current)

- Playwright: `src/tests/e2e/workspace-layout.spec.ts` (SC-001 signal), `src/tests/e2e/selection-energized.spec.ts` (SC-002/SC-003 signals), `src/tests/e2e/group-drill-in.spec.ts` + `src/tests/e2e/workspace-usability.spec.ts` (SC-004a timing assertion).
- Vitest: `src/tests/ui/workspace-visuals.test.ts` writes a stable snapshot to `src/tests/ui/__snapshots__/workspace-visuals.spec.ts.snap` and enforces minimum contrast targets for the dark workspace tokens.

## Testing Strategy *(TDD-first, mandatory)*

- **Core**: Unit specs for selection state transitions, group enter/exit syncing, and energized-wire status mapping from simulation outputs.
- **UI**: Component tests for floating toolbars/menus positioning, selection visuals, energized-wire rendering, and group detail view navigation; e2e flows for stories above across viewport sizes.
- **Fixtures**: Golden circuits with grouped subgraphs and active simulations to assert visual state mappings; viewport snapshots for light/dark backgrounds and zoom extremes.
