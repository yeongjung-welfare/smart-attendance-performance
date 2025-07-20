import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    // React Refresh 명시적 활성화
    fastRefresh: true,
    // Babel 설정 최적화
    babel: {
      plugins: []
    }
  })],
  server: {
    proxy: {
      '/api': 'https://smart-attendance-performance.onrender.com',
    },
    port: 5177,
    host: true,
  },
  resolve: {
    dedupe: ['@emotion/react', '@emotion/styled'],
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled'],
  },
});
