/**
 * useVerticalSwipe — 세로 스와이프(위/아래) 감지. 틱톡/쇼츠식 "위로 스와이프 → 다음".
 *
 * core PanResponder 사용(추가 의존성 없음). 탭은 그대로 자식(버튼 등)에 전달되고,
 * 세로 방향 드래그가 임계값을 넘을 때만 제스처를 가로챈다.
 * 반환한 panHandlers를 대상 View에 spread.
 */
import { useRef } from "react";
import { PanResponder } from "react-native";

const START = 14; // 이 이상 세로로 움직여야 제스처 시작(탭 보호)
const THRESHOLD = 55; // release 시 이 이상이면 스와이프 확정

interface Opts {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enabled?: boolean;
}

export function useVerticalSwipe({ onSwipeUp, onSwipeDown, enabled = true }: Opts) {
  // 콜백/enabled 최신값을 ref로 유지(PanResponder는 1회만 생성)
  const cb = useRef({ onSwipeUp, onSwipeDown, enabled });
  cb.current = { onSwipeUp, onSwipeDown, enabled };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // 탭은 자식에게
      onMoveShouldSetPanResponder: (_e, g) =>
        cb.current.enabled && Math.abs(g.dy) > START && Math.abs(g.dy) > Math.abs(g.dx) * 1.2,
      onPanResponderRelease: (_e, g) => {
        if (!cb.current.enabled) return;
        if (g.dy <= -THRESHOLD) cb.current.onSwipeUp?.();
        else if (g.dy >= THRESHOLD) cb.current.onSwipeDown?.();
      },
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  return responder.panHandlers;
}
