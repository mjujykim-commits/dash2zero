# Content Quality Policy — 제품수준 콘텐츠 정책 (D-019 봉인)

> 봉인: D-019 (2026-05-13, 사용자 명시 결정)
> 책임: learning (lead) · orchestrator (gate 승인)
> 범위: Starter Pack 60 + Core Pack 180 + Premium Pack 300+ + Monthly Pack N
> 참조: `docs/03_learning_methodology_curriculum.md` · `docs/04_content_operations.md` · `docs/architecture/DOMAIN_MODEL.md §2.2 WordPack`
> 시작: 2026-05-13 · 변경 시 D-NNN 봉인 필수

---

## 0. 한 줄 정의

dash2zero 콘텐츠는 "MVP candidate"가 아닌 **"실제 제품수준"**으로 출시 시점에 도달한다. 모든 단어는 8 quality gate를 통과해야 publish 가능하며, 검수 워크플로 6단계를 거친다.

---

## 1. Quality Gate 8건 (정량 기준)

### G-01: 필수 필드 존재 (100%)

다음 필드 모두 존재해야 함:

```yaml
word_id: string (PK, 영구 키 — CC2-15 / CC3-07)
korean: string (NFC normalized)
romanization: string (Revised Romanization 표준)
gloss: string (1-5 단어 영문)
example_ko: string (한국어 자연 문장)
example_en: string (영어 자연 번역)
distractors_candidate: string[3] (의미 거리 0.30-0.70)
audio_url: string (G-08 통과 후)
audio_hash: string (SHA-256, G-08 통과 후)
license: "tts-google-neural2" | "narrated"
pack_id: string (FK to WordPack)
tier: "starter" | "core" | "premium" | "monthly"
content_version: int (CC2-15 manifest 정합)
```

### G-02: 한글 표기 NFC normalize (100%)

- 한국어 표기는 Unicode NFC (Normalization Form Canonical Composition) 강제
- 분리된 자음+모음 자모는 모두 완성형으로 결합 (예: ᄀ+ᅡ → 가)
- CI script: `node -e "process.stdout.write(text.normalize('NFC') === text ? 'OK' : 'FAIL')"`

### G-03: RR (Revised Romanization) 표기 일치 (100%)

- 국립국어원 Revised Romanization (2000년 고시) 표준 준수
- 음운 변화 표기 정책:
  - **표준 표기 (RR 원칙)**: 음운 변화 미반영 (좋아요 → "joa-yo" ❌)
  - **dash2zero 표기 (UX 우선)**: 발음 기준 반영 (좋아요 → "**jo-a-yo**" ✅)
  - 사유: 영어권 학습자에게 발음 가이드 우선, audio가 진실
- 받침 변화 단어 별도 audio note 필수 (G-08 §received-changes)

### G-04: gloss 1-5 단어 + slash 통일

- 길이: 1~5 단어 (slash 포함)
- slash 형식 통일:
  - `"hello (formal)"` ✅ (괄호로 분리)
  - `"there is / I have"` ✅ (slash 분리, 두 의미 모두 표시)
  - `"there is, I have"` ❌ (comma 사용 금지)
  - `"good. I like it"` ❌ (period 사용 금지)
- 4단어 초과 시 짧은 동의어 우선 (예: "I (formal pronoun)" → "I (formal)")

### G-05: example_ko i+1 룰 (학습 어휘 ≥ 80% + 신규 ≤ 1)

- example_ko의 모든 형태소 중:
  - **80% 이상**이 본 word_id 이전에 학습된 단어 (sequence 이전 단어 + 현재 단어)
  - **최대 1개** 신규 어휘 허용
- starter pack 내부: 같은 카테고리 내 순서 + 이전 카테고리 단어 활용
- core/premium pack: starter 60 + core 180 활용 가능
- 검증: M4 W17 content evaluator (CTN-010 RR + i+1 검증)

### G-06: example_en 자연 번역

- literal 번역 회피:
  - ❌ "사과 주세요" → "Apple give-please"
  - ✅ "사과 주세요" → "Apple, please." 또는 "Can I have an apple?"
