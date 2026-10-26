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
  - `player.ts` 능력치·오버롤·성장, `sim.ts` 경기·박스스코어, `commentary.ts` 텍스트 중계
  - `season.ts` 무대별 시즌·플레이오프·수상, `events.ts` 오프시즌 선택지(진학·드래프트·FA·NBA 도전·은퇴)
  - `game.ts` 공개 API(`newGame`/`advanceSeason`/`resolveEvent`), `save.ts` 로컬 저장·파일 내보내기
- `src/data/` — 학교(실명), 구단(변형 명칭), 리그 보정 수치
- `src/ui/` — React 화면
  - `landingScreen.tsx` 랜딩(소개·마일스톤·명예의 전당·시작 CTA), `createScreen.tsx` 선수 생성 4단계(아바타 → 기본 정보 → 스카우팅 리포트 → 집중 능력치)
  - `mainScreen.tsx` 시즌 진행·중계·기록
- `docs/dataSources.md` — 실제 데이터 출처와 근사치 목록

저장은 브라우저 localStorage에만 한다. "새로운 인생 시작하기"로 끝낸 커리어는 명예의 전당(최고 오버롤 순 10명)에 남아 랜딩에 표시된다. 기기를 옮길 때는 저장 파일 내보내기/가져오기를 쓴다.
