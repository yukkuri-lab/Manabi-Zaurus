import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const base = loadEnv(mode, '.', '').VITE_BASE_PATH || '/'
  return {
    base,
    plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
      manifest: {
        name: 'かんじザウルス 〜 まぼろしの ティラノを さがせ！ 〜',
        short_name: 'かんじザウルス',
        description: '恐竜を漢字の手がかりで助けながら、まぼろしのティラノを探す冒険RPG',
        theme_color: '#173f35',
        background_color: '#fff8dc',
        display: 'standalone',
        orientation: 'any',
        lang: 'ja',
        start_url: base,
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      },
      devOptions: { enabled: false }
    })
  ],
    test: {
      environment: 'jsdom',
      globals: true
    }
  }
})
