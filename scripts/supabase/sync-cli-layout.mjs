#!/usr/bin/env node
/**
 * Supabase CLI 레이아웃 동기화 (의존성 0)
 *
 * 문제: canonical 코드가 infra/supabase/migrations/ + apps/api/edge-functions/ 에 있는데
 *       Supabase CLI는 supabase/migrations/ + supabase/functions/ 를 기대한다.
 *       그래서 `supabase db push` / `functions deploy`가 그대로는 실패한다.
 *
 * 해결: canonical은 그대로 두고, CLI가 읽는 supabase/ 레이아웃을 생성/갱신한다(재실행 가능).
 *   - supabase/migrations/<14digit>_*.sql   ← infra/supabase/migrations/000N_*.sql (타임스탬프 리네임)
 *   - supabase/functions/<name>/            ← apps/api/edge-functions/<name>/ (복사)
 *   - supabase/config.toml                  ← 없으면 최소본 생성 + [functions] verify_jwt 보정
 *
 * 사용: node scripts/supabase/sync-cli-layout.mjs
 *
 * 주의: supabase/ 는 "배포 스테이징"이다. 함수/스키마 수정은 canonical(infra/·apps/api/)에서 하고
 *       본 스크립트를 다시 돌려 동기화한다. supabase/ 를 직접 수정하지 말 것.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const MIG_SRC = path.join(ROOT, "infra", "supabase", "migrations");
const SEED_SRC = path.join(ROOT, "infra", "supabase", "seed");
const FN_SRC = path.join(ROOT, "apps", "api", "edge-functions");
const SB = path.join(ROOT, "supabase");

// anon(비인증) 호출이 필요한 함수 — verify_jwt=false
const ANON_FUNCTIONS = new Set(["content-manifest", "audio-signed-url", "revenuecat-webhook", "cron-hard-delete"]);

fs.mkdirSync(path.join(SB, "migrations"), { recursive: true });
fs.mkdirSync(path.join(SB, "functions"), { recursive: true });

// 1) 마이그레이션 — 000N_x.sql → 14자리 타임스탬프_x.sql (순서 보존, 고유)
//    기존 supabase/migrations 비우고 재생성 (멱등)
for (const old of fs.readdirSync(path.join(SB, "migrations")).filter((f) => f.endsWith(".sql"))) {
  fs.rmSync(path.join(SB, "migrations", old));
}
// 스키마(infra/.../migrations) + 콘텐츠 seed(infra/.../seed)를 시퀀스 순서대로 통합.
// seed(0010)는 schema(0001~0004)보다 시퀀스가 커서 자연히 뒤에 적용됨. seed는 멱등.
const sources = [
  ...fs.readdirSync(MIG_SRC).filter((f) => f.endsWith(".sql")).map((f) => [MIG_SRC, f]),
  ...(fs.existsSync(SEED_SRC) ? fs.readdirSync(SEED_SRC).filter((f) => f.endsWith(".sql")).map((f) => [SEED_SRC, f]) : []),
];
let migCount = 0;
for (const [dir, f] of sources) {
  const m = f.match(/^(\d+)_(.+)\.sql$/);
  const seq = m ? parseInt(m[1], 10) : 1;          // "0001" → 1, "0010" → 10
  const name = m ? m[2] : f.replace(/\.sql$/, "");
  const ts = "2026010100" + String(seq).padStart(4, "0"); // 20260101000001 ... 0010 (고유·순서보존)
  fs.copyFileSync(path.join(dir, f), path.join(SB, "migrations", `${ts}_${name}.sql`));
  migCount++;
}

// 2) 함수 복사 (_shared 포함, 재귀)
const fnDir = fs.readdirSync(FN_SRC, { withFileTypes: true }).filter((d) => d.isDirectory());
const functionNames = [];
for (const d of fnDir) {
  const dest = path.join(SB, "functions", d.name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(path.join(FN_SRC, d.name), dest, { recursive: true });
  if (d.name !== "_shared") functionNames.push(d.name);
}

// 3) config.toml — 없으면 최소본 생성, 있으면 [functions] 섹션만 보정
const cfgPath = path.join(SB, "config.toml");
let cfg = fs.existsSync(cfgPath) ? fs.readFileSync(cfgPath, "utf8") : `project_id = "TBD-PROJECT-REF"\n`;
// 기존 자동생성 헤더 + [functions.*] 블록 제거 후 재생성 (멱등 — 재실행 누적 방지)
cfg = cfg
  .replace(/\n*# === Edge Functions \(sync-cli-layout\.mjs 자동 생성\) ===\n/g, "")
  .replace(/\n\[functions\.[^\]]+\][\s\S]*?(?=\n\[|$)/g, "")
  .trimEnd() + "\n";
let fnCfg = "\n# === Edge Functions (sync-cli-layout.mjs 자동 생성) ===\n";
for (const n of functionNames.sort()) {
  fnCfg += `\n[functions.${n}]\nverify_jwt = ${ANON_FUNCTIONS.has(n) ? "false" : "true"}\n`;
}
fs.writeFileSync(cfgPath, cfg + fnCfg, "utf8");

console.log("✅ supabase/ 레이아웃 동기화 완료");
console.log(`   migrations: ${migCount}개 (스키마+seed) → supabase/migrations/`);
console.log(`   functions : ${functionNames.length}개 → supabase/functions/ (+ _shared)`);
console.log(`   anon(verify_jwt=false): ${functionNames.filter((n) => ANON_FUNCTIONS.has(n)).join(", ")}`);
console.log(`   config.toml: ${fs.existsSync(cfgPath) ? "보정됨" : "생성됨"} (project_id는 supabase link 시 갱신)`);
