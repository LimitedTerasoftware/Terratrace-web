import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    // base: "/terratrace/",
    server: {
      proxy: {
        '/api/v1/': {
           target: 'https://traceapi.tricadtrack.com',
          // target: 'https://api.keeshondcoin.com',
          changeOrigin: true,
          secure: false,
        },
        // Uploaded files (VITE_Image_URL) read by the AT Word downloads: that server only
        // allows CORS from the production site, so in development they go through here.
        '/image-proxy/': {
          target: env.VITE_Image_URL ? new URL(env.VITE_Image_URL).origin : 'https://docs.tricadtrack.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/image-proxy/, ''),
        },
      },
    },
  }
})

