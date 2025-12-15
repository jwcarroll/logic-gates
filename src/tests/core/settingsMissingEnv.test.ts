import { describe, expect, it } from 'vitest'

import { loadSettings } from '../../app/settings/settings'

describe('loadSettings missing env', () => {
  it('falls back to build-time app version when VITE_APP_VERSION is undefined', () => {
    const env = { VITE_APP_ENVIRONMENT: 'local' }

    const settings = loadSettings(env)
    expect(settings.app.version).toBe(__APP_VERSION__)
  })

  it('throws MissingEnvironment when VITE_APP_ENVIRONMENT is undefined', () => {
    const env = {}

    expect(() => loadSettings(env)).toThrowError(/MissingEnvironment/)
  })
})
