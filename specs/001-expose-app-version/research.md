# Research: Programmatic Application Version Access

## Decision 1: Inject version via Vite env variable into generated settings file
- **Rationale**: Build-time env vars (`VITE_*`) are the simplest, already supported by Vite, and let pipelines stamp environment-specific versions without runtime I/O.
- **Alternatives considered**:
  - Read `package.json` at runtime (fails in production bundle without file access; adds parsing risk).
  - Hardcode version constant in source (requires manual bumps and risks drift from package version).
  - Fetch version from server endpoint (adds latency and dependency on network availability).

## Decision 2: Expose typed `settings.ts` module as the single source of truth
- **Rationale**: Strong typing and startup validation prevent missing/invalid env vars; central module hides implementation details from consumers.
- **Alternatives considered**:
  - Access `import.meta.env` directly in components (duplicates parsing/validation and leaks adapter concerns into UI/core).
  - Global window constant (tighter coupling, harder to test/migrate).

## Decision 3: Structured logging via port/adapter with Pino as default adapter
- **Rationale**: Port keeps logging interchangeable; Pino offers fast JSON logging suited for structured logs and can include version in base bindings.
- **Alternatives considered**:
  - Winston (feature-rich but heavier for this lightweight need).
  - Console-only logging (insufficient structure and no consistent metadata binding).

## Outstanding Clarifications
- None; current scope is sufficiently defined for planning.
