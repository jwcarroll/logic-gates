# Data Model: Programmatic Application Version Access

## Entities

### ApplicationSettings
- **app.version**: string (non-empty; matches build/package version; accepts semantic or build-tagged strings).
- **app.environment**: string enum (`local`, `dev`, `test`, `prod`, or custom) used for logging/context; must be non-empty.

### LoggingContext
- **version**: string, sourced from `ApplicationSettings.app.version`.
- **environment**: string, mirrors `ApplicationSettings.app.environment`.
- **extra metadata**: extensible record for future fields; must not override `version`/`environment` keys.

## Relationships
- `LoggingContext.version` references the same value as `ApplicationSettings.app.version` (single source of truth).
- UI display reads `ApplicationSettings.app.version` directly; logging adapter binds `LoggingContext` defaults on initialization.

## Validation Rules
- Version and environment must be defined at startup; fail fast if missing.
- Version string must be ASCII and non-empty; allow semantic versions with pre-release/build metadata (e.g., `1.2.3-beta+abc123`).
- Environment must match allowed set; unknown values log a warning but still load to avoid blocking local/dev workflows.

## State/Lifecycle
- Settings are loaded once at startup from generated env-backed module; treated as immutable during runtime.
- Logging bindings are created at initialization using the loaded settings; subsequent logs reuse the bound metadata.
