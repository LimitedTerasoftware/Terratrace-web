// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
// 	base: "/terratrace/",  
//     proxy: {
//       '/Tracking/api/v1': {
//         target: 'https://api.keeshondcoin.com',
//         changeOrigin: true,
//         secure: false, // Use `true` if the target has a valid SSL certificate
//       },
//     },
//   },
// });
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    // base: "/terratrace/",
    server: {
      proxy: {
        '/Tracking/api/v1': {
          target: 'https://traceapi.tricadtrack.com',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

