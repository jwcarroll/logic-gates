# Contract: Logging Port & Adapter

## Purpose
Provide structured logging with version/environment metadata bound by default and swappable adapters.

## Port Interface (TypeScript shape)
```ts
export interface LoggerPort {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): LoggerPort; // merges metadata
}
```

## Default Adapter (Pino)
- Binds `version` and `environment` from settings as base fields.
- Emits JSON structured logs suitable for aggregation.

## Adapter Requirements
- MUST include base bindings on every log entry.
- MUST be replaceable without changing callers (port-first usage).
- SHOULD support browser and node targets; fallback to console if adapter unavailable.

## Failure Modes
- If base bindings missing, adapter initialization throws a structured error before logging any message.
- Logging calls must never throw during normal operation; adapter should degrade to console on internal error while emitting a warning.
