/**
 * Evaluation Runner — dash2zero harness (ADR-0003)
 *
 * Usage:
 *   pnpm tsx scripts/eval/runner.ts [--category srs|payment|privacy|content|all] [--strict]
 *
 * Reads:
 *   fixtures/golden/{srs,payment,privacy,content}/*.yaml
 *   fixtures/adversarial/{rls,payment,privacy}/*.yaml
 *
 * Output:
 *   stdout: 진행률 + 결과 매트릭스
 *   exit code 0: 모든 case 통과
 *   exit code 1: 하나라도 실패 (CI 차단)
 *
 * Source of truth: docs/harness/EVALUATION_SCENARIOS.md (87 case)
 *
 * 책임 agent: analytics + qa
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { evaluateSrsCase, type SrsCase } from "./srs";
import { evaluatePaymentCase, type PaymentCase } from "./payment";
import { evaluatePrivacyCase, type PrivacyCase } from "./privacy";
import { evaluateContentCase, type ContentCase } from "./content";
import { evaluateRlsCase, assertAllPoliciesClassified, type RlsAdvCase } from "./rls";

type Category = "srs" | "payment" | "privacy" | "content" | "rls";
type Outcome = "pass" | "fail" | "skip";

interface CaseResult {
  id: string;
  category: Category;
  outcome: Outcome;
  reason?: string;
  durationMs: number;
}

const REPO_ROOT = process.cwd();
const FIXTURES_GOLDEN = join(REPO_ROOT, "fixtures", "golden");
const FIXTURES_ADVERSARIAL = join(REPO_ROOT, "fixtures", "adversarial");

function loadYamlDir(dir: string): Array<{ id: string; data: unknown }> {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch {
    return [];
  }
  return entries.map((file) => {
    const raw = readFileSync(join(dir, file), "utf-8");
    const data = parseYaml(raw);
    return { id: data?.id ?? file.replace(/\.ya?ml$/, ""), data };
  });
}

async function runCategory(category: Category): Promise<CaseResult[]> {
  const dir = ["rls"].includes(category)
    ? join(FIXTURES_ADVERSARIAL, category)
    : join(FIXTURES_GOLDEN, category);
  const cases = loadYamlDir(dir);
  const results: CaseResult[] = [];

  for (const c of cases) {
    const start = Date.now();
    try {
      let outcome: Outcome = "pass";
      let reason: string | undefined;

      if (category === "srs") {
        const result = evaluateSrsCase(c.data as SrsCase);
        if (!result.pass) {
          outcome = "fail";
          reason = result.diff.join("; ");
        }
      } else if (category === "payment") {
        const result = evaluatePaymentCase(c.data as PaymentCase);
        if (!result.pass) {
          outcome = "fail";
          reason = result.diff.join("; ");
        }
      } else if (category === "privacy") {
        const result = evaluatePrivacyCase(c.data as PrivacyCase);
        if (!result.pass) {
          outcome = "fail";
          reason = result.diff.join("; ");
        }
      } else if (category === "content") {
        const result = evaluateContentCase(c.data as ContentCase);
        if (!result.pass) {
          outcome = "fail";
          reason = result.diff.join("; ");
        }
      } else if (category === "rls") {
        const result = evaluateRlsCase(c.data as RlsAdvCase);
        if (!result.pass) {
          outcome = "fail";
          reason = result.diff.join("; ");
        }
      }

      results.push({
        id: c.id,
        category,
        outcome,
        reason,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      results.push({
        id: c.id,
        category,
        outcome: "fail",
        reason: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      });
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const category = (args.find((a) => a.startsWith("--category="))?.split("=")[1] ?? "all") as Category | "all";
  const strict = args.includes("--strict");

  const categories: Category[] =
    category === "all" ? ["srs", "payment", "privacy", "content", "rls"] : [category as Category];

  console.log("=".repeat(60));
  console.log("dash2zero — Evaluation Runner");
  console.log(`Categories: ${categories.join(", ")}`);
  console.log(`Strict mode: ${strict}`);
  console.log("=".repeat(60));

  // RLS startup guard — 미분류 정책 0건 단언 (strict).
  if (categories.includes("rls")) {
    try {
      const report = assertAllPoliciesClassified(strict);
      console.log(
        `[rls] policies parsed=${report.total} classified=${report.classified} ` +
          `unmapped=${report.unmapped.length} ` +
          `categories=${JSON.stringify(report.byCategory)}`,
      );
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }

  const allResults: CaseResult[] = [];
  for (const cat of categories) {
    const start = Date.now();
    const results = await runCategory(cat);
    const passed = results.filter((r) => r.outcome === "pass").length;
    const failed = results.filter((r) => r.outcome === "fail").length;
    const skipped = results.filter((r) => r.outcome === "skip").length;

    // strict + rls 카테고리에서 case 0건이면 ready=false 표시 (skip 아님)
    if (strict && cat === "rls" && results.length === 0) {
      console.log(`[${cat}] FAIL — strict mode 에서 fixture 0건 (${Date.now() - start}ms)`);
      process.exit(1);
    }

    console.log(
      `[${cat}] ${passed} pass / ${failed} fail / ${skipped} skip   (${Date.now() - start}ms)`,
    );

    for (const r of results) {
      if (r.outcome === "fail") {
        console.log(`  FAIL ${r.id}: ${r.reason}`);
      } else if (r.outcome === "skip" && !strict) {
        console.log(`  SKIP ${r.id}: ${r.reason}`);
      }
    }

    allResults.push(...results);
  }

  console.log("=".repeat(60));
  const totalPass = allResults.filter((r) => r.outcome === "pass").length;
  const totalFail = allResults.filter((r) => r.outcome === "fail").length;
  const totalSkip = allResults.filter((r) => r.outcome === "skip").length;
  console.log(`TOTAL: ${totalPass} pass / ${totalFail} fail / ${totalSkip} skip / ${allResults.length} total`);

  // strict mode: fail이 있거나 (skip이 있으면서 strict) 시 exit 1
  if (totalFail > 0 || (strict && totalSkip > 0)) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
