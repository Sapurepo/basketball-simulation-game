import { useEffect, useRef } from 'react'
import { EFFECTIVE_DATE, type LegalBlock, type LegalDoc } from '../data/legal'

function Block({ b }: { b: LegalBlock }) {
  if (typeof b === 'string') return <p>{b}</p>
  if ('list' in b)
    return (
      <ul>
        {b.list.map((li) => (
          <li key={li}>{li}</li>
        ))}
      </ul>
    )
  const [head, ...rows] = b.table
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 푸터의 개인정보 처리방침·이용약관 팝업
export function LegalDialog({
  doc,
  onClose,
}: {
  doc: LegalDoc
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal legal"
      aria-label={doc.title}
      onClose={() => setTimeout(onClose, 150)}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">벤치에서 파엠까지</p>
          <h2>{doc.title}</h2>
        </div>
        <button className="ghost" onClick={() => ref.current?.close()}>
          닫기
        </button>
      </div>
      <p className="muted">{doc.subtitle ?? `시행일 ${EFFECTIVE_DATE}`}</p>
      <p>{doc.intro}</p>
      {doc.sections.map((s) => (
        <section key={s.title}>
          <h3>{s.title}</h3>
          {s.blocks.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </section>
      ))}
    </dialog>
  )
}
