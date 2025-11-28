import type { Component } from 'solid-js';
import { Canvas } from './components/Canvas';
import './App.css';

const App: Component = () => {
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0';

  return (
    <div class="app">
      <header class="app-header">
        <h1>Logic Gate Simulator v{appVersion}</h1>
      </header>
      <main class="app-main">
        <Canvas />
      </main>
    </div>
  );
};

export default App;
