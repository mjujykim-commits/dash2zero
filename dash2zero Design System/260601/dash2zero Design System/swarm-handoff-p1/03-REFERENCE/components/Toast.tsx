/**
 * Toast + ToastProvider — transient feedback system (P1.2, Reanimated)
 *
 * Source: dash2zero Design System / swarm-handoff-p1/01-WORK-ORDER.md §4
 * Target: apps/mobile/src/components/d022/Toast.tsx
 *         apps/mobile/src/providers/ToastProvider.tsx
 *
 * ADR-0009 정합: Reanimated 전용. worklet 가이드 §7 패턴 기반.
 *
 * 우선순위 정책 (Designer §Q3 — 수정 승인):
 *   - error:       즉시 표시, z-index 최상위, 5s OR action 있으면 수동 dismiss까지 유지
 *   - user-action: queue, 3s
 *   - system:      queue, 3s
 *   - Max 3 stack — 4번째는 queue 대기
 *
 * worklet 체크리스트 C1~C8 정합:
 *   - C1 useSharedValue/useAnimatedStyle  - C2 "worklet"  - C3 runOnJS 분리
 *   - C5 cancelAnimation cleanup  - C6 token 사용  - C7 transform+opacity only
 *
 * Reduce Motion: translateY 차단, opacity fade만.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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

// ── single Toast ───────────────────────────────────────────────
function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const ty = useSharedValue(-24);
  const opacity = useSharedValue(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let m = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => m && setReduce(v));
    return () => { m = false; };
  }, []);

  useEffect(() => {
    if (item.priority === "error") void hapticNotification("warning");
    ty.value = withTiming(0, { duration: duration["motion.sheet"], easing: rnEasing.out });
    opacity.value = withTiming(1, { duration: duration["motion.sheet"] });

    // action 있는 error는 auto-dismiss 안 함 (수동 dismiss) — Designer §Q3 수정안
    const persistent = item.priority === "error" && !!item.action;
    if (persistent) return;

    const ms = item.priority === "error" ? 5000 : 3000;
    const timer = setTimeout(() => exit(), ms);
    return () => {
      clearTimeout(timer);
      cancelAnimation(ty);
      cancelAnimation(opacity);
    };
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
          flexDirection: "row", alignItems: "center", gap: 12,
          backgroundColor: lightColors["surface.card"],
          borderWidth: 1, borderColor: lightColors["border.subtle"],
          borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
          marginBottom: 8,
          shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4, shadowRadius: 24, elevation: 8,
        },
      ]}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: DOT_COLOR[item.priority] }} />
      <Text style={{ flex: 1, fontSize: 13, color: lightColors["text.primary"] }}>{item.message}</Text>
      {item.action && (
        <Pressable onPress={() => { item.action!.onPress(); onDismiss(item.id); }} hitSlop={8}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: lightColors["neon.cyan"] }}>
            {item.action.label}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ── Provider + hook ────────────────────────────────────────────
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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const queue = useRef<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((cur) => {
      const next = cur.filter((t) => t.id !== id);
      if (queue.current.length && next.length < MAX_STACK) {
        next.push(queue.current.shift()!);
      }
      return next;
    });
  }, []);

  const show = useCallback<ToastCtx["show"]>((message, priority = "user-action", action) => {
    const item: ToastItem = { id: nextId.current++, message, priority, action };
    setItems((cur) => {
      // error는 stack 최상위로 즉시 삽입
      if (priority === "error") return [...cur, item].slice(-MAX_STACK);
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
        style={{ position: "absolute", left: 16, right: 16, bottom: 32, alignItems: "stretch" }}
      >
        {items.map((t) => <Toast key={t.id} item={t} onDismiss={dismiss} />)}
      </View>
    </ToastContext.Provider>
  );
}
