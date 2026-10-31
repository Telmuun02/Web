import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // /api-аар эхэлсэн хүсэлтийг Express (:3000) руу дамжуулна
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
