import { useEffect, useRef, useState } from 'react'

export interface SitemapLink {
  label: string
  desc: string
  // 누르면 팝업을 닫고 실행. href 가 있으면 링크로 연다 (메일)
  onSelect?: () => void
  href?: string
  // 팝업 안에서 내용을 보여줄 정적 파일 (sitemap.xml, robots.txt)
  file?: string
}

// 푸터의 사이트맵: 갈 수 있는 화면을 묶어서 한눈에 보여준다
export function SitemapDialog({
  groups,
  onClose,
}: {
  groups: { title: string; links: SitemapLink[] }[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [view, setView] = useState<{ file: string; text: string }>()
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  const select = (l: SitemapLink) => {
    if (l.file) {
      const file = l.file
      setView({ file, text: '불러오는 중…' })
      fetch(`/${file}`)
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .catch(() => '파일을 불러오지 못했어요.')
        // 그사이 목록으로 돌아갔으면 덮어쓰지 않는다
        .then((text) => setView((v) => (v?.file === file ? { file, text } : v)))
      return
    }
    ref.current?.close()
    l.onSelect?.()
  }
  return (
    <dialog
      ref={ref}
      className="modal sitemap"
      aria-label="사이트맵"
      onClose={() => setTimeout(onClose, 150)}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">벤치에서 파엠까지</p>
          <h2>사이트맵</h2>
        </div>
        <button className="ghost" onClick={() => ref.current?.close()}>
          닫기
        </button>
      </div>
      {view ? (
        <section>
          <div className="row between">
            <h3>{view.file}</h3>
            <span className="row">
              <a href={`/${view.file}`} target="_blank" rel="noreferrer">
                새 탭에서 열기
              </a>
              <button className="ghost" onClick={() => setView(undefined)}>
                목록으로
              </button>
            </span>
          </div>
          <pre className="file-view">{view.text}</pre>
        </section>
      ) : (
        groups.map((g) => (
          <section key={g.title}>
            <h3>{g.title}</h3>
            <ul>
              {g.links.map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    <a className="option" href={l.href}>
                      <b>{l.label}</b>
                      <small>{l.desc}</small>
                    </a>
                  ) : (
                    <button className="option" onClick={() => select(l)}>
                      <b>{l.label}</b>
                      <small>{l.desc}</small>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </dialog>
  )
}
