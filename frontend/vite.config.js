import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dentro do docker-compose, o backend não é "localhost" (é o container
// api_backend). O host de destino do proxy vem de env pra não hardcodar
// dev local vs. Docker no mesmo arquivo.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
