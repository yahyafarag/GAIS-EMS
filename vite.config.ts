
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'EMS - Enterprise Maintenance System',
        short_name: 'EMS Pro',
        description: 'نظام إدارة الصيانة المؤسسي الذكي',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ar',
        dir: 'rtl',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/906/906319.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/906/906319.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'], // Critical: Cache all build assets
        cleanupOutdatedCaches: true,
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts-cache',
                    expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60 * 60 * 24 * 365
                    },
                    cacheableResponse: {
                        statuses: [0, 200]
                    }
                }
            },
            {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'gstatic-fonts-cache',
                    expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60 * 60 * 24 * 365
                    },
                    cacheableResponse: {
                        statuses: [0, 200]
                    }
                }
            },
            {
                // Cache specific external images if needed, but be careful with CORS
                urlPattern: /^https:\/\/picsum\.photos\/.*/i,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'demo-images',
                    expiration: { maxEntries: 20, maxAgeSeconds: 3600 }
                }
            }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000
  }
});
