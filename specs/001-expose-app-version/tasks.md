# Tasks: Programmatic Application Version Access

**Input**: Design documents from `/specs/001-expose-app-version/`
**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/
**Tests**: TDD-first per constitution; add core + UI tests before implementation.
**Organization**: Tasks grouped by user story to keep increments independently testable.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Ensure dependencies installed (`npm install`) in repo root
- [X] T002 Add env var defaults for local dev in `.env.local` (`VITE_APP_VERSION`, `VITE_APP_ENVIRONMENT`)

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T003 Create typed settings contract file at `src/app/settings/settings.ts` stub aligning with `contracts/settings.md`
- [X] T004 [P] Add settings validation tests for missing/invalid env values in `src/tests/core/settings.test.ts`
- [X] T005 Implement build-time settings loader using `import.meta.env` in `src/app/settings/settings.ts`
- [X] T006 Add build/package version consistency check helper in `src/app/settings/versionCheck.ts`
- [X] T007 [P] Wire settings loader export barrel in `src/app/index.ts`
- [X] T008 Document build env expectations in `specs/001-expose-app-version/quickstart.md` (update if needed)
- [X] T028 [P] Create failing test for missing/empty env vars in `src/tests/core/settingsMissingEnv.test.ts`
- [X] T029 [P] Create failing test for package.json vs `VITE_APP_VERSION` mismatch in `src/tests/core/versionConsistency.test.ts`

**Checkpoint**: Settings module validates env and exposes single source of truth.

---

## Phase 3: User Story 1 - See Running Version (Priority: P1) 🎯 MVP

**Goal**: Show the packaged version in the header/top bar near the app title.
**Independent Test**: UI renders exact version string from settings in header within 10 seconds of load.

### Tests (write first)
- [X] T009 [P] [US1] Add UI component test asserting header shows version from settings in `src/tests/ui/HeaderVersion.test.tsx`
- [X] T030 [P] [US1] UI render timing smoke test (<10s) in `src/tests/ui/HeaderVersion.timing.test.tsx`

### Implementation
- [X] T010 [US1] Inject settings into shell layout in `src/app/providers/AppProvider.tsx` (or equivalent) so header receives version
- [X] T011 [US1] Render version text in header/top bar near title in `src/ui/components/Header.tsx`
- [X] T012 [US1] Style/version label placement (small, non-intrusive) in `src/design/Header.css` or module alongside component
- [X] T013 [US1] Guard against missing version (fallback message or error boundary) in `src/ui/components/Header.tsx`
- [X] T014 [US1] Update fixtures/mocks for settings in UI tests at `src/tests/ui/__mocks__/settingsMock.ts`
- [X] T026 [US1] Expose pure version accessor returning settings value in `src/core/version.ts`
- [X] T027 [P] [US1] Re-export version accessor for app/UI usage in `src/app/index.ts`

**Checkpoint**: Header displays accurate version from single source; UI test passes.

---

## Phase 4: User Story 2 - Log With Version (Priority: P2)

**Goal**: Every log entry includes version and environment metadata via structured logger.
**Independent Test**: Trigger any log and verify emitted payload contains version and environment matching settings.

### Tests (write first)
- [X] T015 [P] [US2] Add logger port contract test for base bindings in `src/tests/core/loggerPort.test.ts`
- [X] T016 [P] [US2] Add adapter integration test using Pino to assert version/environment bound in `src/tests/core/loggerPinoAdapter.test.ts`

### Implementation
- [X] T017 [US2] Define `LoggerPort` interface per contract in `src/app/logging/loggerPort.ts`
- [X] T018 [US2] Implement Pino adapter binding `{ version, environment }` in `src/app/logging/pinoAdapter.ts`
- [X] T019 [US2] Provide logger factory wiring settings into adapter in `src/app/logging/index.ts`
- [X] T020 [US2] Replace direct console usage (if any) with logger port in core/app entry points (scan and update primary entry `src/main.tsx` and store setup files)
- [X] T021 [US2] Add fallback/console shim if adapter init fails in `src/app/logging/pinoAdapter.ts`

**Checkpoint**: Logs include version/env by default; tests confirm bindings.

---

## Phase 5: Polish & Cross-Cutting

- [X] T022 [P] Update documentation with version/logging usage in `specs/001-expose-app-version/quickstart.md`
- [X] T023 [P] Add lint rule or CI check ensuring `import.meta.env` not used outside settings module (configure in `eslint` if practical)
- [X] T024 Run full test suite `npm run test` and address failures
- [X] T025 Verify build pipeline sets `VITE_APP_VERSION` and `VITE_APP_ENVIRONMENT` (update CI config files if present)

---

## Dependencies & Execution Order
- Foundational (Phase 2) blocks user stories; complete before US1/US2.
- User Story 1 (P1) can run in parallel with User Story 2 (P2) after Phase 2, but US1 is MVP and should land first if serial.
- Within each story, tests (T009, T015, T016, T030) precede implementation tasks.
- Logging tasks (US2) depend on settings module (T003–T007) for version/env source.

## Parallel Opportunities
- T004 and T007 run in parallel with T003/T005 due to different files.
- US1 test T009 can run while T010–T012 proceed if using mocks.
- US2 tests T015/T016 parallel; adapters T017–T019 can proceed in parallel with T020/T021 once settings exist.
- Polish tasks T022–T025 can run after US1/US2 complete; T022/T023 parallel.

## MVP Scope
- Complete Phases 1–3 (through T014). That delivers visible version in header with validated settings and tests.

## Validation
- All tasks follow required format `- [ ] T### [P] [USx] Description with path`.
