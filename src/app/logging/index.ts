import type { AppSettings } from '../settings/settings'
import { createPinoAdapter } from './pinoAdapter'
import type { LoggerPort } from './loggerPort'

export function createLogger(settings: AppSettings, consoleLike?: Console): LoggerPort {
  const base = {
    version: settings.app.version,
    environment: settings.app.environment,
  }
  return createPinoAdapter({ baseBindings: base, consoleLike })
}
