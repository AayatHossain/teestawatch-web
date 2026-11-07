import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built site works from any folder or a GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
