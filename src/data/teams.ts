// 구단명은 상표 회피를 위해 실제 명칭을 변형해 사용한다. 기업명은 제외하고 연고지만 남긴다.
export interface ProTeam {
  id: string
  name: string
  conference?: 'East' | 'West'
}

export const KBL_TEAMS: ProTeam[] = [
  { id: 'seoul-k', name: '서울 나이턴스' },
  { id: 'seoul-t', name: '서울 썬더런스' },
  { id: 'changwon', name: '창원 세이컨스' },
  { id: 'suwon', name: '수원 소닉붐스' },
  { id: 'anyang', name: '안양 레드부스턴스' },
  { id: 'ulsan', name: '울산 피버런스' },
  { id: 'wonju', name: '원주 프로미스' },
  { id: 'goyang', name: '고양 스카이거넌스' },
  { id: 'daegu', name: '대구 페가서런스' },
  { id: 'busan', name: '부산 이지언스' },
]

export const NBA_TEAMS: ProTeam[] = [
  { id: 'atl', name: '애틀랜타 호컨스', conference: 'East' },
  { id: 'bos', name: '보스턴 셀티컨스', conference: 'East' },
  { id: 'bkn', name: '브루클린 넷턴스', conference: 'East' },
  { id: 'cha', name: '샬럿 호네턴스', conference: 'East' },
  { id: 'chi', name: '시카고 불컨스', conference: 'East' },
  { id: 'cle', name: '클리블랜드 캐벌리언스', conference: 'East' },
  { id: 'det', name: '디트로이트 피스턴스', conference: 'East' },
  { id: 'ind', name: '인디애나 페이선스', conference: 'East' },
  { id: 'mia', name: '마이애미 히터스', conference: 'East' },
  { id: 'mil', name: '밀워키 버컨스', conference: 'East' },
  { id: 'nyk', name: '뉴욕 니컨스', conference: 'East' },
  { id: 'orl', name: '올랜도 매지컨스', conference: 'East' },
  { id: 'phi', name: '필라델피아 세븐티식선스', conference: 'East' },
  { id: 'tor', name: '토론토 랩턴스', conference: 'East' },
  { id: 'was', name: '워싱턴 위저던스', conference: 'East' },
  { id: 'dal', name: '댈러스 매버리컨스', conference: 'West' },
  { id: 'den', name: '덴버 너기턴스', conference: 'West' },
  { id: 'gsw', name: '골든스테이트 워리언스', conference: 'West' },
  { id: 'hou', name: '휴스턴 로키턴스', conference: 'West' },
  { id: 'lac', name: 'LA 클리펀스', conference: 'West' },
  { id: 'lal', name: 'LA 레이컨스', conference: 'West' },
  { id: 'mem', name: '멤피스 그리즐런스', conference: 'West' },
  { id: 'min', name: '미네소타 팀버울펀스', conference: 'West' },
  { id: 'nop', name: '뉴올리언스 펠리칸스', conference: 'West' },
  { id: 'okc', name: '오클라호마시티 썬더런스', conference: 'West' },
  { id: 'phx', name: '피닉스 선던스', conference: 'West' },
  { id: 'por', name: '포틀랜드 트레일블레이전스', conference: 'West' },
  { id: 'sac', name: '새크라멘토 킹컨스', conference: 'West' },
  { id: 'sas', name: '샌안토니오 스퍼런스', conference: 'West' },
  { id: 'uta', name: '유타 재즈런스', conference: 'West' },
]
