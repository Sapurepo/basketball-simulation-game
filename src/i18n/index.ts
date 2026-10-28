import { useSyncExternalStore } from 'react'

export type Lang = 'ko' | 'en' | 'ja'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
]

// 엔진이 만드는 문장: 한국어 원문(string) 또는 템플릿+변수. 템플릿 k 는 한국어 원문 그대로가 카탈로그 키다.
// 변수: 문자열·숫자는 원문 그대로 한 번만 넣는다(선수 이름 등). 번역할 값은 TextObj 로 넘긴다(T('팀명'))
export interface TextObj {
  k: string
  v?: Vars
}
export type Vars = Record<string, string | number | TextObj>
export type Text = string | TextObj

// 번역할 변수 값 (팀·학교·능력치 이름 등 카탈로그에 있는 한국어)
export const T = (k: string): TextObj => ({ k })

// 카탈로그: 한국어 원문 → 번역. 동적 라벨은 정규식 패턴 → 템플릿 ({1}, {2} 는 캡처, 캡처도 번역한다)
export interface Catalog {
  text: Record<string, string>
  patterns: [RegExp, string][]
}

// 기본이 한국어라 번역 카탈로그(번들의 약 1/4)는 그 언어를 쓸 때 따로 받는다
const CATALOGS: Partial<Record<Exclude<Lang, 'ko'>, Catalog>> = {}
const LOADERS = { en: () => import('./en'), ja: () => import('./ja') }
export async function loadLang(l: Lang) {
  if (l !== 'ko') CATALOGS[l] ??= (await LOADERS[l]()).default
}
const KEY = 'lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'ko' || saved === 'en' || saved === 'ja') return saved
  } catch {
    // 저장소 접근 불가
  }
  const nav = typeof navigator === 'undefined' ? '' : navigator.language
  return nav.startsWith('ja') ? 'ja' : nav.startsWith('en') ? 'en' : 'ko'
}

let lang: Lang = detect()
const subs = new Set<() => void>()

export const getLang = () => lang
// 받아 둔 언어는 바로, 아니면 카탈로그를 받은 뒤에 바꾼다 (그동안은 이전 언어 그대로)
export function setLang(l: Lang) {
  if (l !== 'ko' && !CATALOGS[l])
    return void loadLang(l).then(
      () => setLang(l),
      () => {},
    )
  lang = l
  try {
    localStorage.setItem(KEY, l)
  } catch {
    // 저장 못 해도 이번 세션은 바뀐다
  }
  applyToDocument()
  subs.forEach((f) => f())
}
// <html lang> 과 탭 제목
function applyToDocument() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.title = tr('벤치에서 파엠까지')
}

export const useLang = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => lang,
  )

// 변수 치환. 한 번만 바꾸고(넣은 값 안의 {…} 는 다시 보지 않는다) TextObj 값은 render 로 그린다
const fill = (
  tpl: string,
  v: Vars | undefined,
  render: (t: TextObj) => string,
) =>
  v
    ? tpl.replace(/\{(\w+)\}/g, (m, n: string) => {
        if (!(n in v)) return m
        const x = v[n]
        return typeof x === 'object' ? render(x) : String(x)
      })
    : tpl

// 한국어 원문으로 채운 문장 (엔진 식별자 판정용)
export const ko = (t: Text): string =>
  typeof t === 'string' ? t : fill(t.k, t.v, ko)

// 한국어 원문 k 를 현재 언어로. 카탈로그에 없으면 패턴, 그래도 없으면 원문
export function tr(k: string, v?: Vars): string {
  return fill(lookup(k), v, tx)
}

export const tx = (t: Text): string =>
  typeof t === 'string' ? tr(t) : tr(t.k, t.v)

// 카탈로그 → 패턴(캡처는 다시 lookup, 캡처는 원문보다 짧아 끝난다) → 원문
function lookup(k: string): string {
  if (lang === 'ko') return k
  const c = CATALOGS[lang]
  if (!c) return k
  const hit = c.text[k]
  if (hit !== undefined) return hit
  for (const [re, tpl] of c.patterns) {
    const m = k.match(re)
    if (m) return tpl.replace(/\{(\d)\}/g, (_, i) => lookup(m[Number(i)]))
  }
  return k
}

// 모듈 끝에서 호출: tr 이 쓰는 fill·lookup 이 모두 초기화된 뒤여야 한다
applyToDocument()
// 처음 언어의 카탈로그. main 이 기다린 뒤 그린다 (못 받으면 한국어 원문으로)
export const langReady = loadLang(lang).then(applyToDocument, () => {})
