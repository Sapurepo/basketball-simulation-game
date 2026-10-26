// 구단명·로고는 실제 명칭을 쓴다. 권리는 각 구단과 리그에 있다 (public/logos).
export interface ProTeam {
  id: string
  name: string
  conference?: 'East' | 'West'
}

export const KBL_TEAMS: ProTeam[] = [
  { id: 'seoul-k', name: '서울 SK 나이츠' },
  { id: 'seoul-t', name: '서울 삼성 썬더스' },
  { id: 'changwon', name: '창원 LG 세이커스' },
  { id: 'suwon', name: '수원 KT 소닉붐' },
  { id: 'anyang', name: '안양 정관장 레드부스터스' },
  { id: 'ulsan', name: '울산 현대모비스 피버스' },
  { id: 'wonju', name: '원주 DB 프로미' },
  { id: 'goyang', name: '고양 소노 스카이거너스' },
  { id: 'daegu', name: '대구 한국가스공사 페가수스' },
  { id: 'busan', name: '부산 KCC 이지스' },
]

export const NBA_TEAMS: ProTeam[] = [
  { id: 'atl', name: '애틀랜타 호크스', conference: 'East' },
  { id: 'bos', name: '보스턴 셀틱스', conference: 'East' },
  { id: 'bkn', name: '브루클린 네츠', conference: 'East' },
  { id: 'cha', name: '샬럿 호네츠', conference: 'East' },
  { id: 'chi', name: '시카고 불스', conference: 'East' },
  { id: 'cle', name: '클리블랜드 캐벌리어스', conference: 'East' },
  { id: 'det', name: '디트로이트 피스턴스', conference: 'East' },
  { id: 'ind', name: '인디애나 페이서스', conference: 'East' },
  { id: 'mia', name: '마이애미 히트', conference: 'East' },
  { id: 'mil', name: '밀워키 벅스', conference: 'East' },
  { id: 'nyk', name: '뉴욕 닉스', conference: 'East' },
  { id: 'orl', name: '올랜도 매직', conference: 'East' },
  { id: 'phi', name: '필라델피아 세븐티식서스', conference: 'East' },
  { id: 'tor', name: '토론토 랩터스', conference: 'East' },
  { id: 'was', name: '워싱턴 위저즈', conference: 'East' },
  { id: 'dal', name: '댈러스 매버릭스', conference: 'West' },
  { id: 'den', name: '덴버 너기츠', conference: 'West' },
  { id: 'gsw', name: '골든스테이트 워리어스', conference: 'West' },
  { id: 'hou', name: '휴스턴 로키츠', conference: 'West' },
  { id: 'lac', name: 'LA 클리퍼스', conference: 'West' },
  { id: 'lal', name: 'LA 레이커스', conference: 'West' },
  { id: 'mem', name: '멤피스 그리즐리스', conference: 'West' },
  { id: 'min', name: '미네소타 팀버울브스', conference: 'West' },
  { id: 'nop', name: '뉴올리언스 펠리컨스', conference: 'West' },
  { id: 'okc', name: '오클라호마시티 썬더', conference: 'West' },
  { id: 'phx', name: '피닉스 선즈', conference: 'West' },
  { id: 'por', name: '포틀랜드 트레일블레이저스', conference: 'West' },
  { id: 'sac', name: '새크라멘토 킹스', conference: 'West' },
  { id: 'sas', name: '샌안토니오 스퍼스', conference: 'West' },
  { id: 'uta', name: '유타 재즈', conference: 'West' },
]
