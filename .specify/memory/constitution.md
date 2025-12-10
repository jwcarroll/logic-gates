<!--
Sync Impact Report
- Version change: unversioned template → 1.0.0
- Modified principles: template placeholders → Deep Modules, Narrow Interfaces; Separation of Concerns & Adapter Boundaries; Specification-Driven Development; TDD-First Coverage; Explicit Invariants & Validation; Extensibility & Plugin Surfaces
- Added sections: Architecture & Technology Constraints; Development Workflow & Quality Gates
- Removed sections: None
- Templates requiring updates: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md; ✅ .specify/templates/tasks-template.md; ⚠ N/A (.specify/templates/commands directory not present)
- Follow-up TODOs: None
-->

# Logic Gates Constitution

## Core Principles

### Deep Modules, Narrow Interfaces
Core graph and simulation APIs MUST stay small, general, and framework-agnostic. Commands
remain pure functions that accept state and return new state + results without leaking React
or UI concerns. New capabilities should deepen existing modules instead of widening surface
area. Rationale: shallow APIs erode flexibility; deep modules keep behavior predictable and
adaptable.

### Separation of Concerns & Adapter Boundaries
Core logic MUST be independent of rendering and transport. The React Flow layer is an
adapter and never the source of truth; it consumes derived state from the app store and
returns intent through commands. Store/orchestration (e.g., Zustand) mediates between core
and UI; no React Flow types or UI state may bleed into `src/core`. Rationale: clean
boundaries protect the simulation from UI churn and enable alternative frontends.

### Specification-Driven Development
Every module and feature MUST have written contracts (inputs/outputs/invariants/errors)
before coding. Specs cover core API, simulation rules, import/export schemas, and UI
interactions (gestures, shortcuts, accessibility). Any behavior change updates the relevant
spec before implementation and is referenced in PRs. Rationale: specifications prevent
ambiguous behavior and speed reviews.

### TDD-First Coverage
Tests are written first and must fail before implementation. Core logic is fully unit-tested
with deterministic fixtures (Vitest); UI changes include component tests (React Testing
Library) and e2e coverage for interaction flows when behavior changes. No feature merges
without green tests and explicit red-green-refactor evidence. Rationale: guards regression
risk and keeps the simulation trustworthy.

### Explicit Invariants & Validation
Graph validity (direction output→input, one wire per input, no self-loops), simulation
convergence bounds (≤100 iterations), and import/export schemas (v1.0 with v1.1 metadata)
MUST be encoded as invariants. Invalid operations reject without mutating state. Specs
record the invariants, and code asserts them at boundaries. Rationale: makes failure modes
obvious and debuggable.

### Extensibility & Plugin Surfaces
Plugin-friendly surfaces for nodes, commands, menus, and metadata MUST remain stable.
Extensions register through defined registries instead of hardcoded conditionals. Changes
that constrain extension points require a migration note and version bump. Rationale:
preserves the ability to add new node types and commands without rewriting the core.

## Architecture & Technology Constraints

- Language/tooling: TypeScript + React + Vite; React Flow for rendering only; Zustand (or
  equivalent store) as app orchestrator.
- Directory ownership: `src/core` pure and framework-free; `src/app` bridges store and
  adapters; `src/ui` for React components and React Flow renderers; `src/design` for
  styling tokens and global themes; tests in `src/tests`.
- Core APIs expose pure commands and deterministic simulation; UI layers derive state from
  store queries and never mutate core data directly.
- Import/export must honor schema compatibility (v1.0 + forward-compatible v1.1 metadata);
  new metadata requires validation and migration notes.

## Development Workflow & Quality Gates

- No implementation starts without updated specs capturing contracts, invariants, and
  UX behaviors for the change.
- Plans and tasks MUST include tests as first-class items (unit for core, component/e2e for
  UI) and map to specs; tests written and run before code lands.
- Code reviews verify principle adherence: core purity, adapter boundaries, invariants
  enforced, extension points preserved, and specs updated.
- Golden fixtures and validation suites back import/export, graph validity, and simulation
  truth tables; regressions require new fixtures or assertions.
- Documentation and design tokens update alongside behavior changes to keep the UI and
  core in sync.

## Governance

- This constitution supersedes other practice docs for architecture, testing, and workflow
  expectations.
- Amendments require: (1) a proposal referencing affected specs/contracts, (2) updated
  constitution version per semver (MAJOR for breaking/removal, MINOR for new/expanded
  principles, PATCH for clarifications), and (3) migration notes when extension points or
  schemas shift.
- Compliance is reviewed on every PR; violations block merge until corrected or explicitly
  justified with documented follow-up tasks and version bumps.
- Runtime guidance (e.g., `REACT_FLOW_REBUILD_SPEC.md`) must be kept aligned with the
  principles and cited in relevant plans/specs.

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
