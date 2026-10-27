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

정적 SPA라 Cloudflare Pages가 저장소를 직접 빌드한다. 세이브가 localStorage(도메인 단위)에 있으므로 **배포 주소를 바꾸면 기존 유저의 세이브가 사라진다.** 주소는 처음 정한 것을 계속 쓴다.

| 항목 | 값 |
| --- | --- |
| 운영 브랜치 | `main` (베타 운영) — `dev` 와 PR 은 미리보기 배포 |
| 빌드 명령 / 출력 | `pnpm build` / `dist` |
| Node / pnpm | `.nvmrc`(26) / `package.json` 의 `packageManager` |
| 환경 변수 | `VITE_FEEDBACK_URL` (선택) — 있으면 푸터에 "피드백 보내기" 링크 |
| 헤더 | `public/_headers` — 에셋 1년 캐시, `index.html` no-cache, CSP 등 보안 헤더 |

- 머지 전 확인: GitHub Actions(`.github/workflows/ci.yml`)가 lint → typecheck → test → build 를 돌린다.
- 배포 흐름: `dev` 에서 작업 → 미리보기 URL 로 QA → `dev → main` PR 머지 → 운영 배포. 문제가 생기면 Cloudflare 대시보드에서 이전 배포로 롤백한다.
- 외부 리소스를 추가하면 `public/_headers` 의 CSP 허용 목록도 함께 고친다 (현재: Google Fonts, jsDelivr).
- 푸터에 `v<버전> · <커밋>` 이 표시된다. 버전은 `package.json`, 커밋은 Cloudflare 빌드의 `CF_PAGES_COMMIT_SHA`.

