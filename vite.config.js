import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import cesium from "vite-plugin-cesium";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cesium(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Anga360",
        short_name: "Anga360",
        description: "Live flight information and trip linking",
        theme_color: "#4169e1",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "launchericon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "launchericon-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "launchericon-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      includeAssets: ["anga360-logo.jpeg", "favicon.svg", "apple-touch-icon.png"],
      workbox: {
        globIgnores: ["cesium/**"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/opensky-/, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/opensky-"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url }) => url.pathname === "/api/flights",
            handler: "NetworkFirst",
            options: {
              cacheName: "flight-search",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === "open.er-api.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fx-rates",
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/cesium/"),
            handler: "CacheFirst",
            options: {
              cacheName: "cesium-static",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/opensky-auth": {
        target: "https://auth.opensky-network.org",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/opensky-auth/, ""),
      },
      "/opensky-api": {
        target: "https://opensky-network.org",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/opensky-api/, ""),
      },
    },
  },
});
