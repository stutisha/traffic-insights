import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(),
    tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  server: { 
    proxy: {
      '/api': { // Requests starting with /api forwwarded to localhost:3000 i.i. my backend
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
