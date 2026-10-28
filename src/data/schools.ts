// 실명 사용: 학교명만. strength 는 게임 밸런스용 가상 수치이며 실제 전력 평가가 아니다.
export interface School {
  id: string
  name: string
  region: string
  strength: number
}

export const HIGH_SCHOOLS: School[] = [
  { id: 'yongsan', name: '용산고', region: '서울', strength: 56 },
  { id: 'gyeongbok', name: '경복고', region: '서울', strength: 54 },
  { id: 'whimoon', name: '휘문고', region: '서울', strength: 53 },
  { id: 'hongdae', name: '홍대부고', region: '서울', strength: 52 },
  { id: 'myongji', name: '명지고', region: '서울', strength: 50 },
  { id: 'baejae', name: '배재고', region: '서울', strength: 47 },
  { id: 'samil', name: '삼일상고', region: '경기', strength: 54 },
  { id: 'anyang', name: '안양고', region: '경기', strength: 50 },
  { id: 'nakseng', name: '낙생고', region: '경기', strength: 51 },
  { id: 'songdo', name: '송도고', region: '인천', strength: 52 },
  { id: 'jemulpo', name: '제물포고', region: '인천', strength: 50 },
  { id: 'murong', name: '무룡고', region: '울산', strength: 51 },
  { id: 'gunsan', name: '군산고', region: '전북', strength: 49 },
  { id: 'jeonju', name: '전주고', region: '전북', strength: 47 },
  { id: 'daejeon', name: '대전고', region: '대전', strength: 47 },
  { id: 'masan', name: '마산고', region: '경남', strength: 48 },
  { id: 'yangjeong', name: '양정고', region: '부산', strength: 48 },
  { id: 'gwangshin', name: '광신방송예술고', region: '서울', strength: 46 },
]

// 대학농구 U-리그 남자 1부 (2026 시즌 11개 팀 체제 기준, 명단은 근사치)
export const UNIVERSITIES: School[] = [
  { id: 'korea', name: '고려대', region: '서울', strength: 66 },
  { id: 'yonsei', name: '연세대', region: '서울', strength: 65 },
  { id: 'chungang', name: '중앙대', region: '서울', strength: 61 },
  { id: 'skku', name: '성균관대', region: '서울', strength: 61 },
  { id: 'kyunghee', name: '경희대', region: '서울', strength: 60 },
  { id: 'hanyang', name: '한양대', region: '서울', strength: 59 },
  { id: 'dongguk', name: '동국대', region: '서울', strength: 58 },
  { id: 'dankook', name: '단국대', region: '경기', strength: 58 },
  { id: 'konkuk', name: '건국대', region: '서울', strength: 58 },
  { id: 'myongjiu', name: '명지대', region: '서울', strength: 55 },
  { id: 'sangmyung', name: '상명대', region: '서울', strength: 54 },
]

// 미국 대학 (NCAA 디비전 1 강호, 명단은 근사치). 고교 OVR 이 높으면 제안이 온다
export const US_COLLEGES: School[] = [
  { id: 'duke', name: '듀크대', region: '미국', strength: 74 },
  { id: 'kentucky', name: '켄터키대', region: '미국', strength: 73 },
  { id: 'kansas', name: '캔자스대', region: '미국', strength: 73 },
  { id: 'unc', name: '노스캐롤라이나대', region: '미국', strength: 72 },
  { id: 'uconn', name: '코네티컷대', region: '미국', strength: 72 },
  { id: 'ucla', name: 'UCLA', region: '미국', strength: 71 },
  { id: 'gonzaga', name: '곤자가대', region: '미국', strength: 70 },
  { id: 'arizona', name: '애리조나대', region: '미국', strength: 70 },
]

// 대학 무대에서 소속이 미국 대학인지 (stage 는 COLLEGE 로 같다)
export const isUsCollege = (teamId: string) =>
  US_COLLEGES.some((u) => u.id === teamId)

export const HS_TOURNAMENTS = [
  '춘계전국남녀중고농구연맹전',
  '협회장기 전국남녀중고농구대회',
  '연맹회장기 전국남녀중고농구대회',
  '주말리그 왕중왕전',
]
