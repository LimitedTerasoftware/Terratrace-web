import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    // base: "/terratrace/",
    server: {
      proxy: {
        '/api/v1': {
           target: 'https://traceapi.tricadtrack.com',
          // target: 'https://api.keeshondcoin.com',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

