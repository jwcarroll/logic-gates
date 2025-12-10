# Validation Checklist - Sandbox Logic Circuit Builder

- [x] Dev server `npm run dev -- --host --port 4173` (via Playwright webServer) starts successfully
- [x] Unit/component tests `npm run test -- --watch=false` pass
- [x] Playwright e2e `npm run test:e2e:pw` pass (US1, US2, selection regression)
- [x] Build `npm run build`
- [ ] Manual import/export round-trip using fixtures in `src/tests/fixtures/roundtrip-circuit.json` and `roundtrip-challenge.json`
