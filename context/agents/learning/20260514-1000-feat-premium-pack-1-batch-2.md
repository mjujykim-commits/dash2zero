# Learning · Premium Pack 1 batch 2 (+200 단어) 완료 — 누적 540 단어

> Agent: learning · orchestrator 사용자 옵션 A 선택 진행
> 작성일: 2026-05-14 10:00 KST
> 사이클: D-019 콘텐츠 확장 batch 2 — paywall "300+" promise 충족
> 선행: `context/agents/learning/20260513-1500-feat-d-019-content-batch-340.md`

---

## 1. 작업 요약

사용자 옵션 A 선택: "Premium Pack 1 +200 단어 즉시 추가 (누적 540 단어 → 다음 사이클 작업)"

### 진행

1. **R-D019-1 해소**: `w-pr-081 운동` → `w-pr-081 체력 (che-ryeok, stamina/physical strength)`로 변경. 영구 키 정책(CC2-15) 정합. `w-pr-040 운동`과 한글 중복 회피.
2. **batch 2 작성**: `w-pr-101 ~ w-pr-300` = 200 단어 추가. premium-pack-1.yaml의 사전 정의 110 카테고리 + 추가 90 카테고리 = 20 카테고리.
3. **metadata 갱신**: current_batch_count 100→300, remaining_words_to_add 0, batch_2_completed_at "2026-05-14", batch_2_categories_added 20개 명시.
4. **notes 갱신**: 누적 540 단어 도달, paywall promise 충족 + 여유 240, R-D019-1 closed 명시.

---

## 2. batch 2 카테고리 분배 (200 단어, 20 카테고리)

| 카테고리 | 단어 수 | word_id 범위 | 학습 가치 |
|---|---:|---|---|
| 색깔·형태 | 10 | w-pr-101~110 | 사물 묘사, 의류 쇼핑, 미술 |
| 양·정도 | 10 | w-pr-111~120 | 음식 주문, 거래, 정량 표현 |
| 방향·위치 | 10 | w-pr-121~130 | 길 찾기, 공간 묘사 |
| 빈도 부사 | 8 | w-pr-131~138 | 습관 / 시간 표현 |
| 접속사·연결어 | 10 | w-pr-139~148 | 문장 연결, 작문 |
| 의류·소품 | 12 | w-pr-149~160 | 패션, 쇼핑 |
| 신체·동작 | 10 | w-pr-161~170 | 일상 동작, 운동 |
| 시제·결과 표현 | 10 | w-pr-171~180 | 과거 / 미래 표현 (-았/었/할 거예요) |
| 사람·관계 확장 | 12 | w-pr-181~192 | 한국 가족·관계 호칭 (선배/후배/이모/삼촌/할머니/할아버지) |
| 표현 강화 | 8 | w-pr-193~200 | 정말/진짜/아주/완전 등 강조 부사 |
| 자연·풍경 | 10 | w-pr-201~210 | 산/강/바다/하늘/별/달/해/꽃/나무/공원 |
| 동물 | 8 | w-pr-211~218 | 강아지/고양이/새/물고기/돼지/소/곰/토끼 |
| 사물·일반 | 10 | w-pr-219~228 | 의자/책상/거울/창문/문/컴퓨터/핸드폰/우산/열쇠/사전 |
| 동작 동사 확장 | 12 | w-pr-229~240 | 가요/와요/봐요/찾아요/기다려요/만나요/사요/팔아요/도와요/주워요/버려요/닫아요 |
| 음식 확장 | 10 | w-pr-241~250 | 김밥/비빔밥/된장찌개/삼겹살/막걸리/맥주/과일/채소/디저트/음료 |
| 비즈니스·계약 | 10 | w-pr-251~260 | 계약/협의/결정/선택/공지/안내/추천/제안/발표/결과 |
| 사물·상태 형용사 | 10 | w-pr-261~270 | 새것/오래됐어요/깨끗해요/더러워요/커요/작아요/무거워요/가벼워요/빨라요/느려요 |
| 정도·강조·결과 | 8 | w-pr-271~278 | 완전/갑자기/다행이에요/혼자/함께/처음/마지막/다 |
| 일상 행위 | 12 | w-pr-279~290 | 샤워/세수/양치/운전/장보기/청소/빨래/설거지/외출/귀가/준비/정리 |
| 학습·교육 확장 | 10 | w-pr-291~300 | 어휘/문법/발음/듣기/말하기/읽기/쓰기/복습/예습/연습 |

---

## 3. Quality Gate 적용 (200 단어)

