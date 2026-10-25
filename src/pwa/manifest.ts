import type { ManifestOptions } from 'vite-plugin-pwa'

// Brand colours from the approved palette.
export const THEME_COLOR = '#FF933E'
export const BACKGROUND_COLOR = '#FFFBF3'

export function createManifest(base: string): Partial<ManifestOptions> {
  return {
    id: base,
    name: 'TNewIQ',
    short_name: 'TNewIQ',
    description: 'A personal technology radar built from trusted public sources.',
    lang: 'en',
    dir: 'ltr',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'any',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    categories: ['news', 'productivity'],
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
