# Logic Gates Playground

Interactive logic-circuit sandbox built with React Flow, TypeScript, and Vite. Sketch circuits, wire gates, and see outputs update in real time.

## Live
- Production: https://www.technofattie.com/logic-gates/  
- Built from `main` via GitHub Actions → Pages (`release.yml`).

## Features
- Drag-and-drop gate palette (AND/OR/NOT/NAND/NOR/XOR/XNOR), switches, and lights.
- Realtime simulation core in `src/core/` decoupled from UI.
- Undo/redo and node wiring helpers tuned for React Flow.
- Semantic-release powered versioning; CHANGELOG + tags auto-created from conventional commits.

## Quick Start
- Install: `npm install`
- Dev server (HMR): `npm run dev` → http://localhost:5173
- Type-check & build: `npm run build`
- Preview prod bundle: `npm run preview`
- Lint: `npm run lint`
- Tests: `npm run test` (Vitest + jsdom)

## Release & CI
- Conventional commits enforced (commitlint).  
- Release workflow: `.github/workflows/release.yml`
  - Node 22.14.0, `semantic-release` → bumps version, updates `CHANGELOG.md`, tags, and deploys Pages.
  - Pages base path set via `BASE_URL=/logic-gates/`; `vite.config.ts` uses `base: process.env.BASE_URL ?? '/'`.
- Local dry-run: `npx semantic-release --dry-run --no-ci`.

## Project Structure
- `src/main.tsx` bootstraps app; `src/App.tsx` shell/layout.
- `src/core/` pure simulation logic and types.
- `src/ui/` React components; shared pieces in `src/ui/components/`.
- `src/app/` state stores/hooks; `src/design/` styling tokens.
- Assets in `src/assets/`; static files in `public/`; tests under `src/tests/`.

## Contributing
- Follow conventional commits (e.g., `feat: add xor gate`).  
- Run `npm run lint` and `npm run test` before pushing.  
- PRs should note user-visible changes and include screenshots/GIFs for UI updates.

