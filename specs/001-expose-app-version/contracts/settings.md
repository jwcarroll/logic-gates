# Contract: Settings Module

## Purpose
Provide a single typed interface for application metadata derived from build-time environment variables.

## Interface (TypeScript shape)
```ts
export interface AppSettings {
  app: {
    version: string;        // non-empty, equals package/build version
    environment: string;    // e.g., local | dev | test | prod | custom
  };
}

export interface SettingsProvider {
  load(): AppSettings;      // validates required fields and throws structured error on failure
}
```

## Validation Errors
- `MissingVersion`: `app.version` absent or empty.
- `MissingEnvironment`: `app.environment` absent or empty.
- `InvalidVersionFormat`: version contains non-ASCII or whitespace-only value.

## Behavior
- `load()` returns settings parsed from generated env-backed module; settings are immutable after load.
- On validation failure, implementation must throw a structured error before initializing UI/logging.

## Notes
- Implementation uses Vite `import.meta.env` behind the provider; callers must not access env directly.
```
