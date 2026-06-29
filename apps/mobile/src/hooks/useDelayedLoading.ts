/**
 * useDelayedLoading — short-fetch flash 회피 패턴 (Work Order P0-4 §6.2 (4))
 *
 * Source of Truth: dash2zero Design System / swarm-handoff/01-WORK-ORDER.md §6
 *
 * 사용:
 *   const showSkeleton = useDelayedLoading(summary.isLoading);
 *   if (summary.isLoading && showSkeleton) return <ShimmerSkeleton />;
 *
 * 효과:
 *   isLoading=true가 delay(ms) 이상 지속될 때만 show=true. 짧은 fetch에서
 *   skeleton/spinner 깜빡임 회피 (UX 정합).
 */

import { useEffect, useState } from "react";

export function useDelayedLoading(isLoading: boolean, delay = 150): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [isLoading, delay]);
  return show;
}
