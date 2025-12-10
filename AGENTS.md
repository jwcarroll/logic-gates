# Repository Guidelines

## Design Principles
- Deep modules, narrow interfaces: core graph/simulation API is small, general, and framework-agnostic.
- Separation of concerns: core logic independent of rendering; React Flow is an adapter, not the source of truth.
- Specification-driven: every module has written contracts (inputs/outputs/invariants/errors) before coding.
- TDD-first: core logic fully unit-tested; UI covered by component and e2e tests; fast test loop.
- Invariants explicit: graph validity (ports/wires), simulation convergence bounds, import/export schemas.
- Extensibility: plugin-friendly surfaces for nodes, commands, menus, and metadata.

## Project Structure & Modules
- `src/main.tsx` boots the React app; `src/App.tsx` wires the shell layout.
- `src/core/` holds gate simulation logic and type definitions; keep pure functions here.
- `src/ui/` contains view components; shared pieces live under `src/ui/components/`.
- `src/app/` stores higher-level state helpers (stores, hooks).
- `src/design/` houses styling tokens; global styles are in `src/index.css` and `src/App.css`.
- `src/assets/` for static media; `public/` for files served as-is.
- Tests live in `src/tests/` (unit specs in `src/tests/core/`); built output goes to `dist/`.

## Setup, Build, and Run
- Install deps: `npm install`.
- Start dev server with HMR: `npm run dev` (Vite, default port 5173).
- Type-check + bundle: `npm run build` (runs `tsc -b` then `vite build`).
- Preview production bundle locally: `npm run preview`.

## Coding Style & Naming
- Language: TypeScript + React; prefer function components and hooks.
- Indent with 2 spaces; use named exports for reusable utilities; default exports only for pages/root components.
- Follow React file naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities, tests as `*.test.ts`.
- Lint with `npm run lint` (ESLint: recommended + TypeScript + react-hooks + react-refresh). Fix issues before pushing.

## Testing Guidelines
- Test runner: Vitest with jsdom; DOM assertions via `@testing-library/jest-dom`.
- Place specs under `src/tests/**`; mirror source paths (e.g., `core/thing.test.ts`).
- Run full suite: `npm run test`; watch mode: `npm run test:watch`.
- Aim for logic-heavy code in `src/core/` to be covered; prefer deterministic, pure tests.

## Commit & PR Expectations
- Write concise, imperative commit subjects (e.g., `Add XOR gate validation`); keep body for rationale/links.
- Before opening a PR: run `npm run lint` and `npm run test`.
- PRs should describe user-visible changes, testing performed, and reference issues/linear tickets; add screenshots/GIFs for UI updates.

## Security & Configuration Notes
- Do not commit secrets; Vite reads env vars from `.env.local` (gitignored). Use prefixes expected by Vite (e.g., `VITE_API_URL`).
- Keep third-party script URLs in `public/` or config files, never in components.
