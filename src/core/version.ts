import type { AppSettings } from '../app/settings/settings'

/**
 * Pure accessor to read the application version from validated settings.
 */
export function getAppVersion(settings: AppSettings): string {
  return settings.app.version
}

export function getAppEnvironment(settings: AppSettings): string {
  return settings.app.environment
}
