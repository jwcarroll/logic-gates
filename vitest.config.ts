import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

function getPackageVersion(): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url))
  const packageJsonPath = resolve(here, 'package.json')
  const raw = readFileSync(packageJsonPath, 'utf8')
  const parsed = JSON.parse(raw) as { version?: unknown }
  return typeof parsed.version === 'string' ? parsed.version : undefined
}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION ?? getPackageVersion() ?? '0.0.0'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    minWorkers: 1,
    maxWorkers: 1,
  },
})
