/**
 * Toast + ToastProvider + useToast — transient feedback system (P1.2, Reanimated)
 *
 * Source of Truth:
 *   - swarm-handoff-p1/01-WORK-ORDER.md §4 + 03-REFERENCE/components/Toast.tsx
 *   - ADR-0009 (D-033, 2026-06-02): Reanimated 첫 사용처
 *   - WORKLET_GUIDE §7 패턴 정합 + C1~C8 체크리스트
 *
 * 우선순위 정책 (Designer Q-3 — 수정 승인):
 *   - error:       최상위 stack 즉시 삽입, 5s OR action 있으면 수동 dismiss까지 유지 (persistent)
 *   - user-action: queue, 3s
 *   - system:      queue, 3s
 *   - Max 3 stack — 4번째는 queue 대기
 *
 * Designer Q-3 추가 가드: 차단성 결제 에러 같은 mandatory user action은 toast가 아닌 기존 Alert 유지.
 *   Toast는 비차단 피드백 (sync 완료, 토글 결과, 알림 권한 부여 등)에 한정.
 *
 * worklet 체크리스트 정합 (WORKLET_GUIDE §9):
 *   - C1 useSharedValue + useAnimatedStyle ✅
 *   - C2 "worklet" directive ✅
 *   - C3 closure 외부 mutable 없음 (runOnJS로 dismiss 분리) ✅
 *   - C4 console.log 없음 ✅
 *   - C5 cancelAnimation cleanup ✅
 *   - C6 duration / rnEasing 토큰 사용 ✅
 *   - C7 transform + opacity only (Rule 5) ✅
 *   - C8 babel plugin 마지막 위치는 babel.config.js에서 보장 ✅
 *
 * Reduce Motion: translateY 차단, opacity fade만.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { duration, rnEasing, lightColors } from "@dash2zero/design-tokens";
import { hapticNotification } from "@/src/lib/haptics";
import { playSfx } from "@/src/lib/sound";

type Priority = "system" | "user-action" | "error";

interface ToastItem {
  id: number;
  message: string;
  priority: Priority;
  action?: { label: string; onPress: () => void };
}

const DOT_COLOR: Record<Priority, string> = {
  error: lightColors["semantic.danger"],
  "user-action": lightColors["neon.lime"],
  system: lightColors["neon.cyan"],
};

// ─────────────────────────────────────────────────────────────
// single Toast
// ─────────────────────────────────────────────────────────────

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const ty = useSharedValue(-24);
  const opacity = useSharedValue(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setReduce(v));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    // error 우선순위는 Haptic Warning 동반 (D-024 정합) + 등장 SFX (error는 정중한 경고, 그 외 미묘한 청음)
    if (item.priority === "error") void hapticNotification("warning");
    void playSfx(item.priority === "error" ? "error" : "toast");

    // Enter — translateY -24→0 + opacity 0→1, motion.sheet 360ms EASE_OUT
    ty.value = withTiming(0, { duration: duration["motion.sheet"], easing: rnEasing.out });
    opacity.value = withTiming(1, { duration: duration["motion.sheet"] });

    // Designer Q-3 수정: action 있는 error toast는 auto-dismiss 금지 (수동 dismiss까지 유지)
    const persistent = item.priority === "error" && !!item.action;
    if (persistent) {
      return () => {
        cancelAnimation(ty);
        cancelAnimation(opacity);
      };
    }

    const ms = item.priority === "error" ? 5000 : 3000;
    const timer = setTimeout(() => {
      exit();
    }, ms);

    return () => {
      clearTimeout(timer);
      cancelAnimation(ty);
      cancelAnimation(opacity);
    };
    // mount 1회만 — item id로 ToastProvider가 key 분리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exit() {
    ty.value = withTiming(-24, { duration: duration["motion.fast"], easing: rnEasing.in });
    opacity.value = withTiming(0, { duration: duration["motion.fast"] }, (finished) => {
      "worklet";
      if (finished) runOnJS(onDismiss)(item.id);
    });
  }

  const style = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: opacity.value,
      transform: reduce ? [] : [{ translateY: ty.value }],
    };
  });

  return (
    <Animated.View
      style={[
        style,
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: lightColors["surface.card"],
          borderWidth: 1,
          borderColor: lightColors["border.subtle"],
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginBottom: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 8,
        },
      ]}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: DOT_COLOR[item.priority],
        }}
      />
      <Text style={{ flex: 1, fontSize: 13, color: lightColors["text.primary"] }}>{item.message}</Text>
      {item.action && (
        <Pressable
          onPress={() => {
            item.action!.onPress();
            onDismiss(item.id);
          }}
          hitSlop={8}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: lightColors["neon.cyan"] }}>
            {item.action.label}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Provider + hook
// ─────────────────────────────────────────────────────────────

interface ToastCtx {
  show: (message: string, priority?: Priority, action?: ToastItem["action"]) => void;
}
const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const MAX_STACK = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const queue = useRef<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((cur) => {
      const next = cur.filter((t) => t.id !== id);
      // queue 대기 항목이 있으면 빈 슬롯에 promote
      if (queue.current.length && next.length < MAX_STACK) {
        next.push(queue.current.shift()!);
      }
      return next;
    });
  }, []);

  const show = useCallback<ToastCtx["show"]>((message, priority = "user-action", action) => {
    const item: ToastItem = { id: nextId.current++, message, priority, action };
    setItems((cur) => {
      // error는 stack 최상위 즉시 삽입 (max 초과 시 가장 오래된 것 제거)
      if (priority === "error") {
        return [...cur, item].slice(-MAX_STACK);
      }
      // 그 외는 max 도달 시 queue 대기
      if (cur.length >= MAX_STACK) {
        queue.current.push(item);
        return cur;
      }
      return [...cur, item];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 32,
          alignItems: "stretch",
        }}
      >
        {items.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}
