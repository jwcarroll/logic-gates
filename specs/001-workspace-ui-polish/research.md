# Research - Workspace UI Polish

## Floating Workspace & Toolbars
- **Decision:** Use CSS grid/flex shell with canvas set to `height: 100vh` minus header and floating toolbars positioned via `position: absolute` anchors that track viewport edges; React Flow `fitView` on resize.
- **Rationale:** Ensures canvas fills shell without scrollbars and keeps controls reachable during pan/zoom; avoids embedding controls inside React Flow nodes which could desync state.
- **Alternatives considered:** Fixed sidebar (reduces canvas area); embedding controls inside canvas graph (risks selection occlusion).

## Selection Cues & Zoom Legibility
- **Decision:** Apply tokenized selection style (contrast-safe color, 2-3px outline, subtle glow) with `vector-effect: non-scaling-stroke` so stroke stays legible at zoom extremes.
- **Rationale:** Maintains consistent affordance on zoom; token reuse keeps light/dark contrast compliant.
- **Alternatives considered:** Scale-dependent stroke widths (adds complexity); dashed outlines (busy at small scale).

## Energized Wire Styling
- **Decision:** Use dual-tone stroke with animated gradient (CSS `stroke-dashoffset`/`animation`) indicating direction; throttle animation to simulation ticks and pause when simulation stops.
- **Rationale:** Communicates flow direction without heavy CPU; ties animation lifecycle to simulation state to avoid stale cues.
- **Alternatives considered:** Particle sprites (heavier perf); solid color change only (loses directionality).

## Group Drill-In Overlay
- **Decision:** Inline drill-in overlay replaces canvas content, retains workspace chrome, shows breadcrumb/back, and keeps group selection id stable; entering pauses panning on parent but keeps simulation live with explicit status banner.
- **Rationale:** Matches spec clarification; preserves context and identifiers while preventing conflicting gestures.
- **Alternatives considered:** Modal dialog (limited space); side panel (insufficient area for editing); full navigation (loses context).

## Performance & Responsiveness
- **Decision:** Keep pan/zoom/select updates under 100ms using memoized selectors, React Flow `onMove` debounced for expensive work, and requestAnimationFrame for visual updates; measure with Performance API markers.
- **Rationale:** Aligns with success criteria; instrumentation allows regression detection.
- **Alternatives considered:** No instrumentation (risks regressions); heavy global throttling (hurts responsiveness).

## Accessibility & Input
- **Decision:** Floating controls keyboard-focusable with visible focus ring; breadcrumb/back reachable via keyboard; ARIA labels for toolbars; skip-to-canvas shortcut.
- **Rationale:** Prevents focus traps introduced by overlays; keeps workspace usable without mouse.
- **Alternatives considered:** Mouse-only controls (excludes keyboard users).
