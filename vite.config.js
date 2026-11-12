import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
      "/currency-convert": {
        target: "https://api.frankfurter.dev/v2/rate",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/currency-convert/, ""),
      },
    },
  },
});