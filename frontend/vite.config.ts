import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/media': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    },
    fs: {
      strict: false,
      allow: ['..'],
    }
  },
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add any required Node.js polyfills
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  optimizeDeps: {
    exclude: ['immutable'],
    include: ['react-draft-wysiwyg']
  },
  build: {
    rollupOptions: {
      external: ['immutable']
    }
  }
})
