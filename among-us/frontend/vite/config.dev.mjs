import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // loadEnv reads .env so proxy target is configurable without hardcoding IPs
    const env = loadEnv(mode, process.cwd(), 'VITE_');

    // Single backend process serves Express API + Socket.IO on one port (default 3000).
    // Prefer VITE_PROXY_TARGET so client-side VITE_BACKEND_URL can stay unset in dev
    // (client then uses same-origin → this proxy). Fall back to VITE_BACKEND_URL / localhost.
    const backendTarget =
        env.VITE_PROXY_TARGET ||
        env.VITE_BACKEND_URL ||
        'http://localhost:3000';

    return {
        base: './',
        plugins: [
            react(),
        ],
        server: {
            port: 8080,
            proxy: {
                // Socket.IO (HTTP long-polling + WebSocket upgrade)
                '/socket.io': {
                    target: backendTarget,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
                // REST routes served by backend/src/routes/api.js
                '/status': {
                    target: backendTarget,
                    changeOrigin: true,
                    secure: false,
                },
                '/rooms': {
                    target: backendTarget,
                    changeOrigin: true,
                    secure: false,
                },
                '/player': {
                    target: backendTarget,
                    changeOrigin: true,
                    secure: false,
                },
                '/isImposter': {
                    target: backendTarget,
                    changeOrigin: true,
                    secure: false,
                },
            }
        }
    };
})
