# Quickstart: Programmatic Application Version Access

1) **Generate settings at build**
- Add pipeline step to set `VITE_APP_VERSION` and `VITE_APP_ENVIRONMENT` for each environment.
- Ensure the generated `settings.ts` reads from `import.meta.env` and validates required fields.
- Local dev defaults live in `.env.local` (example: `VITE_APP_VERSION=1.1.0`, `VITE_APP_ENVIRONMENT=local`) to keep HMR running without CI secrets.

2) **Expose typed settings**
- Export `loadSettings()` returning immutable `{ app: { version, environment } }` and throw on missing/invalid values.
- Avoid direct `import.meta.env` usage elsewhere; enforce single source of truth.
- ESLint rule blocks `import.meta.env` outside `src/app/settings/*`; consume values via `loadSettings()`.

3) **Bind UI display**
- Render version in the header/top bar near the app title using the settings value.
- Add a UI test asserting the displayed version matches the packaged value.

4) **Wire structured logging**
- Implement `LoggerPort` with a Pino adapter binding base metadata `{ version, environment }`; use `createLogger(settings)` at entry points instead of `console`.
- Adapter falls back to console logging if initialization fails; smoke test verifies emitted logs include the version field.

5) **Validation & tests**
- Core unit tests: settings validation (missing/invalid), version consistency check, logging adapter bindings.
- UI test: version label visible and accurate on load.
- Consider a build-time check comparing `package.json` version to `VITE_APP_VERSION` to prevent drift.

6) **Run & verify**
- `npm run dev` (local env vars default to `local` and package version).
- `npm run test` to ensure TDD coverage stays green.
