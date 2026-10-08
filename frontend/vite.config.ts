import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Encaminha as chamadas da API para o backend FastAPI (backend/README.md).
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
