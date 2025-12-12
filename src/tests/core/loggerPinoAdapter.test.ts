import { describe, expect, it } from 'vitest'

import { createPinoAdapter } from '../../app/logging/pinoAdapter'

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

describe('Pino adapter bindings', () => {
  it('includes base bindings on structured output', () => {
    const { entries, consoleLike } = makeConsole()
    const adapter = createPinoAdapter({
      baseBindings: { version: '2.0.0', environment: 'prod' },
      consoleLike,
    })

    adapter.error('boom', { code: 500 })

    const payload = JSON.parse(entries[0])
    expect(payload.level).toBe('error')
    expect(payload.version).toBe('2.0.0')
    expect(payload.environment).toBe('prod')
    expect(payload.code).toBe(500)
  })

  it('falls back to console logger if base bindings are missing', () => {
    const { entries, consoleLike } = makeConsole()
    const adapter = createPinoAdapter({
      // missing version/environment should trigger fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      baseBindings: {} as any,
      consoleLike,
    })

    adapter.info('hello')

    const jsonEntry = entries.find((entry) => {
      try {
        JSON.parse(entry)
        return true
      } catch {
        return false
      }
    })

    expect(jsonEntry).toBeDefined()
    const payload = JSON.parse(jsonEntry as string)
    expect(payload.message).toBe('hello')
    // base fields absent due to fallback
    expect(payload.version).toBeUndefined()
  })
})
