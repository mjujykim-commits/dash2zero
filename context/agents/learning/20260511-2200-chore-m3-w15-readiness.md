# M3-W15 Learning Readiness 자가 진단 (12항목)

- **Agent**: learning (Specialist)
- **작성일**: 2026-05-11 22:00 KST
- **사이클**: M3 W15 진입 직전 (W14 evaluator/CI 통합 완료 직후)
- **참조**: `context/rollups/20260511-M3-W14-evaluators-and-ci.md` / `docs/03_learning_methodology_curriculum.md` / `docs/04_content_operations_review_guide.md` / `fixtures/golden/srs/README.md` / `fixtures/golden/content/README.md` / `docs/runbooks/BASELINE_METRICS.md`

---

## 1. W15에서 learning이 책임지는 deliverable

| ID | 작업 | 산출물 | 협업 |
|---|---|---|---|
| L-W15-A | Content golden 잔여 3건 (CON-009/010/011) 검수 spec 제공 | YAML 작성은 content, 학습 적합성 판정 기준은 learning 정의 | content + analytics |
| L-W15-B | SRS 28건 갭 분석에 학습 도메인 시나리오 5개 추가 제안 | 본 문서 §10 + EVALUATION_SCENARIOS 매트릭스 갱신 요청 | analytics + qa |
| L-W15-C | lesson_complete_rate 임계값 학습 도메인 권고 (alert/ release-block) | 본 문서 §6 + BASELINE_METRICS.md §1 보강 요청 | analytics + product |
| L-W15-D | 외부 검수자 활동 상태 점검 (R-01) + W15 영향 분석 | 본 문서 §11 | content |

---

## 2. 12항목 자가 진단 체크리스트

| # | 항목 | 상태 | 비고 |
|---:|---|---|---|
| 1 | SRS 알고리즘 SoT (`_shared/srs.ts`) 학습 정책 일관 | green | W13 SoT 통합 완료. Leitner 1·3·7·14·30 + same-cycle/Mastered 보호 모두 단언 |
| 2 | 60단어 starter pack 검수표 v0.1 적용 | green | content evaluator CON-001/002/003가 정량 단언 (필수 필드/count/distractor 중복) |
| 3 | distractor 의미 거리 임계값 정량화 | **yellow** | 현재 "동일 pack/품사 + unique" 만 단언. 의미 거리 (e.g. cosine ≥ 0.3) 미정량 — W15에 정의 권고 |
| 4 | 예문 i+1 자연성 검수 기준 정량화 | **yellow** | "신규 학습 포인트 1개" 정성. 어휘 신규율 ≤ 20% / 음절 ≤ 12 등 정량 제안 W15 |
| 5 | TTS 발화 속도/오디오 길이 범위 | green | CON-004/005/009가 in-range / too-long / too-short 모두 cover (1.5~4.5s) |
| 6 | RR romanization 일관성 검증 | green | content evaluator schema에 romanization 필드 강제. 받침/연음 룰은 starter 60단어 한정 spot check |
| 7 | Mastered 보호 (CC3-05) golden | green | SRS-026/027 + SRS-018 (same-cycle 우선) 작성 |
| 8 | 무료 한도 (CC2-07) golden | green | SRS-047/048/049/050 4건 모두 작성 |
| 9 | 04:00 cycle boundary 학습 영향 | green | SRS-029/031/032/033 + 타임존 3건 |
| 10 | 학습 진단 ("안다" 판정) 기준 | green | stage 5 도달 = Mastered. Mastered → 오답 1회 시 stage 4 강하 정책 단언 |
| 11 | 60단어 끝난 후 동기 (post-mastered) 정책 | **red** | MVP 정책: 60단어 batch 6회로 360단어. 그 이후/장기 재노출(CC2-09)은 Phase 3 실험. W15에서 결정할 필요는 없으나 baseline 수집 시 cohort 리스크로 기록 |
| 12 | analytics 이벤트 emit (Mastered/Weak measurement) | yellow | W15 작업 큐에 포함 (Q-DA-DOC-007). emit 후 baseline 14d에 srs_mastered_reached 누적 측정 |

green 8 / yellow 3 / red 1 — W15 진입 차단 없음. red 1건은 M4 이후 cohort 리스크로 기록만.

---

## 3. Content golden 잔여 3건 (CON-009/010/011) 학습 도메인 spec

W14 README 분포표 기반 잔여 = audio_too_short 1 + report_typo 1 + report_spam 1.

