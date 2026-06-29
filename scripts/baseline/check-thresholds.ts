/**
 * Baseline Threshold Check — M3 W16-01 (W16 D-5 실행 대상)
 *
 * 입력: metrics/daily/*.json 최근 N건 (default 7)
 * 비교: docs/product/PRD.md §8.2 4 KPI band (Target / Minimum / Yellow / Red)
 * 출력:
 *   - metrics/weekly/YYYY-MM-DD-to-YYYY-MM-DD.md (markdown summary)
 *   - exit code: 0 (green) | 1 (yellow) | 2 (red)
 *
 * 사용
 *   pnpm tsx scripts/baseline/check-thresholds.ts \
 *     [--days=7] \
 *     [--metrics-dir=metrics/daily] \
 *     [--out=metrics/weekly] \
 *     [--strict]   # yellow도 exit 1
 *
 * 결정 (ADR-0007 §5):
 *   - baseline runner와 분리 — runner는 적재만, 본 스크립트는 비교만
 *   - threshold는 hard-coded (PRD §8.2와 일치). PRD 변경 시 본 파일도 갱신 필요
 *   - 향후 (M5+) PRD threshold를 JSON으로 분리하여 본 스크립트가 import
 *
 * 책임 agent: analytics
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ============================================================================
// PRD §8.2 4 KPI threshold (commit @ 2026-05-12, W15 Day-1)
// ============================================================================

type BandTier = "green" | "yellow" | "red";

interface KpiBand {
  /** ≥ target = green */
  target: number;
  /** ≥ minimum = yellow, < minimum = red */
  minimum: number;
  /** 표시 단위 (보고서 출력용) */
  unit: "ratio" | "count" | "rate";
  label: string;
}

const KPI_BANDS: Record<string, KpiBand> = {
  d1_retention:        { target: 0.40, minimum: 0.25, unit: "ratio", label: "D1 retention" },
  d3_retention:        { target: 0.25, minimum: 0.15, unit: "ratio", label: "D3 retention" },
  lesson_complete_rate:{ target: 0.70, minimum: 0.50, unit: "ratio", label: "Lesson complete rate" },
  paywall_view_to_purchase: { target: 0.05, minimum: 0.02, unit: "ratio", label: "Paywall view→purchase" },
};

// ============================================================================
// Snapshot 형식 (scripts/baseline/run.ts 출력 + ADR-0007 §2 source 필드)
// ============================================================================

interface DailySnapshot {
  computed_at: string;
  source?: "staging_supabase" | "synthetic_seed_v1" | "dogfood_owner";
  seed?: string;
  is_dogfood?: boolean;
  summary: {
    d1_retention?: number;
    d3_retention?: number;
    lesson_complete_rate?: number;
    paywall_view_to_purchase?: number;
  };
}

// ============================================================================
// CLI
// ============================================================================

interface Args {
  days: number;
  metricsDir: string;
  outDir: string;
  strict: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const arg = (k: string, def: string) =>
    argv.find((a) => a.startsWith(`--${k}=`))?.slice(`--${k}=`.length) ?? def;
  return {
    days: Number(arg("days", "7")),
    metricsDir: arg("metrics-dir", "metrics/daily"),
    outDir: arg("out", "metrics/weekly"),
    strict: argv.includes("--strict"),
  };
}

// ============================================================================
// Logic
// ============================================================================

function tierOf(value: number | undefined, band: KpiBand): BandTier {
  if (value == null || !Number.isFinite(value)) return "red";
  if (value >= band.target) return "green";
  if (value >= band.minimum) return "yellow";
  return "red";
}

