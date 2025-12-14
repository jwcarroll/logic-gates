# Quickstart - Workspace UI Polish

1) Install deps: `npm install`
2) Run dev server: `npm run dev` (Vite, port 5173)
3) Validate specs alignment: read `specs/001-workspace-ui-polish/spec.md` and this plan.
4) Develop with TDD:
   - Core/state mapping tests: `npm run test -- src/tests/core`
   - Component tests (selection/toolbars/drill-in overlay): `npm run test -- src/ui`
   - E2E workspace flows (pan/zoom/select, drill-in): `npm run test:e2e`
5) Build/type-check before PR: `npm run build` and `npm run lint`.
6) Visual checks: capture light/dark + zoom snapshots for selection/energized wires.
