// vite.config.ts 의 define 으로 주입되는 빌드 정보
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  // 베타 피드백 링크 (Cloudflare Pages 환경 변수). 없으면 링크를 숨긴다
  readonly VITE_FEEDBACK_URL?: string
}
