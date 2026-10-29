import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { loadGame, loadHall, recordHall, saveGame } from './engine/save'
import type { GameState } from './engine/types'
import {
  CONTACT_EMAIL,
  DONATE_ACCOUNT,
  type LegalDoc,
  PRIVACY,
  TERMS,
} from './data/legal'
import { CHANGELOG, CHANGELOG_DOC, SEEN_VERSION_KEY } from './data/changelog'
import { ODDS } from './data/odds'
import { LANGS, setLang, tr, useLang } from './i18n'
import { CreateScreen } from './ui/createScreen'
import { LandingScreen } from './ui/landingScreen'
import { LegalPage } from './ui/legalPage'
import { MainScreen } from './ui/mainScreen'
import { MoveBanner } from './ui/moveBanner'
import { RankingScreen } from './ui/rankingScreen'
import { SitemapDialog } from './ui/sitemapDialog'
import './app.css'

type Screen = 'landing' | 'create' | 'game' | 'ranking' | 'doc'

// 검색엔진에 따로 노출하는 문서 페이지의 주소 (public/sitemap.xml 과 맞춘다)
const DOC_PATHS: [string, LegalDoc][] = [
  ['/notice', CHANGELOG_DOC],
  ['/privacy', PRIVACY],
  ['/terms', TERMS],
  ['/odds', ODDS],
]
const docAt = (path: string) => DOC_PATHS.find(([p]) => p === path)?.[1]
// 크롤러가 따라갈 수 있게 주소 링크로 두고, 누르면 새로 불러오지 않고 연다 (보조키를 누르면 새 탭 그대로)
const go = (f: () => void) => (e: MouseEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  f()
}

