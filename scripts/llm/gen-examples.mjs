#!/usr/bin/env node
/**
 * 로컬 LLM(Ollama)으로 단어별 gloss 교정 + 예문/예시어 생성 — Study 학습 보조.
 *
 * 특히 추상어(차=next 등)는 단어만으론 이해 불가 → 예시 collocation + 예문장 제공.
 * 동시에 gloss 오류(감사→thanksgiving)를 hanja 기반으로 교정.
 *
 * 입력:  sources/image_mapping.json (korean/pos/hanja + topik/kiip 레벨), sources/gloss_out.json (현재 gloss)
 * 출력:  sources/examples_out.json { korean: {gloss_en, examples:[{ko,en}], sentence:{ko,en}} } (증분/재개)
 *        + (env에 SUPABASE 있으면) images/track-examples.json 로 주기적 업로드 → 앱 실시간 반영
 *
 * 처리 순서: 낮은 레벨(초급/1단계)부터 → Study에 먼저 반영.
 * env: OLLAMA_URL(기본 localhost:11434), MODEL(기본 gemma4:latest), BATCH(기본 12)
 *      (선택) SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY → 진행분 자동 업로드
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const IN = path.join(ROOT, "sources", "image_mapping.json");
const GLOSS = path.join(ROOT, "sources", "gloss_out.json");
const OUT = path.join(ROOT, "sources", "examples_out.json");

const OLLAMA = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.MODEL || "gemma4:latest";
const BATCH = parseInt(process.env.BATCH || "12", 10);
const REQ_TIMEOUT = 300000;
const SB_URL = process.env.SUPABASE_URL, SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SYSTEM =
  "You are a Korean-English lexicographer and language teacher. For each Korean word output JSON: " +
  "gloss_en (correct concise English meaning; use hanja to disambiguate and FIX wrong glosses), " +
  "examples (2 common words/collocations that USE this word, each {ko,en}), " +
  "sentence (one natural example sentence {ko,en}). " +
  'Output STRICT JSON {"items":[{"korean":"..","gloss_en":"..","examples":[{"ko":"..","en":".."}],"sentence":{"ko":"..","en":".."}}]} same order/length.';

const words = JSON.parse(fs.readFileSync(IN, "utf8"));
const gloss = fs.existsSync(GLOSS) ? JSON.parse(fs.readFileSync(GLOSS, "utf8")) : {};
// 레벨 우선순위(낮을수록 먼저): A/1 → C/4
const rank = (w) => {
  const t = { A: 1, B: 3, C: 5 }[w.topik_level] ?? 9;
  const k = w.kiip_level ? Number(w.kiip_level) : 9;
  return Math.min(t, k);
};
const ordered = [...words].sort((a, b) => rank(a) - rank(b));

let out = {};
if (fs.existsSync(OUT)) { try { out = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { out = {}; } }
const todo = ordered.filter((w) => !out[w.korean]);
console.log(`전체 ${words.length} / 완료 ${Object.keys(out).length} / 남음 ${todo.length} (batch=${BATCH})`);

function save() { fs.writeFileSync(OUT, JSON.stringify(out, null, 0)); }
async function uploadLive() {
  if (!SB_URL || !SB_KEY) return;
  // 앱용 축약본: korean -> {examples, sentence} (gloss는 별도 관리)
  const app = {};
  for (const [k, v] of Object.entries(out)) app[k] = { examples: v.examples, sentence: v.sentence };
  try {
    await fetch(`${SB_URL}/storage/v1/object/images/track-examples.json`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", "cache-control": "no-cache", "x-upsert": "true" },
      body: JSON.stringify(app),
    });
  } catch { /* 무시 */ }
}

async function callOllama(items) {
  const payload = {
    model: MODEL, stream: false, format: "json", think: false, options: { temperature: 0.3, num_ctx: 8192 },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(items.map((w) => ({ korean: w.korean, pos: w.pos, hanja: w.hanja, current_gloss: gloss[w.korean] || "" }))) },
    ],
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQ_TIMEOUT);
  try {
    const r = await fetch(`${OLLAMA}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    return (JSON.parse((await r.json()).message.content).items) || [];
  } finally { clearTimeout(timer); }
}

async function processBatch(items, depth = 0) {
  if (!items.length) return 0;
  let res;
  try { res = await callOllama(items); }
  catch (e) {
    if (items.length === 1 || depth > 3) { console.log(`  ✗ skip: ${items.map((w) => w.korean).join(",")} (${e.message})`); return 0; }
    const mid = Math.ceil(items.length / 2);
    return (await processBatch(items.slice(0, mid), depth + 1)) + (await processBatch(items.slice(mid), depth + 1));
  }
  const byKo = new Map(res.filter((x) => x && x.korean).map((x) => [x.korean, x]));
  let n = 0;
  for (const w of items) {
    const x = byKo.get(w.korean);
    if (x && x.gloss_en) { out[w.korean] = { gloss_en: x.gloss_en, examples: x.examples || [], sentence: x.sentence || null }; n++; }
  }
  return n;
}

async function main() {
  const t0 = Date.now();
  let done = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    await processBatch(batch);
    done += batch.length;
    save();
    if (done % (BATCH * 4) < BATCH) await uploadLive();
    const total = Object.keys(out).length;
    const rate = done / ((Date.now() - t0) / 1000);
    const eta = rate > 0 ? Math.round((todo.length - done) / rate / 60) : 0;
    console.log(`  ${total}/${words.length} (${rate.toFixed(2)} w/s, ETA ~${eta}분)`);
  }
  save(); await uploadLive();
  console.log(`\n✅ 완료 — ${Object.keys(out).length}/${words.length}`);
}
main().catch((e) => { console.error("❌", e); save(); process.exit(1); });
