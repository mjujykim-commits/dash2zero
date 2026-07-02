/**
 * 앱 진입점 — Picture Quiz 전용 앱.
 * 모든 학습 기능(레슨/카테고리/복습/온보딩)을 제거하고 그림 퀴즈로 바로 진입한다.
 *
 * 다른 화면 파일들(home/lesson/categories/onboarding 등)은 보존되어 있으나 진입점에서
 * 연결하지 않는다. 되돌리려면 본 리디렉트만 /home 등으로 변경.
 */

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/menu" />;
}
