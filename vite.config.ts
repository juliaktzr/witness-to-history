import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from /<repo-name>/. Set VITE_BASE in the
// deploy workflow (e.g. "/witness-to-history/"). Locally it defaults to "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
})
