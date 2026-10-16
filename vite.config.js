import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Durante el desarrollo, /api y /img se redirigen al servidor Express local
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/img': 'http://localhost:3000',
    },
  },
})
