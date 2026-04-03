import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Fix process is not defined error
    'process.env': {},
    global: {},
  },
  server: {
    port: 5174,
    host: true, // Allow external access
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  }
})