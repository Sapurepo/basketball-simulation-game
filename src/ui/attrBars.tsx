import { T, tr } from '../i18n'
import type { AttrKey, Attributes } from '../engine/types'
import { fmtDelta } from './delta'

// 10칸 세그먼트 막대: (i+1)*10-5 이상이면 칸이 켜지고, 70 이상은 금색
// adjust 를 주면 값 양옆에 −/+ 버튼이 붙는다 (선수 생성의 포인트 배분)
// delta 를 주면 값 옆에 시즌 증감 (+ 초록, − 회색)
// ev 를 주면 라벨 아래에 노력치 (훈련으로 쌓인 점수, 0 이면 생략)
export function AttrBars({
  attrs,
  keys,
  labels,
  adjust,
  delta,
  ev,
}: {
  attrs: Attributes
  keys: AttrKey[]
  labels: Record<AttrKey, string>
  delta?: Attributes
  ev?: Partial<Attributes>
  adjust?: {
    onChange: (k: AttrKey, d: number) => void
    limits: (k: AttrKey) => { up: boolean; down: boolean }
  }
}) {
  return (
    <ul className={adjust ? 'bars adjust' : delta ? 'bars with-delta' : 'bars'}>
      {keys.map((k) => {
        const v = Math.round(attrs[k])
        const lim = adjust?.limits(k)
        const d = delta ? fmtDelta(delta[k], 0) : ''
        const e = ev?.[k] ?? 0
        return (
          <li key={k}>
            <span>
              {tr(labels[k])}
              {e > 0 && (
                <small className="ev" title={tr('노력치')}>
                  {tr('노력치 {n}', { n: e })}
                </small>
              )}
            </span>
            <div
              className={v >= 70 ? 'seg-bar elite' : 'seg-bar'}
              role="meter"
              aria-label={tr(labels[k])}
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
                aria-label={tr('{attr} 내리기', { attr: T(labels[k]) })}
                disabled={!lim?.down}
                onClick={() => adjust.onChange(k, -1)}
              >
                −
              </button>
            )}
            <b>
              {v}
              {d && (
                <em className={delta![k] > 0 ? 'delta up' : 'delta down'}>
                  {d}
                </em>
              )}
            </b>
            {adjust && (
              <button
                className="ghost tiny"
                aria-label={tr('{attr} 올리기', { attr: T(labels[k]) })}
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
