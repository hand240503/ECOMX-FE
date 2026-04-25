import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      /** OSRM public — tránh CORS khi dev; production cần proxy backend hoặc tự host. */
      '/osrm': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/osrm/, '')
      },
      /** Nominatim — thêm User-Agent theo yêu cầu dịch vụ. */
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/nominatim/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'ecomx-fe-map-dev/0.0 (dev geocoding; contact project maintainer)'
            );
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@styles': '/src/styles',
      '@utils': '/src/utils',
      '@data': '/src/data',
      '@hooks': '/src/hooks'
    }
  }
})