import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function getPackageVersion(): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url))
  const packageJsonPath = resolve(here, 'package.json')
  const raw = readFileSync(packageJsonPath, 'utf8')
  const parsed = JSON.parse(raw) as { version?: unknown }
  return typeof parsed.version === 'string' ? parsed.version : undefined
}

// https://vite.dev/config/
export default defineConfig(() => {
  const packageVersion = getPackageVersion()
  const appVersion = process.env.VITE_APP_VERSION ?? packageVersion ?? '0.0.0'

  return {
    // Ensure assets resolve correctly when hosted under /logic-gates/ on GitHub Pages
    base: process.env.BASE_URL ?? '/',
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [react()],
  }
})
