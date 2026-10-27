import type { Position } from '../engine/types'
import type { HallRow } from './hallApi'
import { PixelPlayer } from './pixelPlayer'
import { teamKit } from './pose'
import { iconURL } from './sprite'

// 3-2 배치: 링 가까운 앞줄 SF·C·PF, 3점 라인 밖 뒷줄 PG·SG (코트 대비 %)
const SPOTS: { pos: Position; x: number; y: number }[] = [
  { pos: 'SF', x: 17, y: 30 },
  { pos: 'C', x: 50, y: 20 },
  { pos: 'PF', x: 83, y: 30 },
  { pos: 'PG', x: 32, y: 74 },
  { pos: 'SG', x: 68, y: 74 },
]

// 하프 코트(FIBA 비율, 1칸 = 10cm, 가로 15m × 세로 14m). 위쪽이 엔드라인과 림
function Court() {
  // 3점 라인: 사이드라인에서 0.9m 들어온 직선이 림 중심 반지름 6.75m 호와 만나는 높이
  const corner = 15.75 + Math.sqrt(67.5 ** 2 - 66 ** 2)
  return (
    <svg className="court-lines" viewBox="0 0 150 140" aria-hidden="true">
      <g fill="none" strokeWidth="1">
        <rect x="0.5" y="0.5" width="149" height="139" />
        {/* 페인트존과 자유투 서클 */}
        <rect x="50.5" y="0.5" width="49" height="57.5" className="paint" />
        <path d="M57 58 A18 18 0 0 0 93 58" />
        <path d="M57 58 A18 18 0 0 1 93 58" strokeDasharray="3 3" />
        {/* 3점 라인 */}
        <path d={`M9 0 V${corner} A67.5 67.5 0 0 0 141 ${corner} V0`} />
        {/* 제한 구역, 백보드, 림 */}
        <path d="M62.5 15.75 A12.5 12.5 0 0 0 87.5 15.75" />
        <line x1="66" y1="12" x2="84" y2="12" strokeWidth="1.5" />
        <circle cx="75" cy="15.75" r="2.25" className="rim" />
        {/* 하프 라인과 센터 서클 */}
        <path d="M57 140 A18 18 0 0 1 93 140" />
      </g>
    </svg>
  )
}

// 랭킹 화면 맨 위: 포지션별 1위로 짠 베스트 5 라인업
export function BestFive({ rows }: { rows: HallRow[] }) {
  return (
    <div className="best-five" aria-label="포지션별 베스트 5">
      <Court />
      {SPOTS.map(({ pos, x, y }) => {
        const p = rows.find((r) => r.position === pos)
        return (
          <div
            key={pos}
            className={p ? 'spot' : 'spot empty'}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {p ? (
              <>
                <PixelPlayer
                  pose="idle"
                  kit={teamKit(p.name)}
                  look={p.look}
                  scale={2}
                />
                <span className="plate">
                  <b>{pos}</b>
                  <span>{p.name}</span>
                </span>
                <small>
                  {p.rank}위 OVR {p.peakOvr}
                  <img
                    className="px"
                    src={iconURL('trophy')}
                    width={14}
                    height={14}
                    alt="NBA 파이널 MVP"
                  />
                  {p.fmvp}
                </small>
              </>
            ) : (
              <>
                <span className="vacant">{pos}</span>
                <small>비어 있음</small>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
