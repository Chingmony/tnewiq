import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates PWA icons from the logo mark: npx pwa-assets-generator
// Padded icons (maskable, Apple) get the brand orange behind the mark instead of white.
const orange = { background: '#FF933E', fit: 'contain' } as const

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: orange },
    apple: { ...minimal2023Preset.apple, resizeOptions: orange },
  },
  images: ['public/favicon.svg'],
})
