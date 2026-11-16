import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [react(), tailwindcss(), cesium()],
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