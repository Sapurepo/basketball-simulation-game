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
import { CONTACT_EMAIL, type LegalDoc, PRIVACY, TERMS } from './data/legal'
import { CreateScreen } from './ui/createScreen'
import { LandingScreen } from './ui/landingScreen'
import { LegalDialog } from './ui/legalDialog'
import { MainScreen } from './ui/mainScreen'
import { RankingScreen } from './ui/rankingScreen'
import { SitemapDialog } from './ui/sitemapDialog'
import './app.css'

type Screen = 'landing' | 'create' | 'game' | 'ranking'

export default function App() {
  const [state, setState] = useState<GameState | null>(loadGame)
  // 은퇴한 커리어는 이 브라우저의 명예의 전당(내 기록)에 남긴다. 커리어 id 로 한 번만
  const [hall, setHall] = useState(() =>
    state?.stage === 'RETIRED' ? recordHall(state) : loadHall(),
  )
  // 랭킹은 주소 해시로 바로 열 수 있다 (새로고침해도 같은 페이지)
  const [screen, setScreen] = useState<Screen>(() =>
    location.hash.startsWith('#ranking') ? 'ranking' : 'landing',
  )
  const [rankingFrom, setRankingFrom] = useState<Screen>('landing')
  const [error, setError] = useState('')
  const [legal, setLegal] = useState<LegalDoc | null>(null)
  const [sitemap, setSitemap] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  useEffect(() => saveGame(state), [state])
  // 앱 박스 안에서만 스크롤하므로 화면을 바꾸면 맨 위부터 보여준다
  // (scrollTo 가 Promise 를 반환하는 브라우저가 있어 effect 에서 값을 돌려주지 않는다)
  useEffect(() => {
    screenRef.current?.scrollTo(0, 0)
    // 랭킹을 떠나면 주소의 #ranking 을 지워 새로고침 때 다시 열리지 않게
    if (screen !== 'ranking' && location.hash.startsWith('#ranking'))
      history.replaceState(null, '', location.pathname + location.search)
  }, [screen])

  const importFile = async (file: File) => {
    try {
      change(parseSave(await file.text()))
      setScreen('game')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패')
    }
  }

  // 새 커리어: 생성 화면으로. 은퇴하지 않은 커리어는 기록에 남지 않는다
  const reset = () => {
    if (state && !window.confirm('현재 커리어를 끝내고 새로 시작할까요?'))
      return
    setState(null)
    setScreen('create')
  }

  const change = (s: GameState) => {
    if (s.stage === 'RETIRED') setHall(recordHall(s))
    setState(s)
  }

  // 커리어 id 는 엔진 밖에서 붙인다 (엔진은 시드만으로 결정적)
  const openRanking = () => {
    if (screen !== 'ranking') setRankingFrom(screen)
    setScreen('ranking')
  }
  const closeRanking = () => setScreen(rankingFrom)

  const start = (s: GameState) => {
    setState({ ...s, careerId: crypto.randomUUID() })
    setScreen('game')
  }

  return (
    <div className="shell">
      <div ref={screenRef} className="screen">
        {/* 헤더는 랜딩 화면에서만 */}
        {screen === 'landing' && (
          <div className="brand">
            <b>
              벤치에서 파엠까지 <span className="tag gold">BETA</span>
            </b>
            <small className="muted">나만의 농구 인생</small>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        {screen === 'landing' && (
          <LandingScreen
            state={state}
            hall={hall}
            onContinue={() => setScreen('game')}
            onNew={reset}
            onOpenRanking={openRanking}
          />
        )}
        {screen === 'create' && (
          <CreateScreen onStart={start} onBack={() => setScreen('landing')} />
        )}
        {screen === 'ranking' && <RankingScreen onBack={closeRanking} />}
        {screen === 'game' && state && (
          <MainScreen state={state} onChange={change} />
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
            <button className="ghost" onClick={openRanking}>
              랭킹
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
          <div className="site-info">
            <b>벤치에서 파엠까지</b>
            <div className="row build">
              v{__APP_VERSION__}
              <button className="link" onClick={() => setLegal(PRIVACY)}>
                개인정보처리방침
              </button>
              <button className="link" onClick={() => setLegal(TERMS)}>
                이용약관
              </button>
              <button className="link" onClick={() => setSitemap(true)}>
                사이트맵
              </button>
              {import.meta.env.VITE_FEEDBACK_URL && (
                <a
                  href={import.meta.env.VITE_FEEDBACK_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  피드백 보내기
                </a>
              )}
            </div>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <small>
              © 2026 imhyun. 학교, 구단, 대회 명칭과 로고에 대한 권리는 각
              권리자에게 있으며, 서비스는 해당 권리자와 제휴하거나 후원을 받지
              않습니다.
            </small>
          </div>
        </footer>
        {legal && <LegalDialog doc={legal} onClose={() => setLegal(null)} />}
        {sitemap && (
          <SitemapDialog
            onClose={() => setSitemap(false)}
            groups={[
              {
                title: '게임',
                links: [
                  {
                    label: '처음 화면',
                    desc: '게임 소개와 명예의 전당 미리보기',
                    onSelect: () => setScreen('landing'),
                  },
                  ...(state
                    ? [
                        {
                          label: '이어하기',
                          desc: `${state.player.name} 선수의 커리어로 돌아가기`,
                          onSelect: () => setScreen('game'),
                        },
                      ]
                    : []),
                  {
                    label: '새 커리어 만들기',
                    desc: '선수를 만들고 고1 시즌부터 시작',
                    onSelect: reset,
                  },
                ],
              },
              {
                title: '명예의 전당',
                links: [
                  {
                    label: '전체 랭킹',
                    desc: '포지션별 베스트 5와 상위 100명',
                    onSelect: openRanking,
                  },
                ],
              },
              {
                title: '안내',
                links: [
                  {
                    label: '개인정보처리방침',
                    desc: '수집하는 정보와 보관 기간',
                    onSelect: () => setLegal(PRIVACY),
                  },
                  {
                    label: '이용약관',
                    desc: '서비스 이용 조건',
                    onSelect: () => setLegal(TERMS),
                  },
                  {
                    label: '문의 메일',
                    desc: CONTACT_EMAIL,
                    href: `mailto:${CONTACT_EMAIL}`,
                  },
                ],
              },
              {
                title: '검색엔진용 파일',
                links: [
                  {
                    label: 'sitemap.xml',
                    desc: '검색엔진에 알려주는 페이지 목록',
                    file: 'sitemap.xml',
                  },
                  {
                    label: 'robots.txt',
                    desc: '검색엔진 수집 허용 규칙',
                    file: 'robots.txt',
                  },
                ],
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}
