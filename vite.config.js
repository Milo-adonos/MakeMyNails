import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor'
            if (id.includes('lucide-react')) return 'icons'
          }
        },
      },
    },
  },
})
