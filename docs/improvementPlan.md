# 4차 피드백 개선 계획 (23~27)

2026-10-29 피드백 5건의 작업 계획. 항목을 끝내면 `[x]` 로 바꾸고 커밋 해시를 적는다. 계산식·확률의 정본은 `docs/engines.md`, 확률표는 `src/data/odds.ts`.

상태 표기: `[ ]` 대기 · `[~]` 진행 중 · `[x]` 완료 · `[-]` 보류/제외

## 요약

| #   | 항목                                | 크기 | 상태 | 결정 필요 |
| --- | ----------------------------------- | ---- | ---- | --------- |
| 26  | 중계 결과 스포 방지 + 출전시간 표시 | 소형 | [x]  | —         |
| 27  | 명예의 전당 정렬 다양화             | 중형 | [x]  | ① 결정됨  |
| 25  | 아이템 다양화 (저가·능력치 분배)    | 중형 | [ ]  | ②         |
| 24  | 훈련 다양화 + 3개 제공 + 자동훈련   | 대형 | [x]  | ③ 결정됨  |
| 23  | 잠재 특성 세분화 + 등급 균등 + 숨김 | 대형 | [ ]  | ④ ⑤       |

권장 순서: **26 → 27 → 25 → 24 → 23**. 작은 것부터, 밸런스 결정이 필요한 23은 마지막(24가 끝나야 훈련 수가 정해진다). 항목마다 커밋 1개, 끝에 `changelog.ts` 1.4.0·`engines.md`·`odds.ts` 갱신 커밋 1개.

검증 게이트: 항목마다 `pnpm lint && pnpm typecheck && pnpm test`. 엔진 변경(23·24)은 `src/engine/testBot.ts` 로 재측정해 `engines.md` 11장 갱신. 커밋은 `/commit-push` 로 그룹 확인 후.

---

## 26. 중계 결과 스포 방지 + 출전시간 표시

스포가 나는 지점 두 곳(2026-10-29 확인):

1. `src/ui/mainScreen.tsx` 하이라이트 팝업 — 뒤에 깔린 메인 화면이 이미 다음 시즌 상태(우승 뱃지·최근 경기 점수·승패)로 바뀐 뒤 뜨고, `.modal::backdrop` 이 반투명(0.55)이라 결과가 비친다.
2. `src/engine/events.ts` 아시안게임 결과 이벤트(`data: { game: r.last }`) — 제목·본문("아시안게임 금메달 / 대한민국 금메달…")이 중계 **위에** 먼저 나온다.

- [x] `.modal.highlight::backdrop` 만 불투명하게(0.97)
- [x] `GameCast` 에 `onDone` 추가(라이브·텍스트 중계 모두). 이벤트 패널은 `data.game` 이 있으면 중계가 끝난 뒤 제목·본문을 표시. 끝난 시점의 이벤트 큐 길이를 기억해 다음 이벤트에서는 다시 숨긴다
- [x] 출전시간: 라이브 박스스코어 맨 앞에 `MIN` 칸. 장면에는 출전시간이 없어 경기 시각에 비례해 쌓고(`box.minutes × T/total`), 끝나면 기록값과 정확히 맞춘다. 시계가 흐르는 동안(출전 중)은 `m:ss` 로 초를 세고 붉은 점이 깜빡이며, 일시정지·쿼터 사이·종료에는 분 숫자만. 칸이 8개가 되어 좁은 화면에서는 `flex-wrap` 으로 두 줄
- [x] i18n en·ja 키 추가

## 27. 명예의 전당 정렬 다양화

- [x] `migrations/0002_hall_stats.sql`: `kbl`·`nba INTEGER`(0/1), `earnings INTEGER`(KRW 환산 만원, USD 는 1,400원), `minutes`·`pts`·`ast INTEGER`(정규시즌 통산) 추가. 기존 행은 NULL → 정렬은 `NULLS LAST`, 리그 필터에서는 빠진다
- [x] `src/engine/hallEntry.ts` payload 필드·검증(시즌당 상한: 수입 1천억 원·출전 5,000분·6,000점·3,000어시). `USD_TO_MANWON` 을 여기로 옮기고 `game.ts` 가 가져다 쓴다
- [x] `functions/api/hall.ts` `ORDER` 6종(ovr·fmvp·earnings·minutes·pts·ast) + `league=KBL|NBA` 필터(`total` 도 필터 기준). 캐시 키에 리그 포함, 등록 후 6×3×2 키 삭제
- [x] `src/ui/hallApi.ts` `SORTS`·`LEAGUES` 확장, `rowDetail`(정렬 기준값을 맨 앞에)·`statText`·`compareRows`. `rankingScreen.tsx` 주소 `?sort=&league=`, 리그 칩은 랭킹 화면에만(랜딩은 정렬 칩만)
- [x] `HallPlayerDialog` 에 통산 4칸(수입·출전·득점·어시스트) 2×2 — 값이 있을 때만
- [x] 내 기록(`save.ts` `HallEntry`)도 같은 4개 필드 저장(이전 기록은 optional)
- [x] `hallEntry.test.ts` 검증 보강. 마이그레이션·정렬·필터 SQL 은 로컬 sqlite3 로 확인
- [ ] **배포 전** 운영 D1 에 `pnpm dlx wrangler d1 migrations apply bench-to-mvp-hall --remote` (README 참고). 적용 전에 새 코드가 배포되면 등록 INSERT 가 열 없음으로 실패한다

**결정 ①** (2026-10-29) 리그는 AND — KBL·NBA 둘 다 뛸 수 있으므로 각각 한 시즌이라도 뛰었으면 양쪽 필터에 다 나온다. `kbl`·`nba` 두 열.

