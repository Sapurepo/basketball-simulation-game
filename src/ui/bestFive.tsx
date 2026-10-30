import { tr } from '../i18n'
import { POSITION_LABELS } from '../engine/player'
import { hallArtURL } from './hallArt'
import { BEST_ORDER, type HallRow } from './hallApi'
import { PixelPlayer } from './pixelPlayer'
import { teamKit } from './pose'

// 랭킹 화면 맨 위: 금장 액자 안 포지션별 1위 진열대. 가장 순위가 높은 선수에게 왕관
export function BestFive({
  rows,
  desc,
  titles = false,
  onOpen,
}: {
  rows: HallRow[]
  desc: string
  // 이름판에 파이널 MVP 대신 KBL 챔피언결정전 우승 (KBL 필터)
  titles?: boolean
  onOpen: (r: HallRow) => void
}) {
  const leader = Math.min(...rows.map((r) => r.rank))
  return (
    <section className="best-five" aria-label={tr('포지션별 베스트 5')}>
      <div className="best-five-bg" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {(
        [
          ['', 'cTL'],
          ['R', 'cTR'],
          ['B', 'cBL'],
          ['RB', 'cBR'],
        ] as const
      ).map(([f, at]) => (
        <img
          key={at}
          className={`px corner ${at}`}
          src={hallArtURL('corner', f)}
          alt=""
        />
      ))}
      <div className="best-five-head">
        <div className="row nowrap">
          <img className="px laurel" src={hallArtURL('laurel', 'L')} alt="" />
          <div className="best-five-title">
            <img className="px crown" src={hallArtURL('crown')} alt="" />
            <span className="ribbon">BEST 5</span>
          </div>
          <img className="px laurel" src={hallArtURL('laurel', 'R')} alt="" />
        </div>
        <p>{desc}</p>
      </div>
      {BEST_ORDER.map((line) => (
        <div key={line.join()} className="best-five-row">
          {line.map((pos) => {
            const p = rows.find((r) => r.position === pos)
            return p ? (
              <button
                key={pos}
                className="spot"
                aria-label={tr('{name} 상세 기록', { name: p.name })}
                onClick={() => onOpen(p)}
              >
                <span className="spot-pos">
                  <span>{pos}</span>
                </span>
                <span className="spot-frame">
                  <span className="spot-inner" />
                  <span className="spot-beam" />
                  <i />
                  <i />
                  <i />
                  {p.rank === leader && (
                    <img
                      className="px crown"
                      src={hallArtURL('crown')}
                      alt=""
                    />
                  )}
                  <img
                    className="px pedestal"
                    src={hallArtURL('pedestal')}
                    alt=""
                  />
                  <span className="spot-sprite">
                    <PixelPlayer
                      pose="idle"
                      kit={teamKit(p.name)}
                      look={p.look}
                      scale={2.5}
                    />
                  </span>
                </span>
                <span className="spot-plate">
                  <b>{p.name}</b>
                  <small>
                    {titles
                      ? tr('OVR {ovr} · KBL 우승 {n}', {
                          ovr: p.peakOvr,
                          n: p.kblTitles ?? '-',
                        })
                      : tr('OVR {ovr} · 파이널 MVP {n}', {
                          ovr: p.peakOvr,
                          n: p.fmvp,
                        })}
                  </small>
                </span>
              </button>
            ) : (
              <div key={pos} className="spot empty">
                <span className="spot-pos">{pos}</span>
                <span className="spot-frame">
                  <span>{tr('비어 있음')}</span>
                </span>
                <span className="spot-plate">
                  <b>{tr('첫 등록을 기다려요')}</b>
                  <small>{tr(POSITION_LABELS[pos])}</small>
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </section>
  )
}