function median(arr: number[]): number {
  if (arr.length === 0) return NaN;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function loadRecent(metricsDir: string, days: number): DailySnapshot[] {
  if (!existsSync(metricsDir)) {
    console.error(`[check-thresholds] metrics dir not found: ${metricsDir}`);
    return [];
  }
  const files = readdirSync(metricsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .slice(-days);
  return files.map((f) => {
    const raw = readFileSync(join(metricsDir, f), "utf-8");
    return JSON.parse(raw) as DailySnapshot;
  });
}

function summarize(snapshots: DailySnapshot[]): {
  rows: Array<{ kpi: string; median: number; tier: BandTier }>;
  overallTier: BandTier;
} {
  const rows: Array<{ kpi: string; median: number; tier: BandTier }> = [];
  let worst: BandTier = "green";
  for (const [kpi, band] of Object.entries(KPI_BANDS)) {
    const values = snapshots
      .map((s) => s.summary[kpi as keyof DailySnapshot["summary"]])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const m = median(values);
    const tier = tierOf(m, band);
    rows.push({ kpi, median: m, tier });
    if (tier === "red") worst = "red";
    else if (tier === "yellow" && worst !== "red") worst = "yellow";
  }
  return { rows, overallTier: worst };
}

function formatValue(value: number, unit: KpiBand["unit"]): string {
  if (!Number.isFinite(value)) return "—";
  if (unit === "ratio" || unit === "rate") return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(2);
}

function tierEmoji(tier: BandTier): string {
  return tier === "green" ? "🟢" : tier === "yellow" ? "🟡" : "🔴";
}

function renderMarkdown(
  snapshots: DailySnapshot[],
  rows: ReturnType<typeof summarize>["rows"],
  overallTier: BandTier
): string {
  const dates = snapshots.map((s) => s.computed_at.slice(0, 10));
  const first = dates[0] ?? "—";
  const last = dates[dates.length - 1] ?? "—";
  const sourceTally = snapshots.reduce<Record<string, number>>((acc, s) => {
    const key = s.source ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const sourceLine = Object.entries(sourceTally)
    .map(([k, v]) => `${k} × ${v}`)
    .join(" / ");

  const lines: string[] = [];
  lines.push(`# Baseline Weekly Summary — ${first} ~ ${last}`);
  lines.push("");
  lines.push(`- **Overall**: ${tierEmoji(overallTier)} ${overallTier.toUpperCase()}`);
  lines.push(`- **Snapshots**: ${snapshots.length}`);
  lines.push(`- **Sources**: ${sourceLine || "—"}`);
  lines.push("");
  lines.push("| KPI | Median | Tier | Band (Target / Minimum) |");
  lines.push("|---|---:|:---:|---|");
  for (const row of rows) {
    const band = KPI_BANDS[row.kpi]!;
    const median = formatValue(row.median, band.unit);
    const target = formatValue(band.target, band.unit);
    const minimum = formatValue(band.minimum, band.unit);
    lines.push(`| ${band.label} | ${median} | ${tierEmoji(row.tier)} | ${target} / ${minimum} |`);
  }
  lines.push("");
  lines.push("> Threshold source: `docs/product/PRD.md §8.2` (D-013, commit 2026-05-12)");
  lines.push("> Storage policy: `docs/adr/ADR-0007-baseline-storage.md`");
  return lines.join("\n");
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const args = parseArgs();
  const snapshots = loadRecent(args.metricsDir, args.days);
  if (snapshots.length === 0) {
    console.error(`[check-thresholds] no snapshots found in ${args.metricsDir}`);
    process.exit(2);
  }

  const { rows, overallTier } = summarize(snapshots);
  const markdown = renderMarkdown(snapshots, rows, overallTier);

  const first = snapshots[0]?.computed_at.slice(0, 10) ?? "unknown";
  const last = snapshots[snapshots.length - 1]?.computed_at.slice(0, 10) ?? "unknown";
  const outPath = resolve(args.outDir, `${first}-to-${last}.md`);
  mkdirSync(resolve(args.outDir), { recursive: true });
  writeFileSync(outPath, markdown);

  console.log(markdown);
  console.log(`\n[check-thresholds] written: ${outPath}`);

  // Exit code: red=2, yellow=1 (strict면) or 0, green=0
  if (overallTier === "red") process.exit(2);
  if (overallTier === "yellow" && args.strict) process.exit(1);
  process.exit(0);
}

main();
