import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// En desarrollo /api y /uploads se redirigen al backend Node (../backend)
// changeOrigin: false conserva el Host original (el backend lo compara con Origin)
const API = { target: process.env.API_PROXY || 'http://127.0.0.1:3100', changeOrigin: false }

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/uploads': API
    }
  }
})
