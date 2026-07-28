import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { STATIC_PATHS, buildSitemapXml, datasetPaths } from './scripts/sitemap'

// Generated at build time so new entries in dataset_card_info.json reach the
// sitemap without anyone remembering to edit it.
function sitemap(): Plugin {
  return {
    name: 'glucose-ml-sitemap',
    apply: 'build',
    generateBundle() {
      const cards = JSON.parse(
        readFileSync(
          new URL('./public/static_data/dataset_card_info.json', import.meta.url),
          'utf8'
        )
      ) as { title: string }[]

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemapXml([
          ...STATIC_PATHS,
          ...datasetPaths(cards.map((card) => card.title)),
        ]),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sitemap()],
})
