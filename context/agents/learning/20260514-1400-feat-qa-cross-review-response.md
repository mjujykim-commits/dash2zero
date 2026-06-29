# Learning · QA cross-review 발견 사항 응답 (P0 12건 + P1 3건 즉시 수정)

> Agent: learning (Specialist) — orchestrator D-020 cross-review 응답 절차
> 작성일: 2026-05-14 14:00 KST
> 사이클: D-020 봉인 후 qa cross-review 직후 즉시 response
> 선행: `context/agents/qa/20260514-1200-feat-content-cross-review.md`

---

## 1. QA 발견 사항 수신 및 처리 결과

QA agent가 발견한 P0 12건 + P1 6건 (P1-2 3건은 P0 해소 시 자동) 모두 처리 완료. 자동 재검증 통과.

| 분류 | QA 발견 | learning 처리 | 자동 재검증 |
|---|---|---|---|
| **P0** | 12건 | 12건 즉시 수정 | ✅ 0건 잔존 |
| P1-1 (gloss long-form) | 3건 | 3건 압축 | ✅ 0건 잔존 |
| P1-2 (gloss re-entry) | 3건 | P0 한글 교체로 자동 해소 | ✅ 0건 잔존 |
| P2 (M4 W17 deferred) | 3 영역 | acknowledge | M4 W17 진행 예정 |

---

## 2. P0 처리 결과 12건

### P0-1: G-07 자기참조 distractor (1건)

| word_id | korean | Before | After |
|---|---|---|---|
| w-pr-212 | 고양이 | `["강아지","새","고양이"]` | `["강아지","새","토끼"]` |

### P0-2: CC2-15 영구 키 충돌 해소 (11건)