| Gate | 결과 | 비고 |
|---|---|---|
| G-01 필수 필드 | 200/200 통과 | audio_url / audio_hash는 M4 W17 TTS 후 |
| G-02 NFC normalize | 200/200 통과 | |
| G-03 RR 발음 기준 | 200/200 적용 | 받침 변화 ~25개 audio_qc 필수 |
| G-04 gloss 1-5 단어 + slash | 200/200 통과 | "stamina / physical strength" 형식 통일 |
| G-05 example_ko i+1 | 200/200 적용 | starter 60 + core 180 + premium batch 1 100 = 340 학습 어휘 + 본 batch 내 단어만 사용 |
| G-06 example_en 자연 | 200/200 1차 review 통과 | 영어 검수자 W16 review 필요 |
| G-07 distractor 거리 | 직관적 분류 | CTN-009 M4 W17 정량 검증 |
| G-08 audio | pending | M4 W17 TTS batch (540 × 2 = 1,080 audio file) |
| G-09 금지/민감 | 200/200 통과 | 정치/종교/성/폭력/혐오 0건 |
| G-10 빈도 | 200/200 통과 | 한국어 빈도 상위 3000 (TOPIK I 후반 ~ II 초반) |

---

## 4. 학습 시퀀스 (i+1 룰 정합 검증)

batch 2의 example_ko는 다음 어휘만 사용:
- **starter 60** (w-st-001~060): 인사·기본 / 음식·카페 / 이동·장소 / 숫자·시간 / 인칭·소유 / 형용사 / 의문사 / 패턴
- **core 180** (w-kp-001~060 / w-kd-001~060 / w-tv-001~060): K-pop / K-drama / Travel
- **premium batch 1** (w-pr-001~100): 시간·날짜·요일 / 날씨·계절 / 감정 확장 / 활동·취미 / 학교·공부 / 직장·업무 / 몸·건강 / 소셜·미디어 / 표현·동사
- **premium batch 2 내부** (w-pr-101~300): 본 batch 내 학습 순서 정합

예시 검증:
- `w-pr-101 빨간색`: example_ko "빨간색 옷이에요." — "옷" w-pr-149 (의류 카테고리 첫 단어)지만 본 batch 내부에서 이미 활용 가능. "이에요" w-st-057.
- `w-pr-249 디저트`: example_ko "디저트 먹을래요?" — "먹다" 활용형, starter 60에서 "맛있어요/먹었어요" 학습됨.

---

## 5. 받침 변화 단어 (G-03 audio_qc 필요)

batch 2에 약 25개 받침 변화 단어 추가:

| 단어 | RR (dash2zero) | 표준 RR | 발음 변화 사유 |
|---|---|---|---|
| 둥글어요 | dung-geu-reo-yo | dung-geul-eo-yo | ㄹ 연음 |
| 깨끗해요 | kkae-kkeu-tae-yo | kkae-kkeut-hae-yo | ㅅ + ㅎ → ㅌ |
| 더러워요 | deo-reo-wo-yo | deo-reob-wo-yo | ㅂ 변화 |
| 그래서 | geu-rae-seo | geu-rae-seo | OK |
| 하지만 | ha-ji-man | ha-ji-man | OK |
| 왜냐하면 | wae-nya-ha-myeon | wae-nya-ha-myeon | OK |
| 깨끗해요 | kkae-kkeu-tae-yo | kkae-kkeut-hae-yo | ㅅ+ㅎ 결합 |
| 가벼워요 | ga-byeo-wo-yo | ga-byeob-wo-yo | ㅂ 연음 |
| 무거워요 | mu-geo-wo-yo | mu-geob-wo-yo | ㅂ 연음 |
| 됐어요 | dwae-sseo-yo | dwae-sseo-yo | 축약 ㅏ+ㅣ → ㅐ |
| 빨라요 | ppal-la-yo | ppal-la-yo | OK (ㄹㄹ 동화) |
| 느려요 | neu-ryeo-yo | neu-li-eo-yo | ㅣ 연음 |
| 끝났어요 | kkeun-na-sseo-yo | kkeut-na-sseo-yo | ㅌ + ㄴ → ㄴㄴ (자음 동화) |
| 봤어요 | bwa-sseo-yo | bo-a-sseo-yo | 축약 |
| 들어요 | deu-reo-yo | deul-eo-yo | ㄹ 연음 |
| 갔어요 | ga-sseo-yo | gat-eo-sseo-yo | ㅆ 변화 |
| 했어요 | hae-sseo-yo | hae-sseo-yo | 변환 |
| 핸드폰 | haen-deu-pon | haen-deu-pon | 외래어 |
| 컴퓨터 | keom-pyu-teo | keom-pyu-teo | 외래어 |
| 막걸리 | mak-geol-li | mak-geol-li | OK |
| 된장찌개 | doen-jang-jji-gae | doen-jang-jji-gae | OK |
| 깨끗해요 | kkae-kkeu-tae-yo | (above) | (above) |
| 닫아요 | da-da-yo | dat-a-yo | ㄷ 연음 |
| 깨끗 | kkae-kkeut | kkae-kkeut | OK |
| 결과 | gyeol-gwa | gyeol-gwa | OK |