- 영어권 사용자 readability 우선
- 영국/미국 영어 표기 통일 (en-US, CC-18)
- 검증: 영어권 검수자 1차 review

### G-07: distractor 의미 거리 0.30-0.70 (CTN-009 fixture)

- distractors_candidate 3개 각각이 정답과의 의미 거리 (cosine similarity):
  - 너무 가까우면 (cosine ≥ 0.85): 동의어로 학습자 혼란
  - 너무 멀면 (cosine ≤ 0.20): 너무 쉬워서 학습 효과 X
  - **목표 cosine 0.30-0.70** (0.50 ± 0.20)
- 측정 방법:
  - M4 W17 evaluator 활성화 (CTN-009 fixture)
  - sentence-transformer ko-sbert + nasalization 정규화
  - 측정 단위: word-level 또는 lemma-level
- M3 W15 시점은 직관적 분류 (learning agent 1차 review)

### G-08: audio quality

- Provider: Google Cloud TTS Neural2 (ADR-0005)
- Voice: `ko-KR-Neural2-A` (female) 또는 `ko-KR-Neural2-C` (male) — 단어별 일관성 유지
- Format: 22kHz mono, peak -3dB, MP3 또는 AAC
- audio_hash: SHA-256, manifest cache invalidation 키 (CC3-04)
- **받침 변화 단어 별도 QA**:
  - 좋아요 [조아요], 맛있어요 [마시써요], 학교에 [학꾜에] 등
  - TTS 결과가 음운 변화 반영하는지 확인
  - Neural2 audio 신뢰성 ≥ 95% (audio_qc evaluator 활성화)

---

## 2. 검수 워크플로 6단계 (CC3-07 정합 + R-01 mitigation)

### Step 1: candidate 작성 (learning agent + AI 보조)

- learning agent가 word_id / korean / RR / gloss / example_ko/en / distractor 작성
- AI 보조 (Claude / GPT-4) 사용 권장 (특히 example 자연성)
- 작성 단위: pack별 batch (60-180 단어)
- 산출물: `fixtures/seeded/words/{pack-id}.yaml` candidate

### Step 2: 한국어 원어민 검수 (외부 검수자, R-01)

- 검수자 자격: 한국어 원어민 + 영어 가능 + 학습 콘텐츠 검수 경험 우선
- 검수 항목:
  - 한국어 자연성 (example_ko가 어색하지 않은가)
  - 받침 발음 변화 표기 (RR 정합 + audio note 필요한가)
  - 금지/민감 표현 (G-09 §정치/종교/성/폭력/혐오)
  - 빈도 적정성 (실 사용 빈도 상위 3000 단어 우선)
- 검수자 1명: 80% 통과율 목표
- 검수자 2명: 의견 일치 시 publish, 불일치 시 learning agent 결정
- R-01 mitigation: 검수자 모집 실패 시 PM self-review fallback (CC3-07 보조) + 24h SLA 지연

### Step 2.5: qa agent cross-review (D-020 봉인 2026-05-14)

> 사용자 명시 결정 "또 다른 QA 인력 고용 + 상호검증" 반영. 내부 swarm coding 팀의 qa agent가 learning agent 산출물 cross-review.

- 검수 주체: qa agent (Core 9, AGENTS.md §4 content-research-writer skill 활성)
- 검수 영역 (외부 검수자와 상호 보완):
  - **기술·형식 측면** (qa 강점):
    - G-01 필수 필드 (자동 grep 검증, 100% 가능)
    - G-02 NFC normalize (자동 검증, 100%)
    - G-04 gloss 1-5 단어 + slash 형식 (자동 + 수동 sampling)
    - G-07 distractor 자기참조 검사 (자기 자신 한글이 distractors에 포함된 case)
    - G-10 빈도 corpus 대조 (M4 W17 빈도 corpus 활성 후)
    - 영구 키 정합 (CC2-15) — 동일 한글 다른 word_id 검사
    - i+1 어휘 시퀀스 검증 (G-05, sampling)
  - **자연성·문화 측면** (외부 원어민 검수에 위임):
    - 한국어 example_ko 자연성
    - 받침 발음 변화 audio_qc
    - 빈도 직관 적정성