## 25. 아이템 다양화

현재 최저가 8,500만원. 고교 자금은 300만 + 연 100만, 대학 연 300만이라 고교·대학 땐 살 게 없다. 버프 대상도 리바운드·수비가 비어 있다.

- [ ] (A) 저가 벽지·바닥 6종(50~500만원, 성장 +0.05). CSS 배경(`bg`)이라 아트 작업 없음
- [ ] (B) 새 종류 `gear`(훈련 용품) 6종, 300~3,000만원, 각 +1 버프. 무대에 배치하지 않고 아이콘만(`sprite.ts` `ICONS` 에 12×12 픽셀 6개)
  - 저항밴드(athleticism) · 점프로프(speed) · 리바운드 패드(rebounding) · 수비 슬라이드 콘(defense) · 슈팅 슬리브(shooting) · 패스 벽(playmaking)
- [ ] `shop.tsx` `KINDS`·탭 라벨·`kindLabel`/`whereLabel`/`ownedStatus` 분기, `items.test.ts`
- [ ] `engines.md` 9장 상점 표, `odds.ts`

**결정 ②** A+B 둘 다 / A 만 / B 만.

## 24. 훈련 다양화 + 4개 제공 + 자동훈련

2026-10-29 설계 핸드오프(claude.ai/design `templates/training/Training.dc.html`, `train-art.js`) 기준으로 구현.

- [x] `DRILLS` 11종(`ft·mid·three·pass·team·reb·drib·foot·react·bench·squat`), 6종목(`DRILL_CATS`), 조작 7종(`DrillCtl`). `DRILL_MAX = 4`, `DRILL_NEED = 6`. 이전 저장 id 3개는 `drillKind()` 가 `mid·pass·drib` 으로 읽고, 큐에 남은 훈련 이벤트도 같은 경로
- [x] `availableDrills` 는 4개를 마치면 빈 배열. 메인 화면 "남은 훈련 n" 도 남은 횟수 기준
- [x] `src/ui/trainArt.ts` — 설계 `train-art.js` 포팅(벤치 프레스·스쿼트 5단계, 측면 골대 스위시 프레임)
- [x] `src/ui/drillEngine.ts` — 설계 클래스의 진행·판정·공 비행(Web Animations)·연출을 React 와 분리한 엔진으로 포팅. StrictMode 의 effect 되감기에 대비해 `start()` 가 `destroy()` 를 되돌린다
- [x] `src/ui/drillPlay.tsx` — 480×270 고정 무대(좁으면 `zoom`), 8장면, 조작별 버튼·키보드. `trainingPanel.tsx` 전면 교체: 종목 탭 + 카드(시작 ▶ / 코치에게 맡기기) → 플레이 → 결과(통과 스탬프·before→after·다음 ▶). **헤더 TRAIN 뱃지 없음**, 진행도 "완료 n / 4"
- [x] 기존 `shootDrill·passDrill·dribbleDrill·drillGame·drillHooks·drillParts` 삭제. `drill.ts` 의 `zoneWidth` 만 재사용
- [x] CSS `.tr-*` 블록으로 교체, 키프레임 4개. i18n en·ja 약 130개(엔진 문구는 `engine.ts`, 화면 문구는 `ui.ts`)
- [x] `game.test.ts` 11종·4개 한도·레거시 id. 브라우저에서 11종 장면 모두 렌더·판정 확인, 콘솔 오류 없음
- [x] `engines.md` 9장 훈련 표·실측(1,500 커리어) 재측정, `odds.ts`

**결정 ③** (2026-10-29) 설계대로 종목별 그림·조작을 모두 구현. 자동훈련은 카드의 "코치에게 맡기기" 버튼(3~7개 균등). 난이도·5회 모드는 제외.

## 23. 잠재 특성 세분화 + 등급 균등 + 잠재력 숨김

- [ ] 숨김: `createScreen.tsx`·`mainScreen.tsx` 의 잠재력 등급 표시 제거. 스카우팅 리포트 "다시 뽑기"는 그대로(가챠)
- [ ] 등급 균등: `player.ts` `rollPotential` 을 등급 5개 각 20% → 구간 안에서 균등(D 60~69 · C 70~77 · B 78~84 · A 85~91 · S 92~97). **현재 S 5.3%가 20%가 되어 NBA 진출·파엠 확률이 크게 오른다** → 11장 재측정
- [ ] 새 숨은 특성 `Player.ethic: 'gifted' | 'steady' | 'normal'`(이전 저장은 없음 → `normal`)
  - 천재형 25%: 잠재력 +5(최대 97). 그 오프시즌 훈련을 하나도 안 했으면 성장 보너스 −1.0
  - 노력형 25%: 잠재력 −5(최소 60). 훈련 1개마다 성장 보너스 +0.3(성공 여부 무관), 훈련 성공 시 +1 대신 +2
  - 보통 50%
- [ ] `advanceSeason` 에서 `drillsDone.length` 로 계산해 `grow()` 의 `bonus` 에 더하기만 한다. `grow()` 공식은 안 건드린다
- [ ] `applyDrill` 성공 가산폭을 특성에 따라, `hallEntry.ts` 영향 없음
- [ ] `engines.md` 2·3·11장, `odds.ts` 선수 생성 표, `game.test.ts`

**결정 ④** 등급 균등을 요청대로 적용할지(밸런스 변동 수용), 아니면 숨김만 하고 분포는 유지할지.
**결정 ⑤** 특성 수치(+5/−5, −1.0/+0.3, +2) 이대로 시작해도 되는지.
