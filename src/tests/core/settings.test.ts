import { describe, expect, it } from 'vitest'

import { loadSettings } from '../../app/settings/settings'

describe('loadSettings validation', () => {
  it('throws InvalidVersionFormat when version contains non-ASCII characters', () => {
    const env = { VITE_APP_VERSION: '1.0.0é', VITE_APP_ENVIRONMENT: 'local' }

    expect(() => loadSettings(env)).toThrowError(/InvalidVersionFormat/)
  })

  it('trims values and returns settings when valid', () => {
    const env = { VITE_APP_VERSION: ' 1.2.3 ', VITE_APP_ENVIRONMENT: ' local ' }

    const settings = loadSettings(env)

    expect(settings.app.version).toBe('1.2.3')
    expect(settings.app.environment).toBe('local')
  })

  it('throws MissingEnvironment when environment is blank', () => {
    const env = { VITE_APP_VERSION: '1.2.3', VITE_APP_ENVIRONMENT: '   ' }

    expect(() => loadSettings(env)).toThrowError(/MissingEnvironment/)
  })
})
