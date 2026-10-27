// 승/패 타일. Galmuri 는 "W" 를 ₩ 로 그려서 영문 대신 한글을 쓴다.
export function WinLoss({ win }: { win: boolean }) {
  return <span className={win ? 'wl win' : 'wl loss'}>{win ? '승' : '패'}</span>
}