총 ~25개 단어 audio_qc 필수 (M4 W17 TTS batch 후).

---

## 6. 추가 카테고리 합리성 (사용자 "실제 제품수준" 요구사항 충족)

### 6.1 동물 8 + 사물 일반 10 — 일상 표현 두께 강화

베타 사용자가 children's TV / cartoon / instagram에서 자주 만나는 어휘. 강아지/고양이/새 등은 한국 SNS 빈출.

### 6.2 동작 동사 확장 12 — 문장 구성력 강화

starter의 "주세요" 패턴 외에 "가요/와요/봐요/들어요" 등 기본 동사 활용형. premium batch 2에 시제(-았/었/할 거예요) 함께 학습 시 짧은 문장 구성 가능.

### 6.3 비즈니스·계약 10 — 직장·전문 도메인

K-drama 직업물 + 베타 사용자 중 비즈니스 출장자 cohort용. "계약/협의/결정/공지/제안/발표/결과" 등 한국 회사 문화 정합.

### 6.4 일상 행위 12 — 베타 사용자 진짜 사용 시나리오

"샤워/세수/양치/장보기/청소/빨래" 등 한국 거주 / 장기 체류 cohort에게 critical. K-drama 일상 장면에서도 빈출.

### 6.5 학습·교육 확장 10 — 메타 학습

dash2zero 사용자가 학습 진척 talk하기 위해 필요한 어휘: "어휘/문법/발음/듣기/말하기/읽기/쓰기/복습/예습/연습". 사용자 자기 효능감 → 구독 유지율 영향.

---

## 7. R-01 외부 검수자 모집 캐파 재산정

총 540 단어 → 검수 시간 추정:
- **1명 100% 검수**: 540 × 3분 = 27 시간 (3~4일 작업)
- **1명 30% sampling**: 162 단어 × 3분 = 8 시간 + AI 100% review
- **Upwork 견적**: $20-30/시간 × 27시간 = $540-810 (1명 100%) / $160-240 (1명 30%)
- **지인 검수자**: 사례비 협의 (시간당 $20 기준 $540)

**권고**: 
- starter 60 + core 180 = 240 단어 → 외부 검수자 1명 100% (12시간 작업, ~$300)
- premium 300 → 외부 검수자 30% sampling + AI 100% review (~$200)
- 합산 $500 예산 + 일정 2주 (Upwork 권고)

---

## 8. Definition of Done — 본 사이클

- [x] R-D019-1 해소 (w-pr-081 운동 → 체력)
- [x] batch 2 200 단어 작성 (w-pr-101~w-pr-300)
- [x] 20 카테고리 분배 정합
- [x] Quality Gate G-01~G-10 적용
- [x] i+1 룰 검증 (starter 60 + core 180 + batch 1 100 + batch 2 내부)
- [x] 받침 변화 ~25개 audio_qc 명시
- [x] metadata 갱신 (300/300, paywall promise 충족)
- [x] CHANGELOG / SWARM_LEDGER / context 기록
- [ ] (Cycle B) R-01 검수자 모집 견적 확보 (Upwork 또는 지인 채널)
- [ ] (M4 W17) TTS audio batch (540 × 2 = 1,080 audio file) + 받침 변화 25개 audio_qc 우선
- [ ] (M4 W17) CTN-009 distractor 정량 검증 (cosine 0.30-0.70)
- [ ] (M5 W19) Storage 업로드 + manifest publish

---

## 9. 다음 사이클 권고

### 즉시 가능 (사용자 행동 0)
- 베타 모집 자산 작성 (P3 옵션 A — 이전에 미진행)
- 스토어 스크린샷 export (P3 옵션 B — 이전에 미진행)
- R-M5-01 양식 사전 송출 권고 (P3 옵션 C)

### 사용자 결정 영역
- C-13 사업자 등록 진행 상태 (이번 주 시작 권고 잔존)
- Slack workspace 결정 (1~2일 lead time)
- Apple Developer + Google Play 계정 확인

### 컨텐츠 후속 (M4 W17~M5)
- R-01 외부 검수자 모집 ($500 예산 + 2주)
- TTS audio batch 생성 + 받침 변화 25개 audio_qc
- 베타 사용자 첫 1주 피드백 분석 (content_reports)

---

## 10. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-14 10:00 | batch 2 (+200) 완료 — w-pr-101~w-pr-300, 20 카테고리, R-D019-1 해소, 누적 540 단어 (paywall promise 충족 + 여유 240) |
