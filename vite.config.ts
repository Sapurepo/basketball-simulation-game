import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

// 화면에 표시할 빌드 정보: Cloudflare Pages 빌드면 커밋 SHA, 로컬이면 git HEAD
const sha =
  process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ??
  execSync('git rev-parse --short HEAD').toString().trim()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(sha),
  },
})
