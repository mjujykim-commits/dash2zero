/**
 * SwipeCard — 틱톡/쇼츠식 세로 스와이프. 손가락을 따라 부드럽게 움직이고,
 * 위로 올릴수록 뒤(아래)의 다음 콘텐츠가 미리보기로 올라온다.
 * 임계값/속도를 넘으면 슬라이드 아웃 → onAdvance, 아니면 스프링 복귀.
 *
 * core Animated + PanResponder (추가 의존성 없음). 탭은 자식에 그대로 전달.
 */
import { useRef, type ReactNode } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, View } from "react-native";

const { height: H } = Dimensions.get("window");
const START = 10; // 세로 이동이 이 이상이어야 제스처 시작(탭 보호)
const DIST_THRESHOLD = H * 0.2; // 이만큼 올리면 넘어감
const VEL_THRESHOLD = -0.6; // 또는 이 속도 이상

interface Props {
  enabled: boolean;
  onAdvance: () => void;
  next?: ReactNode; // 미리보기(다음 콘텐츠) — 없으면 슬라이드 아웃만
  children: ReactNode;
}

export function SwipeCard({ enabled, onAdvance, next, children }: Props) {
  const ty = useRef(new Animated.Value(0)).current;
  const cb = useRef({ enabled, onAdvance });
  cb.current = { enabled, onAdvance };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        cb.current.enabled && g.dy < -START && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => {
        if (g.dy < 0) ty.setValue(Math.max(g.dy, -H)); // 위로만 추종
      },
      onPanResponderRelease: (_e, g) => {
        const back = () => Animated.spring(ty, { toValue: 0, useNativeDriver: true, bounciness: 3, speed: 14 }).start();
        if (!cb.current.enabled) return back();
        if (g.dy < -DIST_THRESHOLD || g.vy < VEL_THRESHOLD) {
          Animated.timing(ty, { toValue: -H, duration: 200, useNativeDriver: true }).start(() => {
            cb.current.onAdvance();
            ty.setValue(0); // 새 콘텐츠는 제자리에서 시작
          });
        } else back();
      },
      onPanResponderTerminate: () => Animated.spring(ty, { toValue: 0, useNativeDriver: true, bounciness: 3, speed: 14 }).start(),
    }),
  ).current;

  return (
    <View style={{ flex: 1 }}>
      {next != null ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ translateY: Animated.add(ty, H) }] }]}
        >
          {next}
        </Animated.View>
      ) : null}
      <Animated.View style={{ flex: 1, transform: [{ translateY: ty }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}
