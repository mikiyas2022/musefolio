import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    strictPort: true, // Fail if port is already in use
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: false,
      allow: ['..'],
    }
  },
  // Ensure static assets are properly handled
  publicDir: path.resolve(__dirname, './public'),
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Copy all files from public directory
    copyPublicDir: true,
    // Generate sourcemaps for easier debugging
    sourcemap: true,
    rollupOptions: {
      external: ['immutable']
    }
  },
  // Resolve aliases for cleaner imports
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
  define: {
    global: 'window',
  },
})
