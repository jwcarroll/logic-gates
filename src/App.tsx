import './App.css'
import { Canvas } from './ui/components/Canvas'
import { Toolbar } from './ui/components/Toolbar'
import { ChallengePanel } from './ui/pages/ChallengePanel'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">Logic Gates</span>
          <span className="brand-subtitle">React Flow V2</span>
        </div>
        <div className="header-actions">
          <span className="header-pill">Draft spec-driven build</span>
        </div>
      </header>
      <main className="app-main">
        <aside className="app-sidebar">
          <Toolbar />
          <ChallengePanel />
        </aside>
        <section className="app-canvas">
          <Canvas />
        </section>
      </main>
    </div>
  )
}

export default App
