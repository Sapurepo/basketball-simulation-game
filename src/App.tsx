import { useEffect, useRef, useState } from 'react'
import {
  exportSave,
  loadGame,
  loadHall,
  parseSave,
  recordHall,
  saveGame,
} from './engine/save'
import type { GameState } from './engine/types'
import { CreateScreen } from './ui/createScreen'
import { LandingScreen } from './ui/landingScreen'
import { MainScreen } from './ui/mainScreen'
import './app.css'

type Screen = 'landing' | 'create' | 'game'

export default function App() {
  const [state, setState] = useState<GameState | null>(loadGame)
  const [hall, setHall] = useState(loadHall)
  const [screen, setScreen] = useState<Screen>('landing')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => saveGame(state), [state])

  const importFile = async (file: File) => {
    try {
      setState(parseSave(await file.text()))
      setScreen('game')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패')
    }
  }

  // 새 커리어: 기존 커리어는 명예의 전당에 남기고 생성 화면으로
  const reset = () => {
    if (state) {
      if (!window.confirm('현재 커리어를 끝내고 새로 시작할까요?')) return
      setHall(recordHall(state))
    }
    setState(null)
    setScreen('create')
  }

  const start = (s: GameState) => {
    setState(s)
    setScreen('game')
  }

  return (
    <div className="shell">
      <div className="brand">
        <b>벤치에서 파엠까지</b>
        <small className="muted">나만의 농구 인생</small>
      </div>
      {error && <p className="error">{error}</p>}
      {screen === 'landing' && (
        <LandingScreen
          state={state}
          hall={hall}
          onContinue={() => setScreen('game')}
          onNew={reset}
        />
      )}
      {screen === 'create' && (
        <CreateScreen onStart={start} onBack={() => setScreen('landing')} />
      )}
      {screen === 'game' && state && (
        <MainScreen state={state} onChange={setState} />
      )}
      <footer>
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
            <button className="ghost" onClick={() => setScreen('landing')}>
              처음으로
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
        <p className="muted">
          팀, 선수, 경기 결과는 모두 가상이며 실제 리그나 구단과 관계가
          없습니다. 진행 내용은 이 브라우저에만 저장됩니다.
        </p>
      </footer>
    </div>
  )
}