export default function App() {
  const lang = useLang()
  const [state, setState] = useState<GameState | null>(loadGame)
  // 은퇴한 커리어는 이 브라우저의 명예의 전당(내 기록)에 남긴다. 커리어 id 로 한 번만
  const [hall, setHall] = useState(() =>
    state?.stage === 'RETIRED' ? recordHall(state) : loadHall(),
  )
  // 랭킹·문서는 주소로 바로 열 수 있다 (새로고침해도 같은 페이지). #ranking 은 예전 주소
  const [screen, setScreen] = useState<Screen>(() =>
    docAt(location.pathname)
      ? 'doc'
      : location.pathname === '/ranking' || location.hash.startsWith('#ranking')
        ? 'ranking'
        : 'landing',
  )
  const [rankingFrom, setRankingFrom] = useState<Screen>('landing')
  const [legal, setLegal] = useState(() => docAt(location.pathname) ?? null)
  const [docFrom, setDocFrom] = useState<Screen>('landing')
  const [sitemap, setSitemap] = useState(false)
  // 아직 안 본 새 버전이면 푸터 버전 옆에 점. 공지를 열면 사라진다
  const [unseen, setUnseen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_VERSION_KEY) !== __APP_VERSION__
    } catch {
      return false
    }
  })
  // 문서 페이지: 연 화면을 기억했다가 뒤로 가면 그 화면으로
  const openDoc = (d: LegalDoc) => {
    if (screen !== 'doc') setDocFrom(screen)
    setLegal(d)
    setScreen('doc')
  }
  const openChangelog = () => {
    openDoc(CHANGELOG_DOC)
    setUnseen(false)
    try {
      localStorage.setItem(SEEN_VERSION_KEY, __APP_VERSION__)
    } catch {
      // 저장 못 해도 공지는 연다
    }
  }
  const screenRef = useRef<HTMLDivElement>(null)

  useEffect(() => saveGame(state), [state])
  // 앱 박스 안에서만 스크롤하므로 화면을 바꾸면 맨 위부터 보여준다
  // (scrollTo 가 Promise 를 반환하는 브라우저가 있어 effect 에서 값을 돌려주지 않는다)
  useEffect(() => {
    screenRef.current?.scrollTo(0, 0)
  }, [screen, legal])
  // 주소를 지금 화면에 맞춘다. 기록은 쌓지 않는다 (뒤로 가기는 지금처럼 사이트를 떠난다)
  useEffect(() => {
    const path =
      screen === 'doc'
        ? (DOC_PATHS.find(([, d]) => d === legal)?.[0] ?? '/')
        : screen === 'ranking'
          ? '/ranking'
          : '/'
    if (path !== location.pathname) history.replaceState(null, '', path)
  }, [screen, legal])

  // 새 커리어: 생성 화면으로. 은퇴하지 않은 커리어는 기록에 남지 않는다
  const reset = () => {
    if (state && !window.confirm(tr('현재 커리어를 끝내고 새로 시작할까요?')))
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
        <MoveBanner />
        {/* 헤더는 랜딩 화면에서만 */}
        {screen === 'landing' && (
          <div className="brand">
            <b>{tr('벤치에서 파엠까지')}</b>
            <small className="muted">{tr('나만의 농구 인생')}</small>
            <p className="donate">
              {tr('서버비 후원하기: 토스뱅크 {account}', {
                account: DONATE_ACCOUNT,
              })}
            </p>
          </div>
        )}
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
        {screen === 'doc' && legal && (
          <LegalPage doc={legal} onBack={() => setScreen(docFrom)} />
        )}
        {screen === 'game' && state && (
          <MainScreen
            key={state.careerId}
            state={state}
            onChange={change}
            onNew={reset}
          />
        )}
        <footer>
          <div className="row">
            <button className="ghost" onClick={openRanking}>
              {tr('랭킹')}
            </button>
            {/* 저장이 없는 브라우저도 랭킹·선수 만들기 화면에서 처음으로 돌아갈 수 있게 */}
            {(state || screen !== 'landing') && (
              <button className="ghost" onClick={() => setScreen('landing')}>
                {tr('처음으로')}
              </button>
            )}
          </div>
          <div className="site-info">
            <b>{tr('벤치에서 파엠까지')}</b>
            <div className="row lang" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  className={l.id === lang ? 'link current' : 'link'}
                  lang={l.id}
                  aria-pressed={l.id === lang}
                  onClick={() => setLang(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="row build">
              v{__APP_VERSION__}
              <a
                className={unseen ? 'link unseen' : 'link'}
                href="/notice"
                onClick={go(openChangelog)}
              >
                {tr('공지사항')}
              </a>
              <a
                className="link"
                href="/privacy"
                onClick={go(() => openDoc(PRIVACY))}
              >
                {tr('개인정보처리방침')}
              </a>
              <a
                className="link"
                href="/terms"
                onClick={go(() => openDoc(TERMS))}
              >
                {tr('이용약관')}
              </a>
              <a
                className="link"
                href="/odds"
                onClick={go(() => openDoc(ODDS))}
              >
                {tr('게임 확률표')}
              </a>
              <button className="link" onClick={() => setSitemap(true)}>
                {tr('사이트맵')}
              </button>
              <a href={`mailto:${CONTACT_EMAIL}`}>{tr('문의하기')}</a>
              {import.meta.env.VITE_FEEDBACK_URL && (
                <a
                  href={import.meta.env.VITE_FEEDBACK_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tr('피드백 보내기')}
                </a>
              )}
            </div>
            <span>
              {tr('광고 문의:')}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </span>
            <small>
              {tr(
                '© 2026 imhyun. 학교, 구단, 대회 명칭과 로고에 대한 권리는 각 권리자에게 있으며, 서비스는 해당 권리자와 제휴하거나 후원을 받지 않습니다.',
              )}
            </small>
          </div>
        </footer>
        {sitemap && (
          <SitemapDialog
            onClose={() => setSitemap(false)}
            groups={[
              {
                title: tr('게임'),
                links: [
                  {
                    label: tr('처음 화면'),
                    desc: tr('게임 소개와 명예의 전당 미리보기'),
                    onSelect: () => setScreen('landing'),
                  },
                  ...(state
                    ? [
                        {
                          label: tr('이어하기'),
                          desc: tr('{name} 선수의 커리어로 돌아가기', {
                            name: state.player.name,
                          }),
                          onSelect: () => setScreen('game'),
                        },
                      ]
                    : []),
                  {
                    label: tr('새 커리어 만들기'),
                    desc: tr('선수를 만들고 고1 시즌부터 시작'),
                    onSelect: reset,
                  },
                ],
              },
              {
                title: tr('명예의 전당'),
                links: [
                  {
                    label: tr('전체 랭킹'),
                    desc: tr('포지션별 베스트 5와 상위 100명'),
                    onSelect: openRanking,
                  },
                ],
              },
              {
                title: tr('안내'),
                links: [
                  {
                    label: tr('개인정보처리방침'),
                    desc: tr('수집하는 정보와 보관 기간'),
                    onSelect: () => openDoc(PRIVACY),
                  },
                  {
                    label: tr('이용약관'),
                    desc: tr('서비스 이용 조건'),
                    onSelect: () => openDoc(TERMS),
                  },
                  {
                    label: tr('게임 확률표'),
                    desc: tr('성장·수상·NBA 진출 등 주요 판정의 확률'),
                    onSelect: () => openDoc(ODDS),
                  },
                  {
                    label: tr('업데이트 소식'),
                    desc: tr('v{version} 까지의 바뀐 점', {
                      version: CHANGELOG[0].version,
                    }),
                    onSelect: openChangelog,
                  },
                  {
                    label: tr('문의하기'),
                    desc: CONTACT_EMAIL,
                    href: `mailto:${CONTACT_EMAIL}`,
                  },
                ],
              },
              {
                title: tr('검색엔진용 파일'),
                links: [
                  {
                    label: 'sitemap.xml',
                    desc: tr('검색엔진에 알려주는 페이지 목록'),
                    file: 'sitemap.xml',
                  },
                  {
                    label: 'robots.txt',
                    desc: tr('검색엔진 수집 허용 규칙'),
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
