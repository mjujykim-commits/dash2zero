/**
 * fixtures/seeded/words/*.yaml 파서 (의존성 0) — seed/TTS 스크립트 공용.
 *
 * 이 fixtures 포맷 전용: 최상위 `key: value` 스칼라 + `words:` 아래 단일 라인 flow map
 * `- { word_id: "..", korean: "..", romanization: "..", gloss: "..", example_ko: "..",
 *      example_en: "..", distractors_candidate: ["..",..] }`
 */
import fs from "node:fs";
import path from "node:path";

function splitTopLevel(s) {
  const out = [];
  let depth = 0, inStr = false, cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === '"') inStr = false; cur += c; }
    else if (c === '"') { inStr = true; cur += c; }
    else if (c === "[" || c === "{") { depth++; cur += c; }
    else if (c === "]" || c === "}") { depth--; cur += c; }
    else if (c === "," && depth === 0) { out.push(cur); cur = ""; }
    else cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function unquote(v) {
  v = v.trim();
  return v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v;
}
function parseArray(v) {
  v = v.trim();
  if (!v.startsWith("[")) return [];
  return splitTopLevel(v.slice(1, v.lastIndexOf("]"))).map(unquote).filter((x) => x.length > 0);
}
function parseFlowMap(line) {
  const open = line.indexOf("{"), close = line.lastIndexOf("}");
  if (open < 0 || close < 0) return null;
  const obj = {};
  for (const pair of splitTopLevel(line.slice(open + 1, close))) {
    const ci = pair.indexOf(":");
    if (ci < 0) continue;
    const key = pair.slice(0, ci).trim();
    const raw = pair.slice(ci + 1).trim();
    obj[key] = raw.startsWith("[") ? parseArray(raw) : unquote(raw);
  }
  return obj;
}
function parseTopScalar(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return m ? unquote(m[1].split("#")[0].trim()) : null;
}

/** starter→starter, core/monthly/premium→premium (pack_tier_enum 2종). */
export const tierMap = (t) => (t === "starter" ? "starter" : "premium");

/**
 * @returns {{packs: Array, koreanToWordId: Map<string,string>, totalWords: number}}
 *   packs[i] = { pack_id, name, tierRaw, tier, monthly_release_at, words: [...] }
 */
export function parseAllPacks(fixDir) {
  const files = fs.readdirSync(fixDir).filter((f) => f.endsWith(".yaml"));
  const packs = [];
  const koreanToWordId = new Map();
  for (const f of files) {
    const text = fs.readFileSync(path.join(fixDir, f), "utf8");
    const tierRaw = parseTopScalar(text, "tier") || "premium";
    const pack = {
      pack_id: parseTopScalar(text, "pack_id"),
      name: parseTopScalar(text, "pack_name") || parseTopScalar(text, "pack_id"),
      tierRaw,
      tier: tierMap(tierRaw),
      monthly_release_at: parseTopScalar(text, "release_at"),
      words: [],
    };
    for (const line of text.split(/\r?\n/)) {
      if (!/^\s*-\s*\{/.test(line) || !line.includes("word_id:")) continue;
      const w = parseFlowMap(line);
      if (!w || !w.word_id) continue;
      pack.words.push(w);
      if (w.korean && !koreanToWordId.has(w.korean)) koreanToWordId.set(w.korean, w.word_id);
    }
    if (pack.pack_id && pack.words.length) packs.push(pack);
  }
  const totalWords = packs.reduce((n, p) => n + p.words.length, 0);
  return { packs, koreanToWordId, totalWords };
}
