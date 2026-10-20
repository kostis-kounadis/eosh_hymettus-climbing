import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'pwa-192x192.png',
        'pwa-512x512.png',
        'apple-touch-icon.png',
        'topos/kokkini-1-clean.webp',
        'topos/kokkini-1.webp',
        'topos/kokkini-2-clean.webp',
        'topos/kokkini-2.webp',
      ],
      manifest: {
        name: 'ΕΟΣ Ηλιούπολης — Αναρριχητικά Πεδία Υμηττού',
        short_name: 'ΕΟΣΗ Αναρρίχηση',
        description:
          'Διαδραστικός οδηγός αναρρίχησης & φωτο-τοπογράφημα για την Κόκκινη Πίστα Υμηττού (ΕΟΣ Ηλιούπολης)',
        theme_color: '#1e3a8a',
        background_color: '#f9fafb',
        display: 'standalone',
        lang: 'el',
        start_url: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});

