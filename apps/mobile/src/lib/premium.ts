/**
 * premium — 유료(예정) 기능 게이트.
 *
 * TOPIK/KIIP 시험대비(Exam prep)는 향후 유료 기능으로 분리 예정.
 * 지금은 개발/베타라 전면 공개(PREMIUM_UNLOCKED=true).
 * 출시 시: isPremium()을 실제 결제 엔타이틀먼트로 교체하고, 잠금 상태면
 * 진입점에서 paywall 화면으로 라우팅하면 됨(진입점이 이미 분리돼 있어 한 곳만 바꾸면 됨).
 */

export const PREMIUM_UNLOCKED = true; // dev/beta: 공개. 출시 시 결제 연동으로 대체.

export function isPremium(): boolean {
  return PREMIUM_UNLOCKED;
}