- 검수 단위: pack별 batch (starter / core-kpop / core-kdrama / core-travel / premium 등)
- 발견 시 분류:
  - **P0** (출시 차단): G-01 필수 필드 결손 / G-07 자기참조 / 영구 키 충돌 / G-09 금지·민감
  - **P1** (1주 안 처리): G-04 형식 위반 / i+1 위반 / RR 표기 불일치
  - **P2** (M4 W17 batch 처리): distractor 거리 의심 / 빈도 corpus 미대조 / audio_qc 후 발견 사항
- 응답 절차:
  1. qa가 발견 사항 list (`context/agents/qa/{date}-feat-content-cross-review.md`)
  2. learning agent가 P0 즉시 수정 + P1/P2 acknowledge + 응답 context (`context/agents/learning/{date}-feat-qa-cross-review-response.md`)
  3. P0 수정 완료 시 qa 재검수 + 통과 표기
- R-01 mitigation 강화: 외부 검수자 모집 실패 시 qa가 100% 검수 fallback (외부 비용 0)

### Step 3: 영어 원어민 검수 (영어 자연성)

- 검수자 자격: 영어 원어민 (US/UK/AU/NZ/CA 중 1개국)
- 검수 항목:
  - gloss 자연성 (1~5 단어 + slash 형식)
  - example_en 자연성 (literal vs idiomatic)
  - 한국어 학습 동기 카테고리 정합 (K-pop / K-drama / Travel)
- 검수자 1명: 충분 (영어는 일관성 우선)

### Step 4: TTS audio 생성 + QA

- script: `scripts/content/generate-audio.ts` (M2 작성)
- batch 생성: pack별 단어 + 예문 = ~120 audio file
- audio_qc evaluator:
  - 받침 변화 단어 발음 일치 95%+
  - peak -3dB / RMS -18dB 정합
  - 길이 0.8-3.0초 (단어), 2.0-6.0초 (예문)

### Step 5: Storage upload + manifest publish

- Supabase Storage `audio_assets/{tier}/{pack_id}/{word_id}.mp3` 업로드
- audio_url 생성 (signed URL + 24h cache)
- ContentManifest publish:
  - `manifest_version`, `pack_version`, `content_hash`, `words_diff`
  - 클라이언트 diff 다운로드 (CC2-15)
- backend: Edge Function `publish-pack` 호출

### Step 6: post-publish QA

- 베타 사용자 첫 1주 활동:
  - `content_reports` 5건 이상 발생 시 즉시 review
  - typo/translation/audio 카테고리별 처리
- 콘텐츠 retire 정책:
  - retire 시 user_word_state.last_choices에서 retired distractor 제거 (R-24, W15-07b)
  - retired_at 표시 + 동일 word_id 재사용 금지 (CC2-15 영구 키)

---

## 3. 외부 검수자 모집 정책 (R-01 mitigation)

### 3.1 모집 채널

| 채널 | 비용 | lead time | 권고 |
|---|---|---|---|
| Reddit r/Korean / r/korean | 0 | 1~2주 | 1차 시도 |
| Discord 한국어 학습 커뮤니티 | 0 | 1~2주 | 1차 시도 |
| Upwork / Fiverr 프리랜서 | $50-150/검수 | 3-7일 | 신뢰성 우선 시 |
| 지인 (한국어 교사 / 대학원생) | 0 또는 사례비 | 즉시 | 추천 |
| KIIP (Korean Immigration Integration Program) 강사 SNS | 0 | 2~4주 | 한국 거주자 |

### 3.2 채용 양식

- 본인 자격 (한국어 원어민 / 영어 가능 / 검수 경험)
- 시간당 작업량 (예상 60 단어 = 2~3시간)
- 사례비 (시간당 $20-30 권고, 1인 운영 캐파)
- 작업 도구 (Google Docs review 또는 GitHub PR)

### 3.3 검수자 1명만 확보 시

- starter 60 → 1명 100% 검수
- core 180 → 1명 sampling 50% + AI 보조 review 100%
- premium 300 → 1명 sampling 30% + AI 보조 review 100%
- 베타 14d 동안 발견된 issue retroactive 처리

