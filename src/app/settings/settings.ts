export interface AppSettings {
  app: {
    version: string
    environment: string
  }
}

export class SettingsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = message.split(':')[0] || 'SettingsError'
  }
}

const ASCII_PATTERN = /^[\x20-\x7E]+$/

export function loadSettings(env: Record<string, string | undefined> = import.meta.env): AppSettings {
  const version = env.VITE_APP_VERSION
  const environment = env.VITE_APP_ENVIRONMENT

  if (!version || version.trim() === '') {
    throw new SettingsError('MissingVersion: VITE_APP_VERSION is required')
  }
  if (!ASCII_PATTERN.test(version)) {
    throw new SettingsError('InvalidVersionFormat: version must be ASCII and non-empty')
  }
  if (!environment || environment.trim() === '') {
    throw new SettingsError('MissingEnvironment: VITE_APP_ENVIRONMENT is required')
  }

  return {
    app: {
      version: version.trim(),
      environment: environment.trim(),
    },
  }
}
