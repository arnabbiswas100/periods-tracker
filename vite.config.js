import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 4090,
    host: true,
  },
  // Ensure sw.js and manifest are served from public/ untransformed
  publicDir: 'public',
})

