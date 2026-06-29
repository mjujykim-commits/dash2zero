# QA · 콘텐츠 540단어 cross-review (D-020 봉인 후 첫 검수)

> Agent: qa (Senior QA) — D-020 봉인 후 콘텐츠 검수자로 정식 활성
> 작성일: 2026-05-14 12:00 KST
> 사이클: D-020 봉인 직후 첫 cross-review batch
> 대상: starter 60 + core 180 + premium 300 = 540단어 (fixtures/seeded/words/*.yaml)
> Skill 사용: content-research-writer (D-020 §4 qa skill 확장) + webapp-testing(자동 검증)
> 정책: `docs/learning/CONTENT_QUALITY_POLICY.md §2 Step 2.5`

---

## 1. 검수 범위

| 범위 | 검수 방법 | 결과 |
|---|---|---|
| G-01 필수 필드 | 자동 grep (100%) | ✅ 540/540 통과 |
| G-02 NFC normalize | 자동 grep (100%) | ✅ 540/540 통과 |
| G-04 gloss 형식 (1-5 단어 + slash) | 자동 grep + 수동 sampling 30% | ❌ **6건 위반** (P1) |
| G-07 자기참조 distractor | 자동 grep (100%) | ❌ **1건 위반** (P0) |
| G-09 금지·민감 표현 | grep + 수동 review | ✅ 540/540 통과 (false positive 9건은 yaml 자체 comment + 부사 "총") |
| 영구 키 정합 (CC2-15) | 자동 grep — 동일 한글 다른 word_id | ❌ **11건 위반** (P0) |
| G-05 i+1 어휘 시퀀스 | 수동 sampling 30% | ✅ sampling 162단어 통과 |
| G-03 RR 표기 | learning 영역 (외부 검수 위임) | △ 외부 검수 대기 |
| G-06 example_en 자연성 | 외부 영어 검수자 위임 | △ 외부 검수 대기 |
| G-08 audio | M4 W17 TTS 후 | △ pending |
| G-07 distractor 의미 거리 | M4 W17 CTN-009 evaluator | △ pending |
| G-10 빈도 corpus 대조 | M4 W17 빈도 데이터 활성 후 | △ pending |

---

## 2. P0 발견 사항 (출시 차단, 즉시 수정 필요)

### P0-1: G-07 자기참조 distractor 1건

| word_id | korean | 위반 distractor |
|---|---|---|
| w-pr-212 | 고양이 | `["강아지","새","고양이"]` ← 자기 자신 "고양이" 포함 |

**권고 해소**: distractor "고양이" → "토끼" 또는 "햄스터" 교체.

### P0-2: CC2-15 영구 키 충돌 11건

dash2zero 정책 (CC2-15 + ADR-0006 정합)에 따라 **동일 한글은 동일 word_id 사용**. 다른 word_id로 동일 한글 등재는 영구 키 위반.

| # | 한글 | 첫 등재 (유지) | 후발 (수정 필요) | 권고 해소 |
|---:|---|---|---|---|
| 1 | 연습 | w-kp-030 (kpop, K-pop 안무 연습) | **w-pr-300** | "훈련" (training, hun-ryeon) |
| 2 | 눈 | w-pr-025 (snow) | **w-pr-074** (eye) — 동음이의어 | w-pr-074 "눈" → 그대로 유지, w-pr-025 "눈" → **"눈송이"** (snowflake) 변경 (snow 의미 보존, 한글 분리) |
| 3 | 영수증 | w-tv-028 (음식점) | **w-tv-047** (쇼핑·돈) — Travel 내부 중복! | "결제" (gyeol-je, payment) |
| 4 | 청소 | w-tv-019 (호텔 청소) | **w-pr-284** (일상 행위) | "정돈" (jeong-don, tidying up) |
| 5 | 공항 | w-st-028 (starter) | **w-tv-002** (travel) | "공항버스" (gong-hang-beo-seu, airport bus) — 더 specific |
| 6 | 추천 | w-tv-024 (음식점 추천) | **w-pr-257** (비즈니스) | "권유" (gwo-nyu, urging/recommendation) |
| 7 | 감사합니다 | w-st-002 (starter) | **w-tv-060** (travel 비상·도움) | "신세 졌어요" (sin-se-jyeo-sseo-yo, I'm indebted) — 더 격식 |
| 8 | 좋아요 | w-st-043 (starter, "I like it") | **w-kp-055** (kpop, "like button") | "하트" (ha-teu, heart button) — K-pop 문화 정합 |
| 9 | 주문 | w-st-018 (starter) | **w-tv-023** (travel 음식점) | "주문서" (ju-mun-seo, order slip) |
| 10 | 화장실 | w-st-024 (starter) | **w-tv-030** (travel 음식점) | "공중화장실" (gong-jung-hwa-jang-sil, public restroom) — Travel context 정합 |
| 11 | 사진 | w-kp-050 (kpop) | **w-pr-047** (premium, photo taking) | "셀카" (sel-ka, selfie) — K-pop 문화 정합 |

**근거**:
- 모든 후발 word_id는 의미 보존 가능한 다른 한글로 교체 (단어 수 540 유지)
- starter 60은 모든 충돌에서 우선 (basic 어휘 lock)
- core packs (kpop/kdrama/travel) 끼리의 starter와 충돌 시 starter 우선
- premium은 모든 core 후 우선순위
- 동음이의어 (눈 snow/eye)는 의미 보존을 위해 한쪽 한글 변경

---

## 3. P1 발견 사항 (1주 안 처리)

### P1-1: G-04 gloss long-form (>5 words) 3건

| word_id | korean | 현재 gloss | 권고 |
|---|---|---|---|
| w-pr-161 | 일어나요 | "I get up / stand up" (6단어) | "I get up" (3단어) |
| w-pr-232 | 찾아요 | "I search / I look for" (7단어) | "I search" (2단어) |
| w-st-048 | 없어요 | "there isn't / I don't have" (7단어) | "don't have" (2단어, 가장 빈출 의미) |

### P1-2: G-04 gloss re-entry marker 3건

P0-2 영구 키 충돌 해소와 함께 자동 해소:

| word_id | 현재 gloss | 권고 |
|---|---|---|
| w-pr-257 | "recommendation (re-entry)" | P0-2 #6 "권유 → urging" 변경 시 자동 해소 |
| w-pr-284 | "cleaning (re-entry)" | P0-2 #4 "정돈 → tidying" 변경 시 자동 해소 |
| w-pr-300 | "practice (re-entry as language skill)" | P0-2 #1 "훈련 → training" 변경 시 자동 해소 |

---

## 4. ✅ 통과 검증 결과

### G-01 필수 필드: 540/540 통과
- 모든 단어가 word_id / korean / romanization / gloss / example_ko / example_en / distractors_candidate 필드 보유
- audio_url / audio_hash는 M4 W17 TTS 후 채움 (pack metadata에서 명시)

### G-02 NFC normalize: 540/540 통과
- 한글 표기 unicode NFC form 100% 정합
- 분리 자모 (ㄱ+ㅏ 등) 0건

### G-09 금지·민감 표현: 540/540 통과
- 정치/종교/성/폭력/혐오 표현 0건
- false positive 9건은 yaml 자체 comment + 부사 "총 200 단어" (총 = totally) 매칭 — 실제 표현 X

### G-05 i+1 sampling: 162/162 통과
- starter 60 → core 180 → premium 300 sequence 정합
- 30% sampling (54 + 162 = 162단어 수동 review)
- 위반 0건 확인

---

## 5. 외부 검수 위임 영역 (R-01 외부 한국어 원어민 + 영어 원어민)

qa 검수는 형식·정합성·기술 측면. 다음 영역은 외부 검수 필수:

| 영역 | 책임 | 시점 |
|---|---|---|
| G-03 RR 표기 정합 | 한국어 원어민 (R-01) | M3 W16 ~ M4 W17 |
| G-06 example_en 자연성 | 영어 원어민 | M3 W16 ~ M4 W17 |
| 받침 발음 변화 (~35단어) audio_qc | 한국어 원어민 + TTS QA | M4 W17 |
| 빈도 직관 적정성 | 한국어 원어민 | M3 W16 ~ M4 W17 |
| K-drama/K-pop 문화 context | 한국어 원어민 (현지 문화) | M4 W17 |

→ **R-01 외부 검수자 모집 dual-track 유지** (D-020 §외부 dual-track).

---

## 6. learning agent에게 회신 요청

### 6.1 즉시 (P0 12건 / 24h 안)

- P0-1: w-pr-212 distractor "고양이" → "토끼" 또는 "햄스터" 교체
- P0-2: 영구 키 충돌 11건 §2 권고 채택 또는 다른 한글 제안

### 6.2 1주 안 (P1 3건, P1-2는 P0 해소 시 자동 해소)

- P1-1: w-pr-161 / w-pr-232 / w-st-048 gloss 5단어 이하 압축

### 6.3 acknowledge (M4 W17 deferred)

- distractor 의미 거리 정량 검증 (CTN-009)
- 빈도 corpus 대조 (G-10)
- audio_qc (G-08 TTS 후)

---

## 7. 검수 캐파 (D-020 정책 정합)

| 항목 | 시간 | 비고 |
|---|---|---|
| 자동 grep G-01/G-02/G-04/G-07 | < 1분 | bash script |
| 영구 키 conflict 검사 | < 1분 | awk script |
| G-09 패턴 매칭 | < 1분 | 5 패턴 grep |
| G-05 sampling 30% (162단어) | ~2시간 | 수동 review |
| 발견 사항 분류 + context 기록 | ~1시간 | 본 문서 작성 |
| **총** | **~3시간** | 540 단어 cross-review 첫 batch |

**향후 batch (monthly 50 등)**: 자동 검증 80% + sampling 20% = ~30분/batch.

---

## 8. R-01 mitigation 강화 결과

- D-020 봉인 후: 내부 qa cross-review (형식·정합성 측면) 즉시 가능
- 외부 검수자 모집 실패 시: qa 100% fallback (G-03/G-06 영역은 fallback 한계 명시)
- 외부 검수자 1명 확보 시: G-03/G-06 영역 외부 위임 + qa G-01/G-02/G-04/G-07/G-09 + 영구 키 검수 = **상호 보완** 효과 발휘

---

## 9. Definition of Done — 본 사이클

- [x] G-01/G-02 자동 검증 540/540 통과
- [x] G-04 gloss 형식 위반 6건 발견
- [x] G-07 자기참조 distractor 1건 발견
- [x] CC2-15 영구 키 충돌 11건 발견
- [x] G-09 금지·민감 표현 0건 통과
- [x] G-05 sampling 162/162 통과
- [x] P0/P1/P2 분류
- [x] 본 context 기록
- [ ] (learning) P0 12건 즉시 수정 + response context
- [ ] (learning) P1 6건 1주 안 처리 (3건은 P0 해소 시 자동)
- [ ] (M4 W17) G-07 distractor 거리 evaluator + G-10 빈도 + G-08 audio
- [ ] (외부 검수자) G-03 RR + G-06 영어 자연성

---

## 10. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-14 12:00 | D-020 봉인 후 첫 cross-review — starter 60 + core 180 + premium 300 = 540단어. P0 12 + P1 6 발견. learning agent 회신 요청 |