---

## 4. AI 보조 사용 정책

### 4.1 허용 영역

- example_ko / example_en 자연성 1차 review
- distractor 의미 거리 추정 (cosine 측정 sentence-transformer)
- gloss slash 형식 통일

### 4.2 금지 영역

- AI 단독 publish (반드시 한국어 원어민 검수 통과)
- 받침 발음 변화 RR 표기 (AI 오류 가능성 + audio 실측 필수)
- 빈도 분석 (사전 데이터 사용)

### 4.3 humanizer 사용 제한 (AGENTS.md §4.1)

- AI 사용 은폐 / 탐지 회피 목적 금지
- 자연성 다듬기에만 허용
- 사용 시 context 기록에 명시 (skill: humanizer / purpose: 자연성 다듬기)

---

## 5. 금지/민감 표현 (G-09)

다음 카테고리 0건 (1차 5개국 Apple/Google 정책 정합):

- **정치**: 정당명, 대통령명, 정치 이슈, 시위 등
- **종교**: 특정 종교 신앙 표현, 종교 비교
- **성**: 성적 표현, 신체 묘사, 성 정체성 이슈
- **폭력**: 무기, 폭력 행위, 자해
- **혐오**: 인종, 국적, 성별, 외모, 장애 차별

검증: AI 보조 1차 scan + 검수자 2차 review.

---

## 6. 빈도 기반성 (G-10)

- **소스**: 국립국어원 한국어 학습용 어휘 (2003, 2010 개정) 또는 KO-COW (Korean COllection of Words)
- **starter 60**: 빈도 상위 500 단어 중 선정 (생존 한국어)
- **core 180**: 빈도 상위 1500 단어 중 + 카테고리 동기 (K-pop 어휘는 1500-3000 범위 포함 가능)
- **premium 300**: 빈도 상위 3000 단어 + TOPIK 2 (B1)
- **monthly 50**: 빈도 상위 5000 단어 + 토픽 기반 (계절/시사)

빈도 데이터는 fixtures/seeded/frequency-corpus.yaml (M4 W17 작업 큐, deferred).

---

## 7. CEFR / TOPIK 매핑

| 패스 | CEFR | TOPIK |
|---|---|---|
| Starter 60 | A0 (pre-A1) | TOPIK I 진입 전 |
| Core 180 | A1-A2 | TOPIK I |
| Premium 300 | A2-B1 | TOPIK I 후반 ~ II 초반 |
| Monthly 50 | B1-B2 | TOPIK II |

---

## 8. 변경 정책

- 본 정책 변경 시 D-NNN 봉인 필수
- starter / core / premium pack 추가 변경 시 content_version bump + manifest republish
- audio TTS provider 변경 시 ADR (현재 ADR-0005 Google Cloud Neural2)
- 검수자 시급 변경 시 본 문서 §3.2 갱신

---

## 9. M3 W15 시점 status (D-019 봉인 시점)

| 항목 | 현재 | 목표 |
|---|---|---|
| Starter 60 candidate | ✅ v1.0 (M2-S2~S4) | quality 보강 (R-01 검수 진행) |
| Core 180 | ❌ 미작성 | **본 사이클 작성** (D-019 일환) |
| Premium Pack 1 | ❌ 미작성 | **본 사이클 100건 초안** (다음 사이클 200건 추가) |
| Monthly Pack N | ❌ 미작성 | post-GA |
| 외부 검수자 (R-01) | in_progress | M3 W16 ~ M4 W17 안에 1~2명 확정 |
| audio TTS 생성 | pending | M2-S6에서 starter 60, M4 W17에서 core/premium 진행 |
| CTN-009 evaluator | M4 deferred | M4 W17 활성화 |

---

## 10. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-13 | 신규 작성 — D-019 봉인 정합 + 8 quality gate 정량화 + 검수 워크플로 6단계 + R-01 모집 정책 + AI 보조 정책 + 빈도/CEFR/TOPIK 매핑 | orchestrator (사용자 결정 반영) |
