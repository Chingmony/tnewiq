import type { ManifestOptions } from 'vite-plugin-pwa'

// Colours and icons are placeholders until the visual direction is approved.
export const PLACEHOLDER_THEME_COLOR = '#ffffff'

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
    background_color: PLACEHOLDER_THEME_COLOR,
    theme_color: PLACEHOLDER_THEME_COLOR,
    categories: ['news', 'productivity'],
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
