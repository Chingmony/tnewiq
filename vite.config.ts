/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { createManifest } from './src/pwa/manifest.ts'

// Vercel serves the site from the domain root; GitHub Pages would serve it at /tnewiq/. BASE_PATH overrides both.
const base = process.env.BASE_PATH ?? (process.env.VERCEL ? '/' : '/tnewiq/')

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt" lets the user choose when to reload into a new version instead of swapping code mid-session.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: createManifest(base),
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // AI briefings: one small file per story, rarely changed. Serve the cached copy and refresh in the background.
            urlPattern: ({ url }) => url.pathname.startsWith(`${base}data/insights/`),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tnewiq-insights',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Article data: try the network first, fall back to the last cached copy when offline.
            urlPattern: ({ url }) => url.pathname.startsWith(`${base}data/`) && url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tnewiq-data',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
})
