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
  - `mainScreen.tsx` 시즌 진행(전체 화면 로딩)·주요 경기 하이라이트 팝업·중계·시즌 베스트(리그 퍼스트~서드 팀)·기록, `shootout.tsx` 오프시즌 슈팅 미니게임
- `docs/dataSources.md` — 실제 데이터 출처와 근사치 목록

저장은 브라우저 localStorage에만 한다. "새로운 인생 시작하기"로 끝낸 커리어는 명예의 전당(최고 오버롤 순 10명)에 남아 랜딩에 표시된다. 기기를 옮길 때는 저장 파일 내보내기/가져오기를 쓴다.
