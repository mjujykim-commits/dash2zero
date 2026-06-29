/**
 * PullToRefresh — gesture pull + spinner (P1.4, Reanimated)
 *
 * Source of Truth:
 *   - swarm-handoff-p1/01-WORK-ORDER.md §6 + 03-REFERENCE/components/PullToRefresh.tsx
 *   - ADR-0009 (D-033, 2026-06-02): Reanimated 전용 — useAnimatedScrollHandler JS thread 미블록 60fps
 *   - WORKLET_GUIDE §8 PTR 패턴 + C1~C8 체크리스트
 *
 * ⚠️ Designer Q-2 결정 (D-031 정합):
 *   Home은 이미 useFocusEffect refetch가 있어 PTR 시급성 낮음.
 *   → P1.4는 W19 **마지막** dispatch + **W19 일정 압박 시 M6로 이월 가능 (droppable)**.
 *   → Designer §"다음 게이트": 60fps Profiler 첨부가 sign-off 조건.
 *   적용처: Home stats 화면 1곳만. progress 화면은 M6 검토.
 *
 * worklet 체크리스트 정합 (WORKLET_GUIDE §9 C1~C8):
 *   - C1 useSharedValue + useAnimatedScrollHandler ✅
 *   - C2 "worklet" directive ✅
 *   - C3 runOnJS(onRefresh) 분리 ✅
 *   - C4 console.log 없음 ✅
 *   - C5 worklet 내부 무한 anim 없음 (cancelAnimation 불요)
 *   - C6 duration / rnEasing 토큰 사용 ✅
 *   - C7 transform + opacity only (indicator) ✅
 *   - C8 babel plugin 마지막 위치 (D-033 사전 설정) ✅
 *
 * Reduce Motion:
 *   - pull 거리 시각화는 유지 (기능 — opacity + translateY)
 *   - spinner 회전(rotate)만 차단 (시각적 멀미 방지)
 *
 * 사용 패턴:
 *   const [refreshing, setRefreshing] = useState(false);
 *   const handleRefresh = async () => {
 *     setRefreshing(true);
 *     try { await summary.refetch(); } finally { setRefreshing(false); }
 *   };
 *   <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
 *     {children}
 *   </PullToRefresh>
 */

import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { lightColors } from "@dash2zero/design-tokens";

/** release 시 refresh trigger 임계 (px). 표준 iOS PTR 패턴, raw — Work Order §6 본문 명시값. */
const THRESHOLD = 80;

interface Props {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshing: boolean;
}

export function PullToRefresh({ children, onRefresh, refreshing }: Props) {
  const scrollY = useSharedValue(0);
  const triggered = useSharedValue(false);
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

  const fireRefresh = useCallback(() => {
    void onRefresh();
  }, [onRefresh]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      "worklet";
      scrollY.value = e.contentOffset.y;
    },
    onEndDrag: (e) => {
      "worklet";
      // 음수 = overscroll (위로 당김)
      if (e.contentOffset.y < -THRESHOLD && !triggered.value) {
        triggered.value = true;
        runOnJS(fireRefresh)();
      }
    },
    onMomentumEnd: () => {
      "worklet";
      triggered.value = false;
    },
  });

  // indicator: pull 거리에 비례해 opacity + translateY + rotate
  //   refreshing 동안 opacity 1 + rotate progress (정적 위치)
  //   Reduce Motion: rotate 차단, opacity + translateY만 유지
  const indicatorStyle = useAnimatedStyle(() => {
    "worklet";
    const pull = Math.max(0, -scrollY.value);
    const progress = Math.min(1, pull / THRESHOLD);
    return {
      opacity: refreshing ? 1 : progress,
      transform: reduce
        ? [{ translateY: Math.min(pull * 0.5, 40) }]
        : [
            { translateY: Math.min(pull * 0.5, 40) },
            { rotate: `${progress * 360}deg` },
          ],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      {/* refresh indicator — 상단 중앙, neon.pink conic spinner 톤 */}
      <Animated.View
        pointerEvents="none"
        accessibilityLabel={refreshing ? "Refreshing" : undefined}
        accessibilityRole="progressbar"
        style={[
          {
            position: "absolute",
            top: 8,
            alignSelf: "center",
            zIndex: 2,
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 3,
            borderColor: lightColors["neon.pink"],
            borderTopColor: "transparent",
          },
          indicatorStyle,
        ]}
      />
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        {children}
      </Animated.ScrollView>
    </View>
  );
}
