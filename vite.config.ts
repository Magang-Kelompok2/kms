import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Pastikan ini ada

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tambahkan ini di sini
  ],
})