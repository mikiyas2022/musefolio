import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
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
      }
    }
  },
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
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
