import { describe, expect, it } from 'vitest'

import { createLogger } from '../../app/logging'
import type { AppSettings } from '../../app/settings/settings'

describe('LoggerPort base bindings', () => {
  const settings: AppSettings = {
    app: { version: '1.2.3', environment: 'test' },
  }

  const makeConsole = () => {
    const entries: string[] = []
    return {
      entries,
      consoleLike: {
        info: (msg: string) => entries.push(msg),
        warn: (msg: string) => entries.push(msg),
        error: (msg: string) => entries.push(msg),
      },
    }
  }

  it('binds version and environment on every log call', () => {
    const { entries, consoleLike } = makeConsole()
    const logger = createLogger(settings, consoleLike as unknown as Console)

    logger.info('hello', { foo: 'bar' })

    const payload = JSON.parse(entries[0])
    expect(payload.version).toBe(settings.app.version)
    expect(payload.environment).toBe(settings.app.environment)
    expect(payload.message).toBe('hello')
    expect(payload.foo).toBe('bar')
  })

  it('child logger merges additional bindings', () => {
    const { entries, consoleLike } = makeConsole()
    const logger = createLogger(settings, consoleLike as unknown as Console)

    const child = logger.child({ requestId: 'abc' })
    child.warn('warned', { context: 'test' })

    const payload = JSON.parse(entries[0])
    expect(payload.requestId).toBe('abc')
    expect(payload.environment).toBe(settings.app.environment)
    expect(payload.level).toBe('warn')
  })
})
