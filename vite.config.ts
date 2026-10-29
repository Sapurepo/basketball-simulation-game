import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import pkg from './package.json' with { type: 'json' }

const SITE = 'https://imthefinalmvp.app'

// sitemap.xml 의 하위 경로마다 index.html 을 복사해 canonical·og:url 을 그 주소로 맞춘다
// (Cloudflare Pages 는 /ranking 요청에 ranking.html 을 준다. 그 밖의 주소는 index.html 로 SPA 폴백)
function routePages(): Plugin {
  return {
    name: 'route-pages',
    apply: 'build',
    closeBundle() {
      const html = readFileSync('dist/index.html', 'utf8')
      const xml = readFileSync('public/sitemap.xml', 'utf8')
      for (const [, path] of xml.matchAll(
        /<loc>https:\/\/imthefinalmvp\.app\/([\w-]+)<\/loc>/g,
      )) {
        let out = html
        for (const attr of [
          'rel="canonical" href',
          'property="og:url" content',
        ]) {
          const from = `${attr}="${SITE}/"`
          if (!out.includes(from))
            throw new Error(`index.html 에 ${from} 이 없다`)
          out = out.replace(from, `${attr}="${SITE}/${path}"`)
        }
        writeFileSync(`dist/${path}.html`, out)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), routePages()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
