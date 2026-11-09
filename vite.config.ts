import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Identificador único de cada build, usado pelo check de versão em
// PwaUpdatePrompt.tsx (ver comentário lá) — uma segunda trava independente
// do ciclo de vida do service worker, pra quando ele sozinho não é
// suficiente pra entregar a versão nova (relatado várias vezes por usuário
// real em iOS Safari instalado).
const BUILD_ID = String(Date.now())

function versionJsonPlugin(): Plugin {
  return {
    name: 'phoneitz-version-json',
    apply: 'build',
    writeBundle(options) {
      writeFileSync(resolve(options.dir ?? 'dist', 'version.json'), JSON.stringify({ buildId: BUILD_ID }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    tailwindcss(),
    versionJsonPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'PHONEITZ',
        short_name: 'PHONEITZ',
        description: 'Gestão de loja de celulares: estoque por IMEI, vendas com margem real e trade-in, na palma da mão.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#ad5c2f',
        background_color: '#f8fafc',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
