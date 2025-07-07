// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5184', // 개발 중에는 로컬 서버 사용
    },
  },
  resolve: {
    dedupe: ['@emotion/react', '@emotion/styled'],
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled'],
  },
});