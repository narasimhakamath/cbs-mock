import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/cbs/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/cbs/api': {
        target: 'http://localhost:4000',
        rewrite: (path) => path.replace(/^\/cbs/, ''),
      },
    },
  },
})
