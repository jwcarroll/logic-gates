import type { AppSettings } from './settings'

export class VersionMismatchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VersionMismatchError'
  }
}

/**
 * Compare the exposed settings version to a reference (e.g., package.json version).
 * If referenceVersion is undefined, this is a no-op to avoid blocking builds where it is unavailable.
 */
export function assertVersionConsistency(settings: AppSettings, referenceVersion?: string) {
  if (!referenceVersion) return
  if (settings.app.version !== referenceVersion) {
    throw new VersionMismatchError(
      `Version mismatch: settings=${settings.app.version} reference=${referenceVersion}`,
    )
  }
}
