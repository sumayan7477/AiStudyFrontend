import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // The API's CORS policy allows exactly http://localhost:5173.
    // strictPort makes Vite fail instead of silently moving to 5174 (which CORS would block).
    port: 5173,
    strictPort: true,
  },
})
