import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates PWA icons from the placeholder mark: npx pwa-assets-generator
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
})
