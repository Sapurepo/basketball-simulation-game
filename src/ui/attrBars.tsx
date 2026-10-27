import type { AttrKey, Attributes } from '../engine/types'

// 10칸 세그먼트 막대: (i+1)*10-5 이상이면 칸이 켜지고, 70 이상은 금색
export function AttrBars({
  attrs,
  keys,
  labels,
}: {
  attrs: Attributes
  keys: AttrKey[]
  labels: Record<AttrKey, string>
}) {
  return (
    <ul className="bars">
      {keys.map((k) => {
        const v = Math.round(attrs[k])
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
            <b>{v}</b>
          </li>
        )
      })}
    </ul>
  )
}
