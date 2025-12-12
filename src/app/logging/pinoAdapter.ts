import type { LoggerPort } from './loggerPort'

interface ConsoleLike {
  info: (message?: unknown, ...optionalParams: unknown[]) => void
  warn: (message?: unknown, ...optionalParams: unknown[]) => void
  error: (message?: unknown, ...optionalParams: unknown[]) => void
}

function formatPayload(level: string, base: Record<string, unknown>, message: string, meta?: Record<string, unknown>) {
  return { level, ...base, message, ...(meta ?? {}) }
}

function createConsoleLogger(base: Record<string, unknown>, target: ConsoleLike = console): LoggerPort {
  const emit = (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => {
    const payload = formatPayload(level, base, message, meta)
    const serialized = JSON.stringify(payload)
    if (level === 'info') target.info(serialized)
    else if (level === 'warn') target.warn(serialized)
    else target.error(serialized)
  }

  return {
    info(message, meta) {
      emit('info', message, meta)
    },
    warn(message, meta) {
      emit('warn', message, meta)
    },
    error(message, meta) {
      emit('error', message, meta)
    },
    child(bindings: Record<string, unknown>): LoggerPort {
      return createConsoleLogger({ ...base, ...bindings }, target)
    },
  }
}

export interface PinoAdapterOptions {
  baseBindings: Record<string, unknown>
  consoleLike?: ConsoleLike
}

export class LoggerAdapterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LoggerAdapterError'
  }
}

function ensureBaseBindings(base: Record<string, unknown>) {
  if (!base.version || !base.environment) {
    throw new LoggerAdapterError('Logger adapter requires version and environment bindings')
  }
}

/**
 * Default adapter using console-based structured output. Named Pino adapter to allow
 * swapping to real Pino with the same port later.
 */
export function createPinoAdapter({ baseBindings, consoleLike }: PinoAdapterOptions): LoggerPort {
  const target = consoleLike ?? console

  try {
    ensureBaseBindings(baseBindings)
    return createConsoleLogger(baseBindings, target)
  } catch (err) {
    target.error('Logger adapter init failed, falling back to console logger', err)
    return createConsoleLogger({}, target)
  }
}
