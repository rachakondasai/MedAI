import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,          // listen on 0.0.0.0 so ngrok can reach it
    allowedHosts: true, // allow *.ngrok-free.app and any other tunnel hosts
  },
  build: {
    sourcemap: true, // Enable source maps for production
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          'vendor-framer': ['framer-motion'],
          // Charts
          'vendor-charts': ['recharts'],
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
