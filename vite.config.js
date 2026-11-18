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
        theme_color: "royalblue",
        background_color: "white",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globIgnores: ["cesium/**"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/opensky-/],
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