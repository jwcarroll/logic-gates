import { describe, expect, it } from 'vitest'

import { loadSettings } from '../../app/settings/settings'

describe('loadSettings validation', () => {
  it('trims values and returns settings when valid', () => {
    const env = { VITE_APP_ENVIRONMENT: ' local ' }

    const settings = loadSettings(env)

    expect(settings.app.version).toBe(__APP_VERSION__)
    expect(settings.app.environment).toBe('local')
  })

  it('throws MissingEnvironment when environment is blank', () => {
    const env = { VITE_APP_ENVIRONMENT: '   ' }

    expect(() => loadSettings(env)).toThrowError(/MissingEnvironment/)
  })
})
