/**
 * SRS evaluator unit spec — fixtures와 evaluator 정합성 확인
 * 실행: pnpm -F dash2zero-monorepo test (M3 W14에서 root vitest config 추가)
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { evaluateSrsCase, type SrsCase } from "./srs";

const FIXTURES_DIR = join(process.cwd(), "fixtures", "golden", "srs");

describe("SRS evaluator — golden fixtures", () => {
  const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".yaml"));

  for (const file of files) {
    if (file === "README.md") continue;
    it(`fixture: ${file}`, () => {
      const raw = readFileSync(join(FIXTURES_DIR, file), "utf-8");
      const data = parseYaml(raw) as SrsCase;
      const result = evaluateSrsCase(data);
      if (!result.pass) {
        console.error(`Diffs for ${file}:`, result.diff);
      }
      expect(result.pass).toBe(true);
    });
  }
});
