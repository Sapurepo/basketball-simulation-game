import { useEffect, useRef, useState } from 'react'
import { exportSave, loadGame, parseSave, saveGame } from './engine/save'
import type { GameState } from './engine/types'
import { CreateScreen } from './ui/createScreen'
import { MainScreen } from './ui/mainScreen'
import './app.css'

export default function App() {
  const [state, setState] = useState<GameState | null>(loadGame)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => saveGame(state), [state])

  const importFile = async (file: File) => {
    try {
      setState(parseSave(await file.text()))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패')
    }
  }

  const reset = () => {
    if (state && !window.confirm('현재 커리어를 삭제하고 새로 시작할까요?')) {
      return
    }
    setState(null)
  }

  return (
    <>
      <header className="topbar">
        <b>🏀 코트에서 파이널까지</b>
        <div className="row">
          {state && (
            <button className="ghost" onClick={() => exportSave(state)}>
              저장 파일 내보내기
            </button>
          )}
          <button className="ghost" onClick={() => fileRef.current?.click()}>
            가져오기
          </button>
          {state && (
            <button className="ghost" onClick={reset}>
              새 게임
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {state ? (
        <MainScreen state={state} onChange={setState} />
      ) : (
        <CreateScreen onStart={setState} />
      )}
      <footer className="muted">
        팀, 선수, 경기 결과는 모두 가상이며 실제 리그나 구단과 관계가 없습니다.
        진행 내용은 이 브라우저에만 저장됩니다.
      </footer>
    </>
  )
}
