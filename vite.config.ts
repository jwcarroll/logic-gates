import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

const appVersion = process.env.VITE_APP_VERSION ?? process.env.npm_package_version ?? '0.0.0'

export default defineConfig({
  plugins: [solid()],
  base: process.env.BASE_URL || '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
})
