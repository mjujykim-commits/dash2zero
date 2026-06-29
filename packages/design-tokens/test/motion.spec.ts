/**
 * Motion tokens — unit test
 *
 * Source: dash2zero Design System / swarm-handoff/01-WORK-ORDER.md §2.3
 * Sealed: D-028 (2026-05-27)
 *
 * 검증 범위:
 *   1. duration 토큰 9키 정확 값 (Work Order §2.1)
 *   2. duration 범위 sanity (80~1000ms — hero motion 한계)
 *   3. easing 5종 + RN 매핑 5종 존재 확인
 *   4. MOTION_TOKENS legacy alias 동기 (D-023~D-027 봉인 보존)
 */

import { describe, expect, test } from "vitest";

import { duration, easing, rnEasing, MOTION_TOKENS } from "../src/motion";

describe("duration tokens", () => {
  test("Work Order §2.1 9키 정확 값", () => {
    expect(duration["motion.tap"]).toBe(80);
    expect(duration["motion.fast"]).toBe(150);
    expect(duration["motion.base"]).toBe(200);
    expect(duration["motion.stage"]).toBe(240);
    expect(duration["motion.spring"]).toBe(320);
    expect(duration["motion.sheet"]).toBe(360);
    expect(duration["motion.slow"]).toBe(300);
    expect(duration["motion.progress"]).toBe(600);
    expect(duration["motion.count"]).toBe(900);
  });

  test("모든 duration은 80~1000ms 범위 (Work Order §2.3)", () => {
    Object.values(duration).forEach((ms) => {
      expect(ms).toBeGreaterThanOrEqual(80);
      expect(ms).toBeLessThanOrEqual(1000);
    });
  });
});

describe("easing tokens", () => {
  test("5종 easing 존재 (Work Order §2.1)", () => {
    expect(easing.out).toBeDefined();
    expect(easing.in).toBeDefined();
    expect(easing.inOut).toBeDefined();
    expect(easing.spring).toBeDefined();
    expect(easing.shake).toBeDefined();
  });

  test("spring/shake easing은 Work Order §2.1 정확 cubic-bezier", () => {
    expect(easing.spring).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
    expect(easing.shake).toBe("cubic-bezier(0.36, 0.07, 0.19, 0.97)");
  });
});

describe("rnEasing tokens", () => {
  test("React Native Easing 함수 5종 export", () => {
    expect(typeof rnEasing.out).toBe("function");
    expect(typeof rnEasing.in).toBe("function");
    expect(typeof rnEasing.inOut).toBe("function");
    expect(typeof rnEasing.spring).toBe("function");
    expect(typeof rnEasing.shake).toBe("function");
  });
});

describe("MOTION_TOKENS legacy alias (D-023~D-027 봉인)", () => {
  test("Duration alias가 신규 duration과 동기", () => {
    expect(MOTION_TOKENS.DURATION_QUICK).toBe(duration["motion.fast"]);
    expect(MOTION_TOKENS.DURATION_NORMAL).toBe(duration["motion.slow"]);
  });

  test("EASE_BOUNCE는 rnEasing.spring과 동일", () => {
    expect(MOTION_TOKENS.EASE_BOUNCE).toBe(rnEasing.spring);
  });

  test("SHAKE_TOTAL_DURATION은 motion.sheet 360ms (Work Order §4.2)", () => {
    expect(MOTION_TOKENS.SHAKE_TOTAL_DURATION).toBe(duration["motion.sheet"]);
    expect(MOTION_TOKENS.SHAKE_TOTAL_DURATION).toBe(360);
  });

  test("AudioButton token (D-028 일령화)", () => {
    expect(MOTION_TOKENS.AUDIO_RING_DURATION).toBe(1400);
    expect(MOTION_TOKENS.AUDIO_SPINNER_DURATION).toBe(900);
    expect(MOTION_TOKENS.AUDIO_PULSE_HALF).toBe(700);
  });

  test("Pulse/Shimmer/Press 상수 보존", () => {
    expect(MOTION_TOKENS.PULSE_SCALE_END).toBe(2.2);
    expect(MOTION_TOKENS.PULSE_DURATION).toBe(450);
    expect(MOTION_TOKENS.SHIMMER_LOOP_DURATION).toBe(1600);
    expect(MOTION_TOKENS.PRESSED_SCALE).toBe(0.96);
  });
});