| ID | category | 학습 도메인 검증 포인트 |
|---|---|---|
| CON-009 | audio_length (under) | TTS 합성 결과가 1.5s 미만이면 "들리지 않는 단어" 위험. 학습자가 Hear 단계에서 인지 불가 → reject. starter 60단어 1음절 단어("물","책") 중 가장 짧은 합성을 sample로 |
| CON-010 | report_5_categories (typo) | "오타" 신고 카테고리는 학습자가 한글 표기 오류로 인지한 경우. evaluator는 typo report → content_review queue 진입 + retire 미발동 단언 |
| CON-011 | report_5_categories (spam-rejected) | "스팸/관련없음" 신고는 학습자 오용 가능. learning 관점: 동일 단어 24h 내 동일 사용자 spam report 3회 미만이면 reject (학습 큐 영향 X). 반복 신고 시 audit_log만 |

→ content agent에 본 spec 전달, YAML 작성은 content + analytics 책임.

---

## 4. SRS 28건 갭 분석 — 학습 도메인 추가 시나리오 Top 5

W14까지 22건 작성. 잔여 28건 중 "현재 매트릭스(EVALUATION_SCENARIOS §2.2)에 없는 학습 도메인 누락 cell" 5개:

| 신규 ID 후보 | 시나리오 | 학습 정당성 (CC/원칙) |
|---|---|---|
| **SRS-051 interruption-resume** | lesson 진입 후 attempt 1회만 마치고 앱 강제 종료 → 4시간 후 재진입 시 동일 word_id가 같은 cycle 큐에 남음 (재시도가 1회 attempt로 카운트되지 말 것) | CC2-25 (3분 lesson 약속) + same-cycle 정의 보호. attempt 멱등성 검증 |
| **SRS-052 dormant-14day-return** | user가 14일 미접속 후 복귀. stage 3 단어의 next_due_at은 이미 7일 이상 overdue. overdue 단어가 review queue 우선 노출되고 일일 한도(무료 3) 안에서 weak 단어가 우선되는지 | CC-08 + 일일 한도 정책. 장기 미접속자의 회복 경로 |
| **SRS-053 audio-mismatch-report-stage** | 사용자가 단어 학습 중 audio_mismatch 신고 → 같은 attempt의 정답/오답이 SRS stage 전이에 반영되지 말 것 (신고가 attempt invalidate) | CC2-15 + 콘텐츠 품질 신고. 신고가 부당한 stage 강하를 유발하지 말 것 |
| **SRS-054 same-session-repeat** | 단일 lesson 세션 내 동일 word_id가 New + Review 큐 양쪽에 들어가 2회 노출되는 경우. 1회 정답 후 같은 세션 재노출은 SRS stage 전이 1회만 적용 (중복 카운트 차단) | active recall 효과 boost는 OK, 그러나 SRS state는 1회만 갱신. desirable difficulty 원칙 |
| **SRS-055 weak-clear-threshold** | weak=true 단어가 연속 N회 정답 시 weak=false 해제. 현재 SRS-012는 1회 정답 = clear 가정. learning 권고: 2회 연속 정답 (different cycle) 후 clear가 false-positive 해제 방지 | Mastered 보호 대칭. 정책 결정 필요 — 1회 vs 2회. **차단 결정: backend + analytics 합의 필요** |

추가 권고 (top 5에는 미포함, 잔여 23건 중 우선순위 보조):
- 동일 단어 4지선다에서 정답이 위치 bias (항상 첫번째)일 때 학습 효과 회귀 — distractor randomization 단언 (content 도메인 가까움)
- guest → signup 머지 시 weak flag 보존 단언 (현재 SRS-035/036/038은 stage/correct_count만 단언)
- 재구매(refund 후 재구매)로 entitlement 복원 시 user_word_states 무손실 — payment ↔ SRS 교차 (PAY-ADV-002 + SRS 교차 case)

→ analytics + qa에 본 5개 시나리오 spec 전달, YAML/expected 작성은 analytics 책임. learning은 expected의 "정답성"만 review.

---

## 5. lesson_complete_rate 학습 도메인 해석

`docs/runbooks/BASELINE_METRICS.md §1` 정의: `lesson_started` 대비 `lesson_completed` 비율.

### 5.1 학습 설계가 약속한 baseline

- CC2-25: 3분 단일 lesson — 3단어 × 4단계(Notice/Hear/Meaning/Retrieve) ≈ 9-12 attempt
- Tiny Habit 원칙: 진입 마찰 최소화 → 시작했으면 끝나야 함이 design intent
- 비교 벤치 (LingoDeer/Memrise 일반): 단일 lesson complete 70-85% 범위

