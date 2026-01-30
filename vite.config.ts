import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Flowna-Config/',
  server: {
    port: 3000
  }
})
