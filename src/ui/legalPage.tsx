import { EFFECTIVE_DATE, type LegalBlock, type LegalDoc } from '../data/legal'
import { getLang, T, tr } from '../i18n'

function Block({ b }: { b: LegalBlock }) {
  if (typeof b === 'string') return <p>{tr(b)}</p>
  if ('list' in b)
    return (
      <ul>
        {b.list.map((li) => (
          <li key={li}>{tr(li)}</li>
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

// 공지사항·개인정보 처리방침·이용약관·확률표 페이지
export function LegalPage({
  doc,
  onBack,
}: {
  doc: LegalDoc
  onBack: () => void
}) {
  return (
    <main className="panel legal">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{tr('벤치에서 파엠까지')}</p>
          <h1>{tr(doc.title)}</h1>
        </div>
        <button className="ghost" onClick={onBack}>
          {tr('뒤로')}
        </button>
      </div>
      {getLang() !== 'ko' && !doc.translated && (
        <p className="muted">{tr('이 문서는 한국어로만 제공됩니다.')}</p>
      )}
      <p className="muted">
        {doc.subtitle
          ? tr(doc.subtitle)
          : tr('시행일 {date}', { date: T(EFFECTIVE_DATE) })}
      </p>
      <p>{tr(doc.intro)}</p>
      {doc.sections.map((s) => (
        <section key={s.title}>
          <h3>{tr(s.title)}</h3>
          {s.blocks.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </section>
      ))}
    </main>
  )
}
