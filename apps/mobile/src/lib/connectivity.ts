/**
 * Connectivity — NetInfo wrapper
 *
 * 책임:
 *   - online 전이 감지 → callback 호출 (retry queue flush 트리거)
 *   - 현재 online 상태 query
 *
 * 호출 시점:
 *   - _layout: 앱 mount + NetInfo.addEventListener
 *   - 다른 시점 필요 시 isCurrentlyOnline() helper
 *
 * 책임 agent: frontend
 */

import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

type Unsubscribe = () => void;

let lastIsConnected: boolean | null = null;

function readConnected(state: NetInfoState): boolean {
  // isConnected가 true이고 isInternetReachable이 false가 아닌 경우만 online으로 간주
  // (캡티브 포털 + Wi-Fi connected이지만 internet 끊긴 상태 회피)
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * online 전이 (offline → online) 감지 시 callback 호출.
 * 첫 mount 시 현재 상태가 online이면 즉시 callback 호출하지 않음 (lastIsConnected가 false에서 true로 갈 때만).
 */
export function onTransitionOnline(callback: () => void | Promise<void>): Unsubscribe {
  return NetInfo.addEventListener((state) => {
    const isOnline = readConnected(state);
    if (lastIsConnected === false && isOnline) {
      void callback();
    }
    lastIsConnected = isOnline;
  });
}

export async function isCurrentlyOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return readConnected(state);
}
