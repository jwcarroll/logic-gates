# Quickstart - Sandbox Logic Circuit Builder

## Goal
Enable contributors to stand up the sandbox, exercise core flows (build, compose, import/
export, challenges), and run the test loop aligned with the constitution.

## Prerequisites
- Node.js + npm installed
- Repo cloned and branch `001-logic-circuit-sandbox` checked out

## Steps
1) Install dependencies  
`npm install`

2) Run dev server (Vite, HMR)  
`npm run dev` then open the provided localhost port.

3) Build + type check  
`npm run build`

4) Test loop  
- Core/unit: `npm run test -- --watch=false`
- Component: `npm run test -- --watch=false src/tests/component`
- e2e (Playwright): `npm run test:e2e:pw` (starts dev server on port 4173)

5) Try the sandbox flows  
- Place switches, a gate, and a light; wire output→input; toggle switches to see signals.
- Group a selection into a reusable block; duplicate it and connect outputs to inputs.
- Load a sample/challenge circuit (once implemented); verify success indicator when outputs
  match targets.
- Import/export a circuit using the documented schema to confirm fidelity. Use fixtures in
  `src/tests/fixtures/roundtrip-circuit.json` or `src/tests/fixtures/roundtrip-challenge.json`
  with the toolbar import/export buttons to round-trip data.

6) Debugging tips  
- Check invariants: direction, one wire per input, no self-loops; invalid attempts should
  be rejected without state mutation.
- Watch simulation convergence: should settle ≤100 iterations; surface errors otherwise.
- Keep React Flow as view-only; state changes go through the store/commands.
