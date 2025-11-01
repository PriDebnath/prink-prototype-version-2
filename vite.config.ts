// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import routerPlugin  from '@tanstack/router-plugin/vite'

export default defineConfig({
  // https://vite.dev/config/
  // base: "./", // Set base to relative path for GitHub Pages
  base: '/prink-prototype-version-2/',  // for github pages
  plugins: [
    react(),
    routerPlugin(), // Generate the router code
    // VitePWA({
    //   registerType: 'autoUpdate',   // SW auto updates when you deploy a new build
    //   includeAssets: ['favicon.ico', 'robots.txt', 'offline.html'],
    //   manifest: {
    //     name: 'Prink 2.0',
    //     short_name: 'Prink 2.0',
    //     start_url: './',
    //     scope: './',
    //     display: 'standalone',
    //     background_color: '#ffffff',
    //     theme_color: '#000000',
    //     icons: [
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    //     runtimeCaching: [
    //       {
    //         // Any runtime requests (like API calls)
    //         urlPattern: ({ request }) => request.destination === 'document',
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'html-cache',
    //         },
    //       },
    //       {
    //         urlPattern: ({ request }) =>
    //           ['style', 'script', 'worker'].includes(request.destination),
    //         handler: 'StaleWhileRevalidate',
    //         options: {
    //           cacheName: 'assets-cache',
    //         },
    //       },
    //       {
    //         urlPattern: ({ request }) => request.destination === 'image',
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'images-cache',
    //           expiration: {
    //             maxEntries: 50,
    //             maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    //           },
    //         },
    //       },
    //     ],
    //   },
    // }),
  ],
})
