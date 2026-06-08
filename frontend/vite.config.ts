import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies API calls to the backend so the frontend always uses
// same-origin relative paths (e.g. `/api/resume`). This keeps the production
// CSP `connect-src 'self'` valid — in prod, Nginx/Pangolin route `/api` to the
// backend, so no cross-origin requests are ever made from the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
