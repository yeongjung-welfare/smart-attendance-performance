// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';  // ⬅️ 이 줄만 추가

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: []
      }
    }),
    // ⬅️ 아래 PWA 플러그인만 추가 (기존 react 플러그인 설정 완전 보존)
    VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['vite.svg'],
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    maximumFileSizeToCacheInBytes: 3000000, // 3MB로 증가 (기존: 2MB)
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts-stylesheets',
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
          }
        }
      }
    ]
  },
      manifest: {
        name: '영중 출석 및 실적 관리 시스템',
        short_name: '영중 회원 등록 관리',
        description: '스마트한 출석 및 실적 관리를 위한 웹 애플리케이션',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // ✅ 빌드 설정 개선 (새로 추가)
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 3000, // 3MB로 경고 한도 증가
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'mui': ['@mui/material', '@mui/icons-material'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  
  // ✅ 프리뷰 서버 설정 (새로 추가)
  preview: {
    port: 4173,
    host: true,
    cors: true
  },
  // ⬅️ 기존 설정들 완전 보존
  server: {
    proxy: {
      '/api': 'https://smart-attendance-performance.onrender.com',
    },
    port: 5178,
    host: true,
  },
  resolve: {
    dedupe: ['@emotion/react', '@emotion/styled'],
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled', '@mui/material'],
    force: true
  },
});
