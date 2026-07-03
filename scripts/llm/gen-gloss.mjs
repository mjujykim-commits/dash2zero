#!/usr/bin/env node
/**
 * 로컬 LLM(Ollama)으로 영어 뜻(gloss_en) 대량 생성 — 토큰 0.
 *
 * 입력:  sources/image_mapping.json (korean/pos/hanja/hint 포함, 6,701단어)
 * 출력:  sources/gloss_out.json  { "<korean>": "<gloss_en>", ... }  (증분 저장, 재개 가능)
 *
 * 특징:
 *  - 배치 처리(기본 40) + think:false + format:json 로 속도/안정성 확보
 *  - 멱등/재개: 이미 있는 gloss는 skip. 중간에 꺼져도 재실행하면 이어서.
 *  - 배치 검증(길이/한글 매칭). 실패 배치는 반으로 쪼개 재시도. 최종 실패 단어는 남겨서 재실행 시 재시도.
 *
 * 사용: node scripts/llm/gen-gloss.mjs
 *   env: OLLAMA_URL(기본 http://localhost:11434), MODEL(기본 gemma4:latest), BATCH(기본 40)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const IN = path.join(ROOT, "sources", "image_mapping.json");
const OUT = path.join(ROOT, "sources", "gloss_out.json");

const OLLAMA = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.MODEL || "gemma4:latest";
const BATCH = parseInt(process.env.BATCH || "40", 10);
const REQ_TIMEOUT = 300000; // 5분/요청

const SYSTEM =
  "You are a Korean-English lexicographer. For each Korean word give a concise, search-friendly English gloss (the common everyday meaning). " +
  "Use pos/hanja/hint to disambiguate homonyms and pick the precise sense (e.g. 소화기→fire extinguisher NOT extinguisher; 플러그→power plug NOT plug; 계산기→calculator NOT abacus). " +
  "Nouns → a plain noun. Verbs → base form (e.g. run). Adjectives → adjective (e.g. cold). " +
  'Output STRICT JSON: {"items":[{"korean":"...","gloss_en":"..."}]} with the SAME order and SAME length as the input. gloss_en: lowercase, no article, 1-4 words.';

const words = JSON.parse(fs.readFileSync(IN, "utf8"));
let out = {};
if (fs.existsSync(OUT)) {
  try { out = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { out = {}; }
}
const todo = words.filter((w) => !out[w.korean]);
console.log(`전체 ${words.length} / 완료 ${Object.keys(out).length} / 남음 ${todo.length} (batch=${BATCH}, model=${MODEL})`);

function save() { fs.writeFileSync(OUT, JSON.stringify(out, null, 0)); }

async function callOllama(items) {
  const payload = {
    model: MODEL, stream: false, format: "json", think: false,
    options: { temperature: 0.2, num_ctx: 8192 },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(items.map((w) => ({ korean: w.korean, pos: w.pos, hanja: w.hanja, hint: w.hint }))) },
    ],
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQ_TIMEOUT);
  try {
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    const j = await r.json();
    const parsed = JSON.parse(j.message.content);
    return parsed.items || [];
  } finally {
    clearTimeout(timer);
  }
}

// 배치 처리: 성공 시 매칭해서 out에 기록, 반환은 처리된 수
async function processBatch(items, depth = 0) {
  if (!items.length) return 0;
  let res;
  try {
    res = await callOllama(items);
  } catch (e) {
    // 파싱/네트워크 실패 → 반으로 쪼개 재시도(1단어까지)
    if (items.length === 1 || depth > 4) { console.log(`  ✗ 실패(skip): ${items.map((w) => w.korean).join(",")} (${e.message})`); return 0; }
    const mid = Math.ceil(items.length / 2);
    return (await processBatch(items.slice(0, mid), depth + 1)) + (await processBatch(items.slice(mid), depth + 1));
  }
  // 한글 기준 매칭
  const byKo = new Map(res.filter((x) => x && x.korean && x.gloss_en).map((x) => [x.korean, String(x.gloss_en).trim()]));
  let n = 0;
  for (const w of items) {
    const g = byKo.get(w.korean);
    if (g) { out[w.korean] = g; n++; }
  }
  // 매칭 실패분(모델이 일부 누락/변형) → 재귀 재시도
  const missed = items.filter((w) => !out[w.korean]);
  if (missed.length && missed.length < items.length && depth <= 4) {
    n += await processBatch(missed, depth + 1);
  } else if (missed.length && missed.length === items.length && items.length > 1 && depth <= 4) {
    const mid = Math.ceil(items.length / 2);
    n += (await processBatch(items.slice(0, mid), depth + 1)) + (await processBatch(items.slice(mid), depth + 1));
  }
  return n;
}

async function main() {
  const t0 = Date.now();
  let done = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const n = await processBatch(batch);
    done += batch.length;
    save();
    const total = Object.keys(out).length;
    const rate = done / ((Date.now() - t0) / 1000);
    const eta = rate > 0 ? Math.round((todo.length - done) / rate / 60) : 0;
    console.log(`  ${total}/${words.length} (이번배치 +${n}/${batch.length}, ${rate.toFixed(1)} w/s, ETA ~${eta}분)`);
  }
  save();
  const filled = Object.keys(out).length;
  console.log(`\n✅ 완료 — gloss ${filled}/${words.length} (실패 ${words.length - filled})`);
  if (filled < words.length) console.log(`   남은 ${words.length - filled}개는 재실행 시 이어서 시도됩니다.`);
}

main().catch((e) => { console.error("❌", e); save(); process.exit(1); });
