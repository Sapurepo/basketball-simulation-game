import type { LegalDoc } from './legal'

// 푸터 버전을 눌러 보는 업데이트 소식. 최신이 맨 앞. version 은 package.json 과 맞춘다
export interface Release {
  version: string
  date: string
  items: string[]
}

export const CHANGELOG: Release[] = [
  {
    version: '1.1.0',
    date: '2026-10-28',
    items: [
      '영어·일본어를 지원해요. 푸터에서 언어를 바꿀 수 있어요',
      '푸터 공지사항 버튼에서 업데이트 소식을 볼 수 있어요',
      'NBA 파이널 MVP·KBL 챔프전 MVP 를 받으면 축하 연출이 나와요',
      '시즌이 끝나면 능력치와 평균 스탯 옆에 지난 시즌 대비 증감이 보여요',
      '노쇠가 완만해졌고 45세까지 뛸 수 있어요',
      '고교 졸업 때 미국 대학(NCAA)에 갈 수 있고, 거기서 NBA 드래프트에 도전해요',
      '스카우팅 리포트를 횟수 제한 없이 다시 뽑을 수 있어요',
      '상점 가격이 15% 내렸어요',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-28',
    items: [
      '푸터에서 게임 확률표를 볼 수 있어요',
      'NBA 파이널 MVP 를 받기 조금 쉬워졌어요',
      '패스 훈련의 초록 구간이 1.6배 넓어졌어요',
      '랭킹 화면에 새로고침 버튼이 생겼어요',
      '문의하기 링크와 서버비 후원 계좌를 안내해요',
    ],
  },
]

// 마지막으로 본 버전 (localStorage). 새 버전이면 푸터 버전 옆에 점이 뜬다
export const SEEN_VERSION_KEY = 'seenVersion'

export const CHANGELOG_DOC: LegalDoc = {
  title: '업데이트 소식',
  translated: true,
  subtitle: `현재 버전 ${CHANGELOG[0].version}`, // tr 패턴으로 번역
  intro: '배포할 때마다 바뀐 점을 여기에 적어요.',
  sections: CHANGELOG.map((r) => ({
    title: `v${r.version} · ${r.date}`,
    blocks: [{ list: r.items }],
  })),
}
