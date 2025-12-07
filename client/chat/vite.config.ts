import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Taskify',
        short_name: 'Taskify',
        description: 'A modern Chatting app',
        theme_color: '#ffffff',

        icons: [
          {
            src: 'icons/logo-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/logo-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      }
    })
  ]
})
