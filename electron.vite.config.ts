import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const sharedAliases = {
  '@renderer': resolve('src/renderer/src'),
  '@main': resolve('src/main'),
  '@preload': resolve('src/preload'),
  '@shared': resolve('src/shared'),
  '@assets': resolve('assets')
}

export default defineConfig({
  main: {
    resolve: {
      alias: { ...sharedAliases }
    },
    plugins: [
      externalizeDepsPlugin({
        // Explicitly externalize koffi and other potential native deps
        exclude: []
      })
    ],
    build: {
      rollupOptions: {
        external: ['koffi']
      }
    }
  },
  preload: {
    resolve: {
      alias: { ...sharedAliases }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: { ...sharedAliases }
    },
    plugins: [react(), tailwindcss()]
  }
})
