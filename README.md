# basketball-simulation-game

**벤치에서 파엠까지** — 한국 고교 농구부에서 시작해 대학, KBL, NBA를 거쳐 파이널 MVP를 노리는 브라우저 농구 커리어 시뮬레이션.

## 실행

```bash
pnpm install
pnpm dev        # 개발 서버
pnpm test       # 엔진 테스트 (전체 커리어 자동 플레이 포함)
pnpm lint && pnpm typecheck && pnpm format
```

## 구조

- `src/engine/` — 순수 TS 시뮬레이션 엔진 (UI 의존 없음)
  - `player.ts` 능력치·오버롤·성장(전성기 31~34세, 34세부터 급격한 노쇠), `sim.ts` 경기·박스스코어, `commentary.ts` 텍스트 중계
  - `season.ts` 무대별 시즌·플레이오프·수상, `events.ts` 오프시즌 선택지(진학·드래프트·FA·NBA 도전·은퇴)
  - `game.ts` 공개 API(`newGame`/`advanceSeason`/`resolveEvent`), `save.ts` 로컬 저장·파일 내보내기
- `src/data/` — 학교·구단(실명), 리그 보정 수치
- `public/logos/` — KBL·NBA 리그 및 구단 로고. 권리는 각 권리자에게 있으며 비상업 팬 프로젝트 용도로만 쓴다
- `src/ui/` — React 화면
  - `landingScreen.tsx` 랜딩(소개·마일스톤·명예의 전당·시작 CTA), `createScreen.tsx` 선수 생성 4단계(아바타 → 기본 정보 → 스카우팅 리포트 → 집중 능력치)
  - `mainScreen.tsx` 시즌 진행(전체 화면 로딩)·주요 경기 하이라이트 팝업·중계·시즌 베스트(리그 퍼스트~서드 팀)·기록, `trainingPanel.tsx` 시즌 전 훈련(슈팅·패스·드리블 미니게임, 종류별 오프시즌 1회)
- `docs/dataSources.md` — 실제 데이터 출처와 근사치 목록

저장은 브라우저 localStorage에만 한다. "새로운 인생 시작하기"로 끝낸 커리어는 명예의 전당(최고 오버롤 순 10명)에 남아 랜딩에 표시된다. 기기를 옮길 때는 저장 파일 내보내기/가져오기를 쓴다.

## 베타 배포 (Cloudflare Pages)

Cloudflare Pages가 저장소를 직접 빌드한다. 게임은 정적 SPA이고, 공용 명예의 전당만 Pages Functions(`functions/`)와 D1을 쓴다. 세이브가 localStorage(도메인 단위)에 있으므로 **배포 주소를 바꾸면 기존 유저의 세이브가 사라진다.** 주소는 처음 정한 것을 계속 쓴다.

| 항목 | 값 |
| --- | --- |
| 운영 브랜치 | `dev` — push 하면 바로 운영 배포. 그 밖의 브랜치와 PR 은 미리보기 배포 |
| 빌드 명령 / 출력 | `pnpm build` / `dist` |
| Node / pnpm | `.nvmrc`(26) / `package.json` 의 `packageManager` |
| 환경 변수 | `VITE_FEEDBACK_URL` (선택) — 있으면 푸터에 "피드백 보내기" 링크 |
| 암호화 변수 | `TURNSTILE_SECRET` — Turnstile 위젯 `bench-to-mvp-hall` 의 시크릿 키 (대시보드에서 직접 입력) |
| 바인딩 | `wrangler.toml` 이 기준 — D1 `bench-to-mvp-hall` → `DB` |
| 헤더 | `public/_headers` — 에셋 1년 캐시, `index.html` no-cache, CSP 등 보안 헤더 |

- 머지 전 확인: GitHub Actions(`.github/workflows/ci.yml`)가 lint → typecheck → test → build 를 돌린다.
- 배포 흐름: `dev` 에 push → 운영 배포. 큰 변경은 별도 브랜치의 미리보기 URL 로 먼저 QA 한다. 문제가 생기면 Cloudflare 대시보드에서 이전 배포로 롤백한다.
- 저장소가 비공개면 Pages 가 저장소를 받지 못해 배포가 실패한다(`Repository not found`). 비공개로 돌리려면 Pages 프로젝트가 쓰는 GitHub 앱 설치(설정의 Git 저장소 옆 Manage)에 이 저장소 접근을 먼저 허용한다.
- 외부 리소스를 추가하면 `public/_headers` 의 CSP 허용 목록도 함께 고친다 (현재: Google Fonts, jsDelivr, Turnstile).
- 푸터에 `v<버전>` 이 표시된다. 버전은 `package.json`.

### 검색엔진·공유 미리보기

- 대표 주소는 `https://bench-to-mvp.pages.dev/`. `index.html` 의 canonical·og:url·JSON-LD 와 `public/robots.txt`·`public/sitemap.xml` 에 같은 주소를 쓴다. 도메인을 바꾸면 이 다섯 곳을 함께 고친다.
- 미리보기 배포 주소는 `public/_headers` 의 `X-Robots-Tag: noindex` 로 검색에서 뺀다.
- OG 이미지(`public/og.png`, 1200×630)와 홈 화면 아이콘(`public/apple-touch-icon.png`)은 `scripts/og/` 의 장면을 캡처해 만든다. `pnpm dev` 를 띄운 뒤 `scripts/og/render.sh http://localhost:5173` 를 실행한다 (Playwright 의 헤드리스 Chromium 사용, 다른 경로는 `CHROME=` 으로 지정).
- Google Search Console·네이버 서치어드바이저 소유 확인 메타 태그는 `index.html` 의 표시된 자리에 넣고, 등록 후 sitemap 을 제출한다.

### 공용 명예의 전당 (D1 + Turnstile)

- 스키마는 `migrations/` 에 둔다. 새 마이그레이션은 `pnpm dlx wrangler d1 migrations apply bench-to-mvp-hall --remote` 로 운영 DB 에 적용한다.
- 로컬 확인: `pnpm build` → `pnpm dlx wrangler d1 migrations apply bench-to-mvp-hall --local` → `pnpm dlx wrangler pages dev dist`. `.dev.vars` 에 `TURNSTILE_SECRET=1x0000000000000000000000000000000AA` (Cloudflare 테스트 키, 항상 통과)를 둔다. 로컬 호스트에서는 클라이언트도 테스트 사이트 키를 쓴다.
- 미리보기 배포도 같은 D1 을 쓰므로, 미리보기에서 등록한 기록은 운영 명예의 전당에 그대로 남는다.
- 기록 삭제 요청은 D1 콘솔에서 `DELETE FROM hall WHERE id = '...'` 로 처리한다.

