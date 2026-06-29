import { defineConfig } from "tsup";

/**
 * tsup config for @dash2zero/srs-core (ADR-0006).
 *
 * 산출물:
 *   - dist/index.js   (ESM — Edge Functions / Deno 호환, mobile metro 둘 다 사용)
 *   - dist/index.cjs  (CJS — Node 도구 (vitest, scripts/eval) 호환)
 *   - dist/index.d.ts (TypeScript 타입)
 *
 * 제약:
 *   - platform: "neutral" — Node-only API 금지 (Deno runtime 호환)
 *   - 외부 의존 0 — Intl / Date 표준 API만 사용
 *   - tree-shakeable — applySrsTransition / computeNextDue 등 개별 import 가능해야 함
 *
 * Deno deploy sync (Phase 2):
 *   CI는 빌드 후 dist/index.js를 supabase/functions/_shared/srs.ts로 복사하거나
 *   Deno import map (deno.json)에서 본 파일을 참조하도록 설정.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  platform: "neutral",
  target: "es2022",
  outDir: "dist",
});
