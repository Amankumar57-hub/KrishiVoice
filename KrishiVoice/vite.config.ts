import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'KrishiVoice',
        short_name: 'KrishiVoice',
        description: 'Empowering farmers with voice-powered crop listings.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'krishivoice-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'krishivoice-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/]
      }
    })
  ],
})
