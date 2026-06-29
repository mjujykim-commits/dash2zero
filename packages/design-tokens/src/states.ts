/**
 * State Tokens — 5 states (empty / loading / error / offline / idle) × 4 core screens
 *
 * Source: docs/design/STATE_PATTERNS.md
 * Tone: Steady (Honest, no fireworks, no big illustrations)
 *
 * 핵심 원칙:
 *   - icon은 lucide-react-native 또는 SF Symbols 단일 stroke 1.5
 *   - 일러스트 금지 (M5+ marketing 파트만)
 *   - 폭죽/축하 모션 금지
 *   - heading 22, body 16, button 56 — 일관 스케일
 *   - empty/error/offline은 모두 단일 정렬, 단일 CTA
 */

export type StateKind = "empty" | "loading" | "error" | "offline" | "idle";
export type CoreScreen = "home" | "lesson" | "paywall" | "settings";

/** State 시각 사양 토큰 (각 화면 × 각 상태) */
export const stateTokens = {
  home: {
    idle: {
      iconName: null,
      headlineKey: "home.headline",
      bodyKey: "home.body",
      cta: { label: "Start", action: "lesson_start" },
    },
    empty: {
      // total = 0 (today 학습 없음)
      iconName: "check-circle", // lucide outline
      iconSize: 32,
      iconColor: "text.muted",
      headlineKey: "home.empty.headline",            // "All caught up"
      bodyKey: "home.empty.body",                    // "Resets at 4:00 AM local time."
      cta: { label: "View Mastered", action: "open_mastered" }, // 보조 CTA
      ctaVariant: "secondary",
    },
    loading: {
      iconName: null,
      skeleton: { count: 2, height: 32, gap: 12 }, // Today section + Streak/Mastered row
      showSpinner: false, // skeleton만, spinner 금지
      bodyKey: null, // 텍스트 없음
    },
    error: {
      iconName: "alert-circle",
      iconSize: 32,
      iconColor: "semantic.warning",
      headlineKey: "home.error.headline",            // "Couldn't load today"
      bodyKey: "home.error.body",                    // "Pull to refresh."
      cta: { label: "Try again", action: "retry" },
      ctaVariant: "secondary",
    },
    offline: {
      iconName: "cloud-off",
      iconSize: 32,
      iconColor: "text.muted",
      headlineKey: "home.offline.headline",          // "No connection"
      bodyKey: "home.offline.body",                  // "Today's words will load when you're back online."
      cta: null, // 자동 retry. 사용자 액션 불요
    },
  },
  lesson: {
    idle: {
      iconName: null,
      headlineKey: null,
      bodyKey: null,
      cta: { label: "Continue", action: "stage_next" },
    },
    empty: {
      // chain N=0 fetch 결과
      iconName: "check-circle",
      iconSize: 32,
      iconColor: "text.muted",
      headlineKey: "lesson.empty.headline",          // "Nothing to learn right now"
      bodyKey: "lesson.empty.body",                  // "Come back after 4:00 AM."
      cta: { label: "Back to Home", action: "go_home" },
      ctaVariant: "secondary",
    },
    loading: {
      iconName: null,
      // 카드 형태 skeleton — 단어 자리 / RR 자리 / button 자리
      skeleton: { count: 3, heights: [44, 14, 56], gap: 16 },
      showSpinner: false,
      bodyKey: null,
    },
    error: {
      // chain fetch 실패 또는 audio 로드 실패
      iconName: "alert-circle",
      iconSize: 32,
      iconColor: "semantic.warning",
      headlineKey: "lesson.error.headline",          // "Couldn't load this lesson"
      bodyKey: "lesson.error.body",                  // "Check your connection and try again."
      cta: { label: "Try again", action: "retry" },
      ctaVariant: "primary",
    },
    offline: {
      iconName: "cloud-off",
      iconSize: 32,
      iconColor: "text.muted",
      headlineKey: "lesson.offline.headline",        // "Audio unavailable offline"
      bodyKey: "lesson.offline.body",                // "Text lesson works without internet."
      cta: { label: "Continue without audio", action: "skip_audio" },
      ctaVariant: "secondary",
    },
  },
  paywall: {
    idle: {
      iconName: null,
      headlineKey: "paywall.headline",
      bodyKey: null,
      cta: { label: "Subscribe", action: "purchase" },
    },
    empty: {
      // offering = null (RC fetch 0건 — 거의 없음)
      iconName: "alert-circle",
      iconSize: 32,
      iconColor: "text.muted",
      headlineKey: "paywall.empty.headline",         // "Pricing not available"
      bodyKey: "paywall.empty.body",                 // "Please try again later."
      cta: { label: "Try again", action: "retry_offerings" },
      ctaVariant: "secondary",
    },
    loading: {
      iconName: null,
      // plan card 자리 skeleton 2개
      skeleton: { count: 2, heights: [80, 80], gap: 12 },
      showSpinner: false,
      bodyKey: null,
    },
    error: {
      iconName: "alert-circle",
      iconSize: 32,
      iconColor: "semantic.danger",
      headlineKey: "paywall.error.headline",         // "Purchase failed"
      bodyKey: "paywall.error.body",                 // "Your card was not charged. Please try again."
      cta: { label: "Try again", action: "retry_purchase" },
      ctaVariant: "primary",
    },
    offline: {
      iconName: "cloud-off",
      iconSize: 32,
      iconColor: "text.muted",
      headlineKey: "paywall.offline.headline",       // "No connection"
      bodyKey: "paywall.offline.body",               // "Subscribing requires internet."
      cta: null,
    },
  },
  settings: {
    idle: {
      iconName: null,
      headlineKey: "settings.headline",
      bodyKey: null,
      cta: null,
    },
    empty: {
      // settings는 본질적으로 empty 상태 없음. 미정의.
      iconName: null,
      headlineKey: null,
      bodyKey: null,
      cta: null,
    },
    loading: {
      // account info fetch 중
      iconName: null,
      skeleton: { count: 4, height: 56, gap: 0 }, // list item 4개
      showSpinner: false,
      bodyKey: null,
    },
    error: {
      iconName: "alert-circle",
      iconSize: 24, // 상단 inline banner
      iconColor: "semantic.warning",
      headlineKey: "settings.error.headline",        // "Couldn't load account"
      bodyKey: null,
      cta: { label: "Retry", action: "retry" },
      ctaVariant: "ghost",
      placement: "inline_banner", // 상단 1줄 banner. fullscreen empty 아님
    },
    offline: {
      iconName: "cloud-off",
      iconSize: 24,
      iconColor: "text.muted",
      headlineKey: "settings.offline.headline",      // "Some options need internet"
      bodyKey: null,
      cta: null,
      placement: "inline_banner",
    },
  },
} as const;

/** 5상태 디자인 공통 spec */
export const stateLayout = {
  // fullscreen (empty/error/offline)
  fullscreen: {
    paddingHorizontal: 20,    // space.5
    iconMarginBottom: 16,     // space.4
    headlineMarginBottom: 8,  // space.2
    bodyMarginBottom: 24,     // space.6
    align: "center",
    verticalCenter: true,     // flex center
    maxBodyWidth: 280,
  },
  // skeleton (loading)
  skeleton: {
    bgToken: "surface.muted", // light/dark 모두 적용
    radius: 8,
    pulseDurationMs: 1200,    // motion.medium*6, ease-in-out
    pulseOpacityFrom: 0.5,
    pulseOpacityTo: 1.0,
  },
  // banner (settings inline)
  banner: {
    paddingV: 12,
    paddingH: 16,
    radius: 8,
    bgToken: "surface.muted",
    iconGap: 8,
  },
} as const;

export type StateTokenScreen = keyof typeof stateTokens;
export type StateTokenKind = keyof typeof stateTokens.home;
