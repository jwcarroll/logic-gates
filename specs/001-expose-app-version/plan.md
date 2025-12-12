# Implementation Plan: Programmatic Application Version Access

**Branch**: `001-expose-app-version` | **Date**: December 12, 2025 | **Spec**: specs/001-expose-app-version/spec.md
**Input**: Feature specification from `/specs/001-expose-app-version/spec.md`

## Summary
Expose the application version as a single source of truth available programmatically, in logs, and in the UI header. Use Vite build-time env vars to stamp the version/environment, load them through a typed `settings.ts` module with validation, and bind structured logging (Pino adapter behind a Logger port) so every log includes version metadata.

## Technical Context
**Language/Version**: TypeScript (Vite React)  
**Primary Dependencies**: Vite (`import.meta.env`), React, planned Pino adapter behind `LoggerPort`  
**Storage**: N/A (config sourced from env at build)  
**Testing**: Vitest + @testing-library/react  
**Target Platform**: Web (Vite dev/prod builds)  
**Project Type**: Single-page web app  
**Performance Goals**: Negligible overhead; settings load/validate at startup; logging binding adds no measurable latency  
**Constraints**: No runtime network calls for version; validation must fail fast on missing version/environment; UI must show version in header/top bar  
**Scale/Scope**: Small scope; applies across app shell and logging

## Constitution Check
- Deep modules, narrow interfaces: Version value lives in typed settings module; logging uses port/adapter; no React Flow or UI types in core settings.
- Separation of concerns: Version source stays in core/app layer; UI merely renders; logging adapter wraps port; no direct env access in UI.
- Specification-driven: Contracts defined in `/contracts` for settings and logging; invariants captured in spec and data-model.
- TDD-first coverage: Plan includes core/unit tests for settings validation and logging bindings; UI test for header display to be written before implementation.
- Explicit invariants: Single source of truth, non-empty version, header display location, log bindings all validated at startup/tests.
- Extensibility: Port/adapter keeps logging swappable; settings structure grouped under `app` allows future fields without breaking callers.

## Project Structure
```text
src/
├── core/              # pure logic (version accessor can live here if needed)
├── app/               # settings loader/orchestration, logging adapter wiring
├── ui/                # React components; header renders version
├── design/            # styling tokens
├── assets/
└── tests/             # or src/tests based on repo; includes core + UI specs

specs/001-expose-app-version/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── settings.md
│   └── logging.md
└── tasks.md (to be created by /speckit.tasks)
```

**Structure Decision**: Single Vite web app; version settings and logging port live in `src/app` (or `src/core` for pure accessor), adapters in `src/app`, UI header in `src/ui`.

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| None | — | — |

## Phase 0: Outline & Research
- Completed in `research.md`; no outstanding clarifications.

## Phase 1: Design & Contracts
- Data model captured in `data-model.md` (ApplicationSettings, LoggingContext).
- Contracts authored in `contracts/settings.md` and `contracts/logging.md`.
- Quickstart created to guide implementation/testing.

## Phase 2: Implementation Preparation
- Tests to author first: settings validation (missing/invalid version/env), build vs exposed version consistency, logging adapter includes version/environment, UI header shows version.
- Build-time step: ensure pipeline sets `VITE_APP_VERSION` and `VITE_APP_ENVIRONMENT`; add optional guard comparing package version to env.

## Constitution Re-check (post-design)
All gates remain satisfied; no violations introduced.
