# 4차 피드백 개선 계획 (23~27)

2026-10-29 피드백 5건의 작업 계획. 항목을 끝내면 `[x]` 로 바꾸고 커밋 해시를 적는다. 계산식·확률의 정본은 `docs/engines.md`, 확률표는 `src/data/odds.ts`.

상태 표기: `[ ]` 대기 · `[~]` 진행 중 · `[x]` 완료 · `[-]` 보류/제외

## 요약

| #   | 항목                                | 크기 | 상태 | 결정 필요  |
| --- | ----------------------------------- | ---- | ---- | ---------- |
| 26  | 중계 결과 스포 방지 + 출전시간 표시 | 소형 | [x]  | —          |
| 27  | 명예의 전당 정렬 다양화             | 중형 | [x]  | ① 결정됨   |
| 25  | 아이템 다양화 (저가·능력치 분배)    | 대형 | [x]  | ② 결정됨   |
| 24  | 훈련 다양화 + 3개 제공 + 자동훈련   | 대형 | [x]  | ③ 결정됨   |
| 23  | 잠재 특성 세분화 + 등급 균등 + 숨김 | 대형 | [x]  | ④ ⑤ 결정됨 |

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

2026-10-30 설계 핸드오프(claude.ai/design `templates/shop/Shop.dc.html`, `shop-art.js`, `pixel-roster.js`) 기준으로 구현. 원안 A+B 보다 범위가 커져 28종 추가(33 → 61종).

- [x] 훈련용품 탭 `gear` 6종(300~3,000만원, 능력치 +1). 슈팅 슬리브만 착용, 나머지는 무대 배치
- [x] 모자 슬롯 `slot: 'hat'` 6종(비니·썬바이저·버킷햇·스냅백·트러커 캡·페도라). 하나만 쓰고 쓴 것만 버프. `GameState.hat`, `buyItem`/`toggleAccessory` 분기, 저장 파일 이전(쓰고 있던 스냅백 → `hat`)
- [x] 사치품 추가: 헤어밴드·카본 무릎 보호대·뿔테 안경(+1), 전동 킥보드·로드 자전거(성장)
- [x] 저가 벽지 6종(50~500만원, 성장 +0.05), 가구 6종(화분·조명·트로피 선반·미니 골대·TV·아이스 배스)
- [x] 아트: `shopArt.ts` 22종 이식, `sprite.ts` 모자 5종, `layout.ts` 벽 배치 집합 확장
- [x] `shop.tsx` 탭·라벨·모자 착용/벗기, 효과 미리보기는 상한 반영 실제 변화량, 성장 소수 둘째 자리
- [x] 등급 구간 변경(일반 <1천만 · 레어 <1억 · 에픽 <100억 · 레전드)
- [x] `engines.md` 9장 상점 표. `odds.ts` 에는 상점 표가 없어 변경 없음

**결정 ②** (2026-10-30 결정됨) 아이템이 많아진 만큼 효과 상한을 둔다 — `itemEffects` 한 곳에서 처리:

- 능력치별 버프 합 **+3** (`BUFF_CAP`)
- 성장 보너스 합 **+2.0** (`GROWTH_CAP`), 벽지·바닥·모자는 **적용 중인 것만** 효과

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

- [x] 숨김: `createScreen.tsx`·`mainScreen.tsx` 의 잠재력 등급 표시 제거. 스카우팅 리포트 "다시 뽑기"는 그대로(가챠)
- [x] 등급 균등: `player.ts` `rollPotential` 을 등급 5개 각 20% → 구간 안에서 균등(D 60~69 · C 70~77 · B 78~84 · A 85~91 · S 92~97). **현재 S 5.3%가 20%가 되어 NBA 진출·파엠 확률이 크게 오른다** → 11장 재측정
- [x] 새 숨은 특성 `Player.ethic: 'gifted' | 'steady' | 'normal'`(이전 저장은 없음 → `normal`)
  - 천재형 25%: 잠재력 +5(최대 97). 그 오프시즌 훈련을 하나도 안 했으면 성장 보너스 −1.0
  - 노력형 25%: 잠재력 −5(최소 60). 훈련 1개마다 성장 보너스 +0.3(성공 여부 무관), 훈련 성공 시 +1 대신 +2
  - 보통 50%
- [x] `advanceSeason` 에서 `drillsDone.length` 로 계산해 `grow()` 의 `bonus` 에 더하기만 한다. `grow()` 공식은 안 건드린다
- [x] `applyDrill` 성공 가산폭을 특성에 따라, `hallEntry.ts` 영향 없음
- [x] `engines.md` 2·3·11장, `odds.ts` 선수 생성 표, `game.test.ts`

**결정 ④** 등급 균등 적용 (2026-10-30). 봇 NBA 진출 35.2% → 46.0%, 파이널 MVP 7.1% → 17.0%.
**결정 ⑤** 특성 수치 그대로 시작.
**결정 ⑥** 잠재력 완전 숨김. 스카우트 평가(잠재력 ±5) 노출안은 등급이 실제와 같거나 한 칸 차이라 공개와 다를 바 없어 폐기. 플레이어는 초반 성장 속도로 추론한다.
**결정 ⑦** 노력치 `Player.ev` 는 성장 분배 편향(`b_k += 0.02 × ev`)만, 직접 가산 없음.

추가 구현: `Player.ev`(훈련 1회 +1, 능력치별 20·합계 60), `attrBars.tsx` 라벨 아래 노력치, 훈련 카드 노력치 칩, 결과 문구 가산폭 표시. 노력형 +2 는 `trainingPanel.tsx` 결과 화면이 실제 증가량을 보여 준다.
