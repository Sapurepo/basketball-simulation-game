import { Component, type ErrorInfo, type ReactNode } from 'react'
import { exportRawSave, saveGame } from '../engine/save'
import { tr } from '../i18n'

// 렌더 중 오류가 나도 흰 화면 대신 복구 화면을 보여준다.
// 세이브가 원인이면 새로고침해도 다시 깨지므로 내보낸 뒤 초기화할 수 있게 한다.
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; note: string }
> {
  state = { error: null as Error | null, note: '' }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  exportSave = () => {
    try {
      const ok = exportRawSave()
      this.setState({
        note: ok
          ? tr('저장 파일을 내려받았어요.')
          : tr('저장된 커리어가 없어요.'),
      })
    } catch {
      this.setState({ note: tr('저장 파일을 내려받지 못했어요.') })
    }
  }

  resetSave = () => {
    if (!window.confirm(tr('저장된 커리어를 지우고 처음부터 시작할까요?')))
      return
    saveGame(null)
    location.reload()
  }

  render() {
    const { error, note } = this.state
    if (!error) return this.props.children
    return (
      <div className="shell">
        <div className="screen">
          <section className="panel" role="alert">
            <p className="eyebrow">{tr('오류')}</p>
            <h2>{tr('문제가 생겼어요')}</h2>
            <p className="muted">
              {tr(
                '진행 내용은 이 브라우저에 남아 있어요. 먼저 저장 파일을 내보낸 뒤 새로고침해 보세요. 계속 같은 화면이 나오면 세이브를 초기화하세요.',
              )}
            </p>
            <div className="row">
              <button className="primary" onClick={this.exportSave}>
                {tr('저장 파일 내보내기')}
              </button>
              <button className="ghost" onClick={() => location.reload()}>
                {tr('새로고침')}
              </button>
              <button className="ghost" onClick={this.resetSave}>
                {tr('세이브 초기화')}
              </button>
            </div>
            {note && <p className="train-result">{note}</p>}
            <small className="muted">{error.message}</small>
          </section>
        </div>
      </div>
    )
  }
}
