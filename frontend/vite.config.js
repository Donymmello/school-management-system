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
    // Quando a porta publicada no host difere da que o Vite escuta dentro do
    // container, o cliente de HMR precisa de saber a de fora — senão tenta a
    // 5173 e o websocket de hot reload nunca liga. Fora do Docker a variável
    // não existe e o Vite mantém o comportamento por omissão.
    hmr: process.env.VITE_HMR_CLIENT_PORT
      ? { clientPort: Number(process.env.VITE_HMR_CLIENT_PORT) }
      : undefined,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
