import type { Component } from 'solid-js';
import { Canvas } from './components/Canvas';
import './App.css';

const App: Component = () => {
  return (
    <div class="app">
      <header class="app-header">
        <h1>Logic Gate Simulator</h1>
      </header>
      <main class="app-main">
        <Canvas />
      </main>
    </div>
  );
};

export default App;
