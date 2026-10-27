import { useEffect, useRef, useState } from 'react'
import type { GameLog } from '../engine/types'
import { TeamLogo } from './teamLogo'
import { WinLoss } from './winLoss'

// 텍스트 중계: 한 줄씩 재생, 건너뛰기 가능
export function GameCast({ game }: { game: GameLog }) {
  const [shown, setShown] = useState(1)
  const listRef = useRef<HTMLOListElement>(null)
  const done = shown >= game.pbp.length

  useEffect(() => {
    if (done) return
    const id = setTimeout(() => setShown((n) => n + 1), 140)
    return () => clearTimeout(id)
  }, [shown, done])

  useEffect(() => {
    // 페이지가 아닌 중계 목록만 스크롤
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  const win = game.myScore > game.oppScore
  return (
    <div className="cast">
      <div className="row between">
        <div>
          <p className="eyebrow">{game.label}</p>
          <h3 className="row">
            <WinLoss win={win} />
            vs <TeamLogo name={game.opponent} size={24} /> {game.opponent}{' '}
            <span className={win ? 'win' : 'loss'}>
              {game.myScore}-{game.oppScore}
            </span>
          </h3>
        </div>
        {!done && (
          <button className="ghost" onClick={() => setShown(game.pbp.length)}>
            건너뛰기
          </button>
        )}
      </div>
      <ol ref={listRef} className="pbp" aria-live="polite">
        {game.pbp.slice(0, shown).map((line, i) => (
          <li
            key={i}
            className={
              line.startsWith('—')
                ? 'q'
                : line.includes('★')
                  ? 'hot'
                  : undefined
            }
          >
            {line}
          </li>
        ))}
      </ol>
    </div>
  )
}
