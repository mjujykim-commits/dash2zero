/**
 * 앱 진입점 — 개인 빌드: 첫 진입 온보딩(welcome / age-gate / privacy-choices / 관심사 onboarding)
 * 을 생략하고 바로 학습 화면(home)으로 이동한다.
 *
 * 주의(정식 출시): age gate는 App Store 13세 미만 차단 요건이라 GA 전 복원 필요.
 * 온보딩 화면들(welcome/age-gate/privacy-choices/onboarding)은 파일로 보존되어 있어
 * settings 등에서 여전히 접근 가능하며, 본 리디렉트만 되돌리면 원래 플로우로 복귀한다.
 */

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/home" />;
}
