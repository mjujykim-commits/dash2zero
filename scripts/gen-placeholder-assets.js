#!/usr/bin/env node
/**
 * dash2zero placeholder 에셋 생성기 (의존성 0 — Node 내장 zlib만 사용)
 *
 * 목적: app.json이 참조하는 icon/splash/adaptive-icon PNG가 repo에 없어
 *       EAS 빌드가 즉시 실패하는 블로커(#1) 해소. TestFlight 내부 테스트용
 *       임시 에셋이며, 정식 디자인 에셋 확보 시 동일 파일명으로 교체한다.
 *
 * 브랜드: K-pop Bold (D-022) — purple → pink → orange 세로 그라데이션 + 네온.
 *
 * 산출물 (apps/mobile/assets/):
 *   - icon.png            1024x1024  (iOS/Android 앱 아이콘, 알파 없음)
 *   - adaptive-icon.png   1024x1024  (Android foreground, 중앙 안전영역 고려)
 *   - splash.png          1284x2778  (스플래시, 배경 #FAFAF9 + 중앙 그라데이션 카드)
 *   - favicon.png         48x48      (expo web)
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'apps', 'mobile', 'assets');
fs.mkdirSync(OUT, { recursive: true });

// ---- PNG 인코더 (RGB, 8-bit, 알파 없음) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgbFn) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = rgbFn(x, y, width, height);
      raw[p++] = r; raw[p++] = g; raw[p++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type 2 = truecolor RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- 컬러 헬퍼 ----
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

// 브랜드 그라데이션 정지점 (purple → pink → orange)
const G0 = hex('#7C3AED'); // purple
const G1 = hex('#EC4899'); // pink
const G2 = hex('#FB923C'); // orange
function brandGradient(t) {
  return t < 0.5 ? mix(G0, G1, t * 2) : mix(G1, G2, (t - 0.5) * 2);
}

// ---- 1) icon.png 1024x1024 ----
fs.writeFileSync(
  path.join(OUT, 'icon.png'),
  encodePNG(1024, 1024, (x, y, w, h) => brandGradient((x + y) / (w + h)))
);

// ---- 2) adaptive-icon.png 1024x1024 (Android foreground, 가장자리 33% 안전영역) ----
fs.writeFileSync(
  path.join(OUT, 'adaptive-icon.png'),
  encodePNG(1024, 1024, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const d = Math.hypot(x - cx, y - cy) / (w / 2);
    if (d > 0.62) return hex('#0B0B0F'); // dark-first 배경 (안전영역 밖)
    return brandGradient((x + y) / (w + h));
  })
);

// ---- 3) splash.png 1284x2778 (배경 #FAFAF9 + 중앙 그라데이션 라운드 카드 느낌) ----
const SPLASH_BG = hex('#FAFAF9');
fs.writeFileSync(
  path.join(OUT, 'splash.png'),
  encodePNG(1284, 2778, (x, y, w, h) => {
    const cx = w / 2, cy = h / 2;
    const halfW = w * 0.28, halfH = halfW; // 정사각 카드
    if (Math.abs(x - cx) < halfW && Math.abs(y - cy) < halfH) {
      return brandGradient((x - (cx - halfW)) / (2 * halfW));
    }
    return SPLASH_BG;
  })
);

// ---- 4) favicon.png 48x48 ----
fs.writeFileSync(
  path.join(OUT, 'favicon.png'),
  encodePNG(48, 48, (x, y, w, h) => brandGradient((x + y) / (w + h)))
);

const files = fs.readdirSync(OUT);
console.log('생성 완료 →', OUT);
for (const f of files) {
  const s = fs.statSync(path.join(OUT, f));
  console.log(`  ${f.padEnd(22)} ${(s.size / 1024).toFixed(1)} KB`);
}