### 5.2 임계값 권고 (3-tier)

| Tier | 임계 | 해석 | Action |
|---|---|---|---|
| **Healthy** | ≥ 75% | 3분 lesson 약속 + 인지 부담 적정 | normal |
| **Warning** | 60-75% | 콘텐츠 난이도/오디오 품질/UX 마찰 의심 | week-over-week trending alert (Slack #learning), W15 baseline에서는 정보성 |
| **Critical** | < 60% | 학습 약속 위반 — 콘텐츠 회귀 / TTS 장애 / Notice 단계 인지 실패 가능 | release-block 권고. learning + content 즉시 동조 audit |

### 5.3 cohort 분해 권고 (단일 평균에 의존하지 말 것)

분모를 다음으로 쪼개야 false signal 방지:
- **첫 lesson** (onboarding 완료 ~ first lesson) vs **2회차 이후** — 첫 lesson은 90%+ 기대, 2회차+는 70%+ 기대
- **무료 vs Premium** — 무료 일일 한도 도달이 abandon으로 오해되지 말 것 (lesson_started 후 한도 차단은 별도 분류)
- **Free + first 7 days** vs **Free + 8+ days** — habit 형성 cohort

### 5.4 baseline 14d 후 임계 재조정

W16에 14d baseline mean ± std 측정 후 본 임계는 absolute → relative (`mean - 1.5σ`)로 전환 권고. 본 임계는 W15-W16 cold start 기준.

---

## 6. M3 내 외부 검수자 활동 상태 (R-01)

| 항목 | 상태 (2026-05-11) | W15 영향 |
|---|---|---|
| W4-W5 모집 공고 (r/Korean) | 미확인 — context/agents/learning/2026-05-08 기록은 "모집 시작" 단계만 | content golden 11건이 학습 자체 검수만으로 통과 중. 외부 1명도 publish 라인에 없음 |
| 외부 검수자 1명 모집 결과 | **미확정** — fallback (PM 자체 검수 + 24h self-review)로 운영 추정 | starter 60단어 batch는 self-review 라인으로 운영 가능. M4 batch 50 × 6 시작 시 외부 검수자 부재 = bottleneck 위험 |
| W15 차단 영향 | **없음** — content evaluator는 정량 schema만 검증. 정성("자연스러움") 검수는 publish 전 단계 | M4 게이트 전까지 외부 검수자 또는 LLM-as-judge 보강 필요. W15 작업 큐에 추가 권고 X (M4 작업) |

→ R-01 상태를 W15 1주차 standup에서 product에 escalate 권고. 본 W15는 차단 없음.

---

## 7. 차단 / 의존성

| ID | 의존성 | 차단 여부 |
|---|---|---|
| D-1 | SRS-055 weak-clear-threshold 정책 (1회 vs 2회) — backend `_shared/srs.ts` 현재 동작 확정 필요 | **soft-block** — analytics가 expected 작성 전 backend 합의 필요. 1일 내 결정 가능 |
| D-2 | content evaluator의 distractor 의미 거리 정량화 — embedding 도구 미정 | non-block — W15는 unique만 단언 유지, 의미 거리는 M4 상위 작업 |
| D-3 | analytics Mastered/Weak event emit (Q-DA-DOC-007) — frontend 협업 | non-block (W15 작업 큐 내 병행) |
| D-4 | baseline_metrics_day emit 코드 머지 | non-block — analytics + frontend W15 진행 |

---

## 8. 사용한 Skill

- content-research-writer (예문 i+1, distractor 의미 거리 비판)
- prompt-engineering (SRS 5개 신규 시나리오의 expected 명세)
- root-cause-tracing (lesson_complete_rate 임계 cohort 분해)

---

## 9. 다음 추천 액션 (W15 진행 중)

1. orchestrator: 본 문서 + SRS 5건 신규 시나리오를 analytics에 전달
2. content: CON-009/010/011 spec(§3) 적용해 YAML 작성
3. analytics: lesson_complete_rate 3-tier 임계를 BASELINE_METRICS.md §1에 반영
4. learning(self): SRS 5건 expected 작성 후 review (W15 중반)
5. product: R-01 외부 검수자 상태 escalate

---

## 10. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-11 22:00 | W15 readiness 12항목 자가 진단 + SRS 5신규 시나리오 + lesson_complete_rate 임계 권고 + 외부 검수자 상태 보고 |
