# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Releases

Automated releases are driven by [semantic-release](https://semantic-release.gitbook.io/semantic-release/) using conventional commits.

- Branches: `main` (stable), `beta` (prerelease), `next` (rc channel).
- Run locally with `npm run release -- --no-ci`; dry-run with `npx semantic-release --dry-run --no-ci`.
- Requires `GITHUB_TOKEN` in the environment; npm publishing is disabled for this private package.
- Conventional commits enforced via commitlint (husky commit-msg hook + CI check).
