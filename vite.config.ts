import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Ensure assets resolve correctly when hosted under /logic-gates/ on GitHub Pages
  base: process.env.BASE_URL ?? '/',
  plugins: [react()],
})
