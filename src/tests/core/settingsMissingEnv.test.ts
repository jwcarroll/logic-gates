import { describe, expect, it } from 'vitest'

import { loadSettings } from '../../app/settings/settings'

describe('loadSettings missing env', () => {
  it('throws MissingVersion when VITE_APP_VERSION is undefined', () => {
    const env = { VITE_APP_ENVIRONMENT: 'local' }

    expect(() => loadSettings(env)).toThrowError(/MissingVersion/)
  })

  it('throws MissingEnvironment when VITE_APP_ENVIRONMENT is undefined', () => {
    const env = { VITE_APP_VERSION: '1.0.0' }

    expect(() => loadSettings(env)).toThrowError(/MissingEnvironment/)
  })
})
