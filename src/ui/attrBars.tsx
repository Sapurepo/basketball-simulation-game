import type { AttrKey, Attributes } from '../engine/types'

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
            <div className="bar">
              <div style={{ width: `${v}%` }} />
            </div>
            <b>{v}</b>
          </li>
        )
      })}
    </ul>
  )
}
