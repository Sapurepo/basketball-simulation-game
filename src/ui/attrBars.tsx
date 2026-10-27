import type { AttrKey, Attributes } from '../engine/types'

// 10칸 세그먼트 막대: (i+1)*10-5 이상이면 칸이 켜지고, 70 이상은 금색
// adjust 를 주면 값 양옆에 −/+ 버튼이 붙는다 (선수 생성의 포인트 배분)
export function AttrBars({
  attrs,
  keys,
  labels,
  adjust,
}: {
  attrs: Attributes
  keys: AttrKey[]
  labels: Record<AttrKey, string>
  adjust?: {
    onChange: (k: AttrKey, d: number) => void
    limits: (k: AttrKey) => { up: boolean; down: boolean }
  }
}) {
  return (
    <ul className={adjust ? 'bars adjust' : 'bars'}>
      {keys.map((k) => {
        const v = Math.round(attrs[k])
        const lim = adjust?.limits(k)
        return (
          <li key={k}>
            <span>{labels[k]}</span>
            <div
              className={v >= 70 ? 'seg-bar elite' : 'seg-bar'}
              role="meter"
              aria-label={labels[k]}
              aria-valuenow={v}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <i
                  key={i}
                  className={v >= (i + 1) * 10 - 5 ? 'on' : undefined}
                />
              ))}
            </div>
            {adjust && (
              <button
                className="ghost tiny"
                aria-label={`${labels[k]} 내리기`}
                disabled={!lim?.down}
                onClick={() => adjust.onChange(k, -1)}
              >
                −
              </button>
            )}
            <b>{v}</b>
            {adjust && (
              <button
                className="ghost tiny"
                aria-label={`${labels[k]} 올리기`}
                disabled={!lim?.up}
                onClick={() => adjust.onChange(k, 1)}
              >
                +
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
