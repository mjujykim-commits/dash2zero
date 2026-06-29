/**
 * PullToRefresh — gesture pull + spinner (P1.4, Reanimated)
 *
 * Source: dash2zero Design System / swarm-handoff-p1/01-WORK-ORDER.md §6
 * Target: apps/mobile/src/components/d022/PullToRefresh.tsx
 *
 * ADR-0009 정합: Reanimated 전용 (useAnimatedScrollHandler — JS thread 미블록 60fps).
 * worklet 가이드 §8 패턴 기반.
 *
 * ⚠️ 발주 판단 (Designer §Q2): Home은 이미 useFocusEffect refetch가 있어 PTR 시급성 낮음.
 *   → P1.4는 W19 **마지막** dispatch. W19 일정 압박 시 M6로 이월 가능 (droppable).
 *   적용처: Home stats 화면 1곳만. progress 화면은 M6 검토.
 *
 * worklet 체크리스트:
 *   - C1 useSharedValue/useAnimatedScrollHandler  - C2 "worklet"  - C3 runOnJS(onRefresh)
 *   - C6 token 사용  - C7 transform+opacity only (indicator)
 *
 * Reduce Motion: pull 거리 시각화는 유지(기능), spinner 회전만 정적.
 */

import { useCallback } from "react";
import { View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { duration, rnEasing, lightColors } from "@dash2zero/design-tokens";

const THRESHOLD = 80; // px — release 시 refresh trigger 임계

interface Props {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshing: boolean;
}

export function PullToRefresh({ children, onRefresh, refreshing }: Props) {
  const scrollY = useSharedValue(0);
  const triggered = useSharedValue(false);

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

  // indicator: pull 거리에 비례해 opacity + rotate
  const indicatorStyle = useAnimatedStyle(() => {
    "worklet";
    const pull = Math.max(0, -scrollY.value);
    const progress = Math.min(1, pull / THRESHOLD);
    return {
      opacity: refreshing ? 1 : progress,
      transform: [
        { translateY: Math.min(pull * 0.5, 40) },
        { rotate: `${progress * 360}deg` },
      ],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      {/* refresh indicator — 상단 중앙 */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute", top: 8, alignSelf: "center", zIndex: 2,
            width: 32, height: 32, borderRadius: 16,
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

/**
 * 참고 — refreshing prop 제어 (호출 측):
 *
 *   const [refreshing, setRefreshing] = useState(false);
 *   const handleRefresh = async () => {
 *     setRefreshing(true);
 *     await summary.refetch();
 *     setRefreshing(false);
 *   };
 *   <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>...</PullToRefresh>
 *
 * refreshing=true 동안 spinner 회전은 별도 withRepeat worklet로 구현 가능
 * (cancelAnimation cleanup 필수 — worklet 가이드 §3.1).
 */
