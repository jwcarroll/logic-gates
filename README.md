# Logic Gate Simulator

An interactive web-based logic gate simulator built with SolidJS. Create, connect, and test digital logic circuits directly in your browser with support for mobile and touch devices.

## Features

- **Interactive Circuit Building**: Drag and drop logic gates, switches, and lights
- **Multiple Gate Types**: AND, OR, NOT, NAND, NOR, XOR, XNOR
- **Real-time Signal Propagation**: Watch signals flow through your circuits
- **Import/Export**: Save and load circuits as JSON files
- **Touch-Friendly**: Full support for mobile devices with pan and pinch-to-zoom
- **Wire Management**: Click ports to create connections between components

## Quick Start

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Using the Simulator

1. **Add Components**: Use the toolbar to add switches (inputs), logic gates, and lights (outputs)
2. **Connect Components**: Click on a port (circle) on one component, then click on a port on another to create a wire
3. **Test Your Circuit**: Toggle switches to see the signals propagate through your circuit
4. **Move Components**: Drag components to rearrange your circuit
5. **Delete Components**: Select a component and press Delete or use the Delete Selected button

### Touch Controls

- **Single finger drag**: Move components
- **Two finger pan**: Move the canvas
- **Pinch to zoom**: Zoom in/out on the canvas

### Import/Export

Save your circuits as JSON files to share or reuse later:
- Click **Export** to download your current circuit
- Click **Import** to load a saved circuit

Try importing `half-adder-example.json` to see a working half adder circuit!

## Project Structure

```
src/
├── components/        # UI components (Canvas, Toolbar, Gate, Switch, Light, Wire)
├── store/            # State management (circuitStore.ts)
├── types/            # TypeScript type definitions
├── utils/            # Helper functions
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Deployment

Learn more about deploying your application with the [documentations](https://vite.dev/guide/static-deploy.html)
