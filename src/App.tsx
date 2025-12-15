import './App.css'
import { Toolbar } from './ui/components/Toolbar'
import { GroupInterfaceEditor } from './ui/components/GroupInterfaceEditor'
import { ChallengePanel } from './ui/pages/ChallengePanel'
import { loadSettings } from './app/settings/settings'
import { getAppVersion, getAppEnvironment } from './core/version'
import { createLogger } from './app/logging'
import { createPinoAdapter } from './app/logging/pinoAdapter'
import { WorkspaceShell } from './ui/WorkspaceShell'

function App() {
  let versionLabel = 'unknown'
  let environmentLabel = 'unknown'
  let logger = createPinoAdapter({
    baseBindings: { version: versionLabel, environment: environmentLabel },
  })

  try {
    const settings = loadSettings()
    versionLabel = getAppVersion(settings)
    environmentLabel = getAppEnvironment(settings)
    logger = createLogger(settings)
    logger.info('Settings loaded successfully', { version: versionLabel, environment: environmentLabel })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error('Failed to load settings; displaying fallback version label', { error: errorMessage })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">Logic Gates</span>
          <span className="brand-subtitle">React Flow V2</span>
        </div>
        <div className="header-actions">
          <span className="header-pill">Draft spec-driven build</span>
          <span className="header-pill version-pill" title={`Environment: ${environmentLabel}`}>
            v{versionLabel}
          </span>
        </div>
      </header>
      <main className="app-main">
        <aside className="app-sidebar">
          <Toolbar />
          <GroupInterfaceEditor />
          <ChallengePanel />
        </aside>
        <section className="app-canvas">
          <WorkspaceShell />
        </section>
      </main>
    </div>
  )
}

export default App
