import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      VitePWA({
        injectRegister: false,
        registerType: 'prompt',
        includeAssets: [
          'apple-touch-icon.png',
          'icon.svg',
          'icon-maskable.svg',
        ],
        manifest: {
          name: 'Water Tracker — трекер гидратации',
          short_name: 'Water Tracker',
          description: 'Автономный трекер напитков и эффективной гидратации',
          theme_color: '#07968d',
          background_color: '#e9f8f5',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: './',
          scope: './',
          lang: 'ru',
          categories: ['health', 'lifestyle'],
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
      }),
    ],
  };
});
