/**
 * Analytics + Crashlytics — NO-OP 스텁 (개인용 TestFlight 빌드, 2026-06-29)
 *
 * 배경:
 *   - 원본은 @react-native-firebase/analytics + crashlytics 통합이었으나,
 *     (1) Expo managed에서 Firebase는 config plugin + GoogleService-Info.plist +
 *         static frameworks 설정이 없으면 EAS 빌드가 실패하고,
 *     (2) 1인 개인 사용 빌드에서는 분석/크래시 수집이 무의미하다.
 *   - 따라서 Firebase 의존을 제거하고 공개 API 시그니처만 보존한 no-op으로 대체.
 *   - 모든 호출부(privacy-choices / lesson / SRS emit 등)는 수정 없이 그대로 동작.
 *
 * 정식 출시(GA) 시 복원:
 *   - git 이력의 Firebase 버전 analytics.ts 복구 +
 *     app.json plugins에 "@react-native-firebase/app"/"crashlytics" 추가 +
 *     ios.googleServicesFile + expo-build-properties useFrameworks:"static" +
 *     package.json에 @react-native-firebase/* 의존 재추가.
 *   - 자세한 절차: docs/release/TESTFLIGHT_RUNBOOK.md §3.
 */

import * as Crypto from "expo-crypto";
import type { AnalyticsEventName, TraceCollector, Span } from "@dash2zero/contracts";

// 개발 빌드에서만 이벤트를 콘솔로 흘려 디버깅 가능 (프로덕션은 완전 무음)
const DEBUG_LOG = typeof __DEV__ !== "undefined" && __DEV__;

let analyticsConsentApplied = false;

// ----------------------------------------------------------------------------
// Session ID (baseline funnel 결합용) — Firebase 제거 후에도 로직 보존.
// in-memory, 콜드 스타트마다 새로 생성, 5분 백그라운드 timeout 후 회전.
// ----------------------------------------------------------------------------

const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
let currentSessionId: string | null = null;
let lastEventAt = 0;

function getOrRotateSessionId(): string {
  const now = Date.now();
  if (!currentSessionId || now - lastEventAt > SESSION_TIMEOUT_MS) {
    currentSessionId = Crypto.randomUUID();
  }
  lastEventAt = now;
  return currentSessionId;
}

/** 명시적 세션 회전 — app foreground 진입 등에서 호출 가능. */
export function rotateSession(): string {
  currentSessionId = Crypto.randomUUID();
  lastEventAt = Date.now();
  return currentSessionId;
}

/**
 * 동의 적용 (privacy-choices.tsx에서 호출).
 * no-op 빌드에서는 플래그만 기록 (실제 수집 대상 없음).
 */
export async function applyConsent(analyticsConsent: boolean, _crashConsent: boolean): Promise<void> {
  analyticsConsentApplied = analyticsConsent || true; // essential 외 이벤트도 콘솔 디버깅 허용
  if (DEBUG_LOG) console.log("[analytics:stub] applyConsent", { analyticsConsent, _crashConsent });
}

const ESSENTIAL_EVENTS: ReadonlyArray<AnalyticsEventName> = [
  "app_open",
  "age_gate_completed",
  "privacy_choices_completed",
];

/** 이벤트 송신 — no-op (개발 빌드에서만 콘솔 출력). */
export async function logEvent(name: AnalyticsEventName, params?: Record<string, unknown>): Promise<void> {
  if (!analyticsConsentApplied && !ESSENTIAL_EVENTS.includes(name)) {
    return;
  }
  const merged = { session_id: getOrRotateSessionId(), ...(params ?? {}) };
  if (DEBUG_LOG) console.log(`[analytics:stub] ${name}`, sanitizeParams(merged));
}

// ============================================================================
// SRS milestone emit helpers — 시그니처 보존 (logEvent로 위임).
// ============================================================================

export interface SrsEventBaseProps {
  word_id: string;
  pack_id: string;
  triggered_by: "lesson" | "review";
  local_day: string;
  stage_before: 1 | 2 | 3 | 4 | 5;
  stage_after: 1 | 2 | 3 | 4 | 5;
  weak_before: boolean;
  weak_after: boolean;
  same_cycle: boolean;
}

export async function emitSrsMasteredReached(props: SrsEventBaseProps): Promise<void> {
  await logEvent("srs_mastered_reached", { ...props, reason: "stage_5_first_entry" });
}

export async function emitSrsMasteredLost(props: SrsEventBaseProps): Promise<void> {
  const reason = props.same_cycle && props.stage_after === 1 ? "same_cycle_consecutive_wrong" : "single_wrong_protected";
  await logEvent("srs_mastered_lost", { ...props, reason });
}

export async function emitSrsWeakFlagged(props: SrsEventBaseProps): Promise<void> {
  await logEvent("srs_weak_flagged", { ...props, reason: "same_cycle_consecutive_wrong" });
}

function sanitizeParams(params?: Record<string, unknown>): Record<string, string | number | boolean> {
  if (!params) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else {
      out[k] = JSON.stringify(v).slice(0, 100);
    }
  }
  return out;
}

/**
 * TraceCollector 어댑터 (ADR-0002) — no-op 구현.
 * span 측정은 유지하되 외부 송신만 제거 (개발 빌드는 콘솔).
 */
export const firebaseTraceCollector: TraceCollector = {
  startSpan(name, attrs) {
    const startedAt = Date.now();
    return {
      setAttribute: () => undefined,
      recordException: (err) => {
        if (DEBUG_LOG) console.warn(`[analytics:stub] exception in span ${name}`, err);
      },
      end: () => {
        if (DEBUG_LOG) {
          console.log(`[analytics:stub] span_${name}`, {
            duration_ms: Date.now() - startedAt,
            ...sanitizeParams(attrs),
          });
        }
      },
    } satisfies Span;
  },
  recordEvent(name, attrs) {
    if (DEBUG_LOG) console.log(`[analytics:stub] ${name}`, sanitizeParams({ ...attrs }));
  },
  async flush() {
    // no-op
  },
};

/** 사용자 식별자 설정 — no-op (수집 대상 없음). */
export async function setUserId(supabaseUserId: string | null): Promise<void> {
  if (DEBUG_LOG) console.log("[analytics:stub] setUserId", supabaseUserId);
}
