#!/usr/bin/env node
/**
 * merge-gloss — examples_out.json(교정 gloss + 예문)을 앱 데이터에 병합.
 *
 *  1) 교정 gloss를 track-{topik,kiip}.json 의 각 단어 g 필드에 반영.
 *     - "UI 균형": 32자 이하는 원문 유지(의미 구분 괄호 보존),
 *       32자 초과는 설명 괄호를 제거해 라벨을 간결화. 그래도 길면 첫 뜻만.
 *  2) 앱용 예문 파일 track-examples.json { korean: {examples, sentence} } 생성
 *     (gen-examples 업로드분과 동일 형식 — 수동 업로드/검증용).
 *
 * 출력: sources/track-topik.json, sources/track-kiip.json (덮어쓰기),
 *       sources/track-examples.json (신규/덮어쓰기)
 * 업로드는 별도(자격증명 필요) — README 하단 명령 참고.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const S = (f) => path.join(ROOT, "sources", f);

const MAX = 32; // 이 길이 이하 gloss는 손대지 않음(의미 구분 괄호 보존)

/** UI 균형 정규화: 너무 긴 gloss만 설명 괄호 제거 → 간결한 라벨. */
function normalizeGloss(raw) {
  const s = String(raw).trim();
  if (s.length <= MAX) return s;
  // 1) 괄호(설명) 제거 후 공백/구두점 정리
  let t = s
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([;,])/g, "$1")
    .replace(/[;,]\s*$/g, "")
    .trim();
  if (t.length > 0 && t.length <= MAX) return t;
  // 2) 그래도 길면 첫 뜻(; → ,)만
  let first = (t || s).split(";")[0].trim();
  if (first.length > 0 && first.length <= MAX) return first;
  first = first.split(",")[0].trim();
  if (first.length > 0) return first;
  return t || s;
}

const ex = JSON.parse(fs.readFileSync(S("examples_out.json"), "utf8"));

// ── 1) 트랙 gloss 병합 ──
for (const tr of ["topik", "kiip"]) {
  const file = S(`track-${tr}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  let total = 0, changed = 0, trimmed = 0, max = 0;
  for (const lv of data.levels) {
    for (const w of lv.words) {
      total++;
      const src = ex[w.k] && ex[w.k].gloss_en;
      if (!src) { max = Math.max(max, w.g.length); continue; }
      const g = normalizeGloss(src);
      if (g.length < String(src).trim().length) trimmed++;
      if (g !== w.g) { w.g = g; changed++; }
      max = Math.max(max, g.length);
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 0));
  console.log(`[${tr}] 단어 ${total} / 변경 ${changed} / 괄호정리 ${trimmed} / 최대길이 ${max}자`);
}

// ── 2) 앱용 예문 파일 생성 ──
const app = {};
for (const [k, v] of Object.entries(ex)) app[k] = { examples: v.examples, sentence: v.sentence };
fs.writeFileSync(S("track-examples.json"), JSON.stringify(app, null, 0));
console.log(`[examples] track-examples.json 생성 — ${Object.keys(app).length}개`);
