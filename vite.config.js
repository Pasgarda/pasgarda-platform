import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        optimizeDeps: {
            exclude: ['env'],
        },
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.jsx'],
                refresh: true,
                fonts: [
                    bunny('Instrument Sans', {
                        weights: [400, 500, 600],
                    }),
                ],
            }),
            react(),
            tailwindcss(),
        ],
        server: {
            host: env.VITE_HOST || '127.0.0.1',
            port: env.VITE_PORT || 5173,
            origin: env.VITE_ORIGIN || undefined,
            cors: true,
            allowedHosts: true,
            hmr: {
                host: env.VITE_HMR_HOST || null,
                overlay: false,
            },
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
            proxy: {
                '/': {
                    target: env.LARAVEL_URL || 'http://127.0.0.1:8000',
                    changeOrigin: true,
                    bypass(req) {
                        const url = req.url;
                        if (
                            url.startsWith('/@vite/') ||
                            url.startsWith('/resources/') ||
                            url.startsWith('/@react-refresh') ||
                            url.startsWith('/node_modules/') ||
                            url.startsWith('/__vite_')
                        ) {
                            return url;
                        }
                    },
                },
            },
        },
    };
});
