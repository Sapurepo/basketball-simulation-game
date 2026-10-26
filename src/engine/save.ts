import type { GameState } from './types'

const KEY = 'basketball-career-v1'

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parseSave(raw) : null
  } catch {
    return null
  }
}

export function saveGame(s: GameState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    // 시크릿 모드 등 저장 불가 환경: 메모리 상태로만 진행
  }
}

export function parseSave(raw: string): GameState {
  const s = JSON.parse(raw) as GameState
  if (s?.version !== 1 || !s.player || !Array.isArray(s.history)) {
    throw new Error('올바른 저장 파일이 아닙니다.')
  }
  return s
}

export function exportSave(s: GameState) {
  const blob = new Blob([JSON.stringify(s)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `career-${s.player.name}-${s.year}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
