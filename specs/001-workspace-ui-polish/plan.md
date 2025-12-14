# Implementation Plan: Workspace UI Polish

**Branch**: `001-workspace-ui-polish` | **Date**: 2025-12-13 | **Spec**: `/specs/001-workspace-ui-polish/spec.md`
**Input**: Feature specification from `/specs/001-workspace-ui-polish/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Polish the workspace experience so the canvas fills the shell, controls float like Miro, selection/energized wires are clearly legible, and grouped circuits open via an inline drill-in overlay with breadcrumb/back to keep context. UI states stay derived from core/store; React Flow remains a projection, not the source of truth.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x, React 18, Vite  
**Primary Dependencies**: React Flow (view adapter), Zustand store, design tokens under `src/design`, Vitest + React Testing Library + Playwright (e2e)  
**Storage**: N/A (client-side state only; persistence handled by existing core graph schema)  
**Testing**: Vitest (core/unit), React Testing Library (components), Playwright (e2e)  
**Target Platform**: Web (desktop/tablet ≥1024px) via modern evergreen browsers  
**Project Type**: Web single-front-end app (React)  
**Performance Goals**: Interaction latency (pan/zoom/select) <100ms in 95% samples; energized wire/selection visuals update within 100ms  
**Constraints**: Maintain contrast on light/dark themes; keep graph/selection invariants intact; avoid React Flow becoming state source; canvas must avoid scrollbars  
**Scale/Scope**: Single workspace shell with grouped circuit drill-in; limited to polish on existing graph features (no new schema)

## Implementation Notes (as built)

- Group drill-in is driven by `openGroupId` in the app store and projected via the React Flow adapter (`view.groupId`); edits in drill-in mode modify the same core circuit and persist on exit.
- Workspace selectors memoize derived arrays/objects (selection, wire view) to keep `useSyncExternalStore` snapshots stable under React 19.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Deep modules, narrow interfaces: ✅ UI changes consume existing core/store state; no new core APIs planned.
- Separation of concerns: ✅ Core stays pure; React Flow limited to rendering; state flows through store hooks.
- Specification-driven: ✅ This plan + spec define contracts for selection, energized wires, drill-in overlay before code.
- TDD-first coverage: ✅ Tests planned first (core mapping, component visuals, e2e flows); will fail before implementation.
- Explicit invariants: ✅ Graph rules and simulation bounds respected; drill-in must not break group identifiers or sync.
- Extensibility: ✅ Selection/energized styles added via view metadata/tokens; extension registries remain intact.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
src/
├── core/            # pure simulation + graph commands (unchanged)
├── app/             # store/orchestration hooks between core and UI
├── ui/              # React components and React Flow adapters
├── design/          # styling tokens, themes, global CSS
├── assets/          # static media
└── tests/           # colocated Vitest specs

specs/001-workspace-ui-polish/
├── spec.md
├── plan.md
├── research.md        (to be generated)
├── data-model.md      (to be generated)
├── quickstart.md      (to be generated)
└── contracts/         (to be generated)
```

**Structure Decision**: Single React web app with core/store/ui separation as above; all feature docs live under `specs/001-workspace-ui-polish/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