| # | 한글 | word_id 처리 | 변경 결과 |
|---:|---|---|---|
| 1 | 연습 | w-pr-300 → 변경 | korean: **훈련** (training), RR: hun-ryeon |
| 2 | 눈 | w-pr-025 → 변경 (snow side) | korean: **눈송이** (snowflake), RR: nun-song-i. w-pr-074 "눈" (eye)는 유지 |
| 3 | 영수증 | w-tv-047 → 변경 | korean: **결제** (payment), RR: gyeol-je |
| 4 | 청소 | w-pr-284 → 변경 | korean: **정돈** (tidying up), RR: jeong-don |
| 5 | 공항 | w-tv-002 → 변경 | korean: **공항버스** (airport bus), RR: gong-hang-beo-seu |
| 6 | 추천 | w-pr-257 → 변경 | korean: **권유** (urging/recommendation), RR: gwo-nyu |
| 7 | 감사합니다 | w-tv-060 → 변경 | korean: **신세 졌어요** (I'm indebted), RR: sin-se-jyeo-sseo-yo |
| 8 | 좋아요 | w-kp-055 → 변경 | korean: **하트** (heart button), RR: ha-teu. K-pop 문화 정합 더 강함 |
| 9 | 주문 | w-tv-023 → 변경 | korean: **주문서** (order slip), RR: ju-mun-seo |
| 10 | 화장실 | w-tv-030 → 변경 | korean: **공중화장실** (public restroom), RR: gong-jung-hwa-jang-sil. Travel context 정합 |
| 11 | 사진 | w-pr-047 → 변경 | korean: **셀카** (selfie), RR: sel-ka. premium 카테고리 (활동·취미) 정합 |

**의미 보존 확인**:
- 모든 변경이 카테고리 의미 유지 (snow 카테고리 → snowflake / airport 카테고리 → airport bus / cleaning 카테고리 → tidying)
- 단어 수 540 유지 (변경만, 추가/삭제 없음)
- 일부 distractors_candidate도 자동 변경 (예: w-kp-054 "댓글"의 distractors "좋아요" → "하트")

---

## 3. P1 처리 결과 3건

### P1-1: G-04 gloss long-form (>5 words)

| word_id | Before | After |
|---|---|---|
| w-pr-161 | "I get up / stand up" (6단어) | "I get up" (3단어) |
| w-pr-232 | "I search / I look for" (7단어) | "I search" (2단어) |
| w-st-048 | "there isn't / I don't have" (7단어) | "don't have" (2단어) |

### P1-2: G-04 re-entry marker (3건)

P0-2 한글 교체로 자동 해소:
- w-pr-257 "recommendation (re-entry)" → "권유 → urging / recommendation" 변경 시 re-entry marker 제거
- w-pr-284 "cleaning (re-entry)" → "정돈 → tidying up" 변경 시 re-entry marker 제거
- w-pr-300 "practice (re-entry as language skill)" → "훈련 → training" 변경 시 re-entry marker 제거

---

## 4. 자동 재검증 결과 (QA cross-review 후 learning self-verify)

```bash
=== G-07 self-reference ===
✅ 0 violations (1 → 0)

=== CC2-15 permanent key conflicts ===
✅ 0 conflicts (11 → 0)

=== G-04 gloss form ===
✅ 0 violations (>5 words: 3 → 0, re-entry marker: 3 → 0)
```

---

## 5. P2 acknowledge (M4 W17 deferred)

| P2 항목 | 처리 시점 | 책임 |
|---|---|---|
| G-07 distractor 의미 거리 (cosine 0.30-0.70) | M4 W17 CTN-009 evaluator | backend + content |
| G-10 빈도 corpus 대조 | M4 W17 frequency corpus 활성 | learning + analytics |
| G-08 audio (received 변화 ~35 단어 qc) | M4 W17 TTS batch | content + devops |

---

## 6. QA 검수 가치 평가 (D-020 정책 효과)

| 영역 | QA 발견 (없었다면 발화 시점) | 영향 |
|---|---|---|
| 자기참조 distractor (w-pr-212) | M5 베타 사용자 학습 시 "고양이 답이 4개 중 2개" UX 혼란 | medium → resolved |
| 영구 키 충돌 11건 | M5 베타 사용자 SRS state 갱신 시 word_id ambiguity → SRS state 오염 → 환불 risk | **high → resolved** |
| gloss long-form 3건 | A0/A1 영어권 학습자 단어 카드 ellipsis 발생 → UX 가독성 저하 | medium → resolved |

**총 가치**: D-020 봉인 후 즉시 첫 batch에서 12 P0 + 6 P1 발견·해소. **외부 검수자 모집(R-01) 전 단계에서 기술·정합성 위반 100% 해소**. R-01 검수자는 자연성·문화 측면에 집중 가능.

---

## 7. 다음 사이클 권고

### 즉시 가능
- learning agent: QA 발견 사항 acknowledge 완료, 추가 batch (Monthly Pack 50 등) 작성 시 G-07 자기참조 검사 + CC2-15 영구 키 사전 검사 강제

### M4 W17 작업 큐 추가
- `scripts/eval/content.ts`에 G-07/CC2-15 자동 검증 함수 추가 (CTN-009 fixture 확장)
- 빈도 corpus 활성화 + G-10 자동 검증
- TTS audio batch 생성 + received 변화 단어 qc

### R-01 외부 검수자
- 내부 qa 검수가 형식·정합성 100% 통과시켰으므로 외부 검수자는 G-03 RR + G-06 영어 자연성 + 문화 context 집중 (~1.5시간/60 단어 작업)

---

## 8. Definition of Done — 본 사이클

- [x] QA 발견 P0 12건 즉시 수정
- [x] QA 발견 P1 3건 1주 안 → 즉시 처리
- [x] QA 발견 P1-2 3건 P0 해소로 자동 해소
- [x] 자동 재검증 0 violations 확인
- [x] P2 3 영역 acknowledge (M4 W17)
- [x] 본 response context 기록
- [ ] (다음 batch) QA self-check 사전 적용 강제
- [ ] (M4 W17) CTN-009 evaluator에 G-07/CC2-15 추가

---

## 9. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-14 14:00 | QA cross-review 응답 — P0 12건 + P1 6건 모두 처리. 자동 재검증 0 violations. 540 단어 유지 (변경만) |
