# Performance notes

Date: 2025-12-15

## SC-001 / SC-002 spot check (delete latency)

Measured via `src/tests/unit/core/perf-delete-selection-100x200.test.ts`.

- Circuit: 100 nodes, 200 wires
- Selection: 24 items (mixed nodes + wires)
- End-to-end timing (core delete + simulate): ~1.7–2.3ms (observed across runs)

Notes:
- This is well under SC-001 (2s) and SC-002 (5s). Real UI rendering overhead not included.
