# Phase 0 Research - Sandbox Logic Circuit Builder

## Decisions

- **Stack & boundaries**: Keep core graph/simulation pure TypeScript with deterministic
  commands; React Flow remains a view/adapter only; Zustand (or equivalent) orchestrates
  state. Rationale: aligns with constitution for deep modules and adapter boundaries.
  Alternatives considered: managing state directly in React Flow (rejected: would violate
  adapter boundary and complicate invariants).

- **Simulation model**: Deterministic iteration with a hard cap (≤100) and defaults of
  false for missing inputs; cycles that fail to converge report bounded error state without
  UI lock. Rationale: matches spec success criteria and invariant clarity. Alternatives:
  event-driven propagation (rejected for complexity and debugging).

- **Wiring invariants**: Enforce output→input direction, one wire per input, no self-loops;
  reject invalid attempts with explicit errors and no state mutation. Rationale: preserves
  graph validity and predictable simulation. Alternatives: implicit rewiring/override
  (rejected due to ambiguity).

- **Import/export schema**: Use v1.0 schema with optional v1.1 metadata for names/timestamps;
  invalid imports leave workspace unchanged and return validation errors. Rationale: honors
  constitution compatibility rules. Alternatives: ad-hoc JSON per session (rejected—no
  portability).

- **Subcircuits/groups**: Group nodes with mapped external I/O ports; cloning preserves
  internal wiring and new IDs; grouped blocks behave identically when reused. Rationale:
  supports composition and P2 story. Alternatives: macro expansion on paste (rejected:
  complicates provenance).

- **Challenges library**: Curated local examples with goals/targets evaluated in-sandbox;
  authoring new challenges is out of scope for this iteration. Rationale: keeps scope
  bounded while enabling guided learning. Alternatives: full challenge authoring UI
  (deferred).

- **Performance envelope**: Target visual updates ≤200 ms for circuits of dozens of nodes/
  wires; convergence cap prevents hangs. Rationale: aligns success criteria. Alternatives:
  looser bounds (rejected: weak learning feedback).

## Follow-ups

- None; no outstanding clarifications remain.
