import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Use default esbuild minifier instead of experimental oxc
    minify: 'esbuild',
    // Ensure compatibility with Vercel
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // Optimize dependencies for better build performance
  optimizeDeps: {
    include: ['react', 'react-dom', 'html2canvas', 'jspdf']
  }
})