import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'


import tailwind from "tailwindcss"
import autoprefixer from "autoprefixer"


// https://vitejs.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    assetsDir: "static",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/node_modules/vuedraggable')) {
            return 'vendor_vuedraggable';
          } else if (id.includes('/node_modules/mathjs')) {
            return 'vendor_mathjs';
          }else if (id.includes('/node_modules/@vue')) {
            return 'vendor_@vue';
          } else if (id.includes('/node_modules/')) {
            return 'vendors';
          } else {
            return 'index';
          }
        },
      },
    },
  },
})
