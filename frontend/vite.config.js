/* eslint-env node */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const frontendDir = dirname(fileURLToPath(import.meta.url))
const rootEnvDir = resolve(frontendDir, '..')

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, rootEnvDir, '')
  const env = { ...rootEnv, ...process.env }
  const devApiUrl = env.VITE_DEV_API_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    envDir: rootEnvDir,
    base: env.VITE_BASE_PATH || '/',
    server: {
      proxy: {
        '/api': {
          target: devApiUrl,
          changeOrigin: true,
        },
        '/media': {
          target: devApiUrl,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: devApiUrl,
          changeOrigin: true,
        },
        '/media': {
          target: devApiUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
