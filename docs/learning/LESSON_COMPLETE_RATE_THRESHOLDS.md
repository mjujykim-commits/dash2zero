# lesson_complete_rate 임계값 권고서 (Learning Domain)

> 작성: learning agent (Senior Learning / Curriculum Designer)
> 작성일: 2026-05-11 (M3 W15)
> 적용 시점: M3 W15 cold-start ~ M3 W16 baseline 회수 (이후 relative 전환)
> 참조: `docs/runbooks/BASELINE_METRICS.md §1`, `context/agents/learning/20260511-2200-chore-m3-w15-readiness.md §5`
> 사용처: `docs/product/PRD.md §8` (planner가 본 권고서를 reference로 PRD 임계값 작성)

---

## 1. 정의 재확인

`lesson_complete_rate = lesson_completed / lesson_started` (per local-day cycle, 04:00 KST 경계)

- 분자: `lesson_completed` event emit (3분 lesson 4단계 완주)
- 분모: `lesson_started` event emit (lesson 진입)
- 분해 단위: per user (소수점 1자리), per cohort (소수점 1자리), 전체 (소수점 1자리)

---

## 2. 학습 설계 약속 — baseline 가정의 근거

| 약속 | 출처 | 임계 영향 |
|---|---|---|
| 3분 단일 lesson (3단어 × 4단계) | CC2-25, docs/03 §3.2 | 시작했으면 끝나야 함 (Tiny Habit) |
| 진입 마찰 최소화 (login 없이도 첫 lesson 가능) | docs/02 §4.3 | abandon 사유는 콘텐츠/UX, 동기 부족 X |
| 인지 부담 적정 (Notice→Hear→Meaning→Retrieve) | docs/03 §4 | 단계별 70%+ 통과 기대 |
| 비교 벤치 (LingoDeer/Memrise A1) | learning agent 분석 | 70-85% 일반 범위 |

→ 따라서 healthy 기준은 **75%** (벤치 중간값보다 약간 높게, design intent 반영)

---

## 3. 3-Tier 임계값 (W15-W16 Cold Start Absolute)

| Tier | 범위 | 학습 도메인 해석 | Action | Owner |
|---|---|---|---|---|
| **Healthy** | ≥ 75% | 3분 약속 + 인지 부담 적정 | normal monitoring | analytics |
| **Warning** | 60% ≤ x < 75% | 콘텐츠 난이도 / 오디오 품질 / UX 마찰 의심 | week-over-week trending alert (Slack #learning), 정보성 — release 차단 X | learning + content |
| **Critical** | < 60% | 학습 약속 위반. 콘텐츠 회귀 / TTS 장애 / Notice 단계 인지 실패 가능 | release-block 권고. learning + content 즉시 동조 audit | learning + content + product |

### 3.1 임계값 산정 근거

- **75% Healthy**: LingoDeer(A1) 평균 78%, Memrise(beginner) 평균 72%. dash2zero는 3분 단일 lesson + 진입 마찰 최소화로 design intent 75%+ 가능
- **60% Critical**: A1 학습자 10명 중 4명이 lesson을 못 끝낸다면 콘텐츠/UX 결함 신호. SLA 차원 release block 정당화
- **5% gap (75-80% 미설정)**: tier 단순화. 75% 자체를 mean으로 잡고 자연 변동 흡수

### 3.2 시간 단위

- **일일 평균**: 일별 변동 흡수 어려움 → 단일 일자가 60% 미만이어도 즉시 critical 처리 X
- **권장 측정 단위**: 7일 rolling average (sufficient signal-to-noise)
- **Critical 발동**: 7일 rolling avg가 60% 미만이거나, 단일 일자가 50% 미만 (catastrophic event 가정)

---

## 4. Cohort 분해 가이드 (필수)

단일 평균에 의존하면 false signal 또는 missed signal 발생. 다음 cohort 분해를 권장한다.

### 4.1 lesson sequence cohort

| Cohort | 정의 | 기대 임계 | 사유 |
|---|---|---|---|
| **First lesson** | onboarding 직후 첫 lesson | ≥ 90% | 진입 마찰 X, 호기심 최고. 90% 미만이면 onboarding-to-lesson 갭 의심 |
| **Lesson 2-7** | 첫 주 학습 cohort | ≥ 75% | 본 권고서 default 임계 적용 |
| **Lesson 8+** | 습관 형성 cohort | ≥ 80% | 자기선택 효과 (남아있는 사용자는 유지율 높음) |

### 4.2 Entitlement cohort

| Cohort | 정의 | 기대 임계 | 사유 |
|---|---|---|---|
| **Free** | is_premium=false | ≥ 75% | 무료 한도 도달은 별도 분류 (lesson_started 후 한도 차단은 abandon X) |
| **Premium** | is_premium=true | ≥ 80% | 결제 의지 = 학습 의지. 5%+ 보너스 기대 |
| **Free + 한도 도달** | 한도로 차단된 경우 | 분모/분자에서 제외 | abandon으로 오해 방지 |

### 4.3 Habit formation cohort

| Cohort | 정의 | 기대 임계 |
|---|---|---|
| **Free + first 7 days** | 가입 후 7일 이내 free | ≥ 75% |
| **Free + 8+ days** | 가입 후 8일 이상 free | ≥ 78% (자기선택) |
| **Streak ≥ 7** | 7일 연속 학습 user | ≥ 85% (강한 habit) |

### 4.4 Device / locale cohort (보조)

- iOS vs Android — TTS 엔진 차이, 5%p 이상 격차 발생 시 audio 품질 audit
- 영어권 vs 비영어권 (L1 다양성) — UI 언어 mismatch 시 abandon

---

## 5. False signal 방지 룰

다음 case는 lesson_complete_rate 분모/분자에서 제외하거나 별도 처리:

1. **무료 한도 차단**: `lesson_started` 후 즉시 daily_limit_reached 응답 시 → 분모에서 제외 (또는 별도 cohort `daily_limit_blocked_during_lesson`)
2. **앱 강제 종료 후 재진입 (4h 이내)**: SRS-051 시나리오. 동일 client_attempt_id로 재시도 시 같은 lesson 1회만 카운트
3. **백그라운드 timeout**: lesson_started 후 30분 이상 idle → lesson_abandoned event 별도 emit, complete_rate에서는 제외
4. **신고로 인한 attempt invalidate**: SRS-053 시나리오. 신고된 attempt가 마지막 단계라면 lesson은 abandoned로 분류 X (콘텐츠 결함이지 사용자 문제 X)
5. **iOS background app refresh 차단**: completion event가 다음 foreground에 emit. 24h 내 emit이면 retroactive 카운트

---

## 6. W16 baseline 후 relative 전환 (mean - 1.5σ)

W15-W16은 cold start이므로 absolute 임계 (75% / 60%) 사용. **W16 14일 baseline 회수 후** 다음 식으로 relative 전환 권고:

### 6.1 전환 식

```
healthy_threshold = max(0.70, baseline_mean)
warning_threshold = max(0.55, baseline_mean - 1.0 * baseline_std)
critical_threshold = max(0.45, baseline_mean - 1.5 * baseline_std)
```

- **floor (0.70 / 0.55 / 0.45)**: 학습 약속 차원의 절대 하한. baseline이 떨어지더라도 critical을 0.45 이하로 두지 않음
- **mean - 1.5σ**: 통계적으로 정상 범위 ~93%를 healthy/warning으로 흡수, 하위 ~7%만 critical
- **재산정 주기**: 매월 1회 + 큰 콘텐츠 release (M4 batch 추가) 직후 7일 후 재산정

### 6.2 baseline 회수 절차 (W16, analytics 책임)

1. W15 시작일(2026-05-11) ~ W16 회수일(2026-05-25) 14일 lesson_complete_rate 일별 수집
2. 전체 mean / std + 4.1~4.4 cohort별 mean / std
3. `docs/metrics/BASELINE_M3.md` 작성 (analytics)
4. learning agent review (mean이 75% 미만이면 콘텐츠/UX 회귀 audit + critical 임계 floor 재검토)
5. relative 임계 적용 (W17~)

### 6.3 baseline mean이 design intent보다 낮을 때 (예: mean = 65%)

→ relative 임계만 낮추지 말고 다음을 동시에 수행:
1. learning + content audit (콘텐츠 난이도 / 오디오 품질)
2. UX audit (lesson 진입 마찰)
3. analytics deep dive (어느 단계에서 abandon? Notice / Hear / Meaning / Retrieve 중)
4. 60일 내 design intent (75%) 회복 OKR 설정. 회복 실패 시 lesson 길이/단어 수 조정 (CC2-25 재논의)

---

## 7. release-block 게이트와의 관계

| Gate | Trigger | Owner |
|---|---|---|
| Production release block | lesson_complete_rate 7일 rolling < 60% (전체) OR 단일 일자 < 50% | release manager + learning |
| Cohort-specific block | 무료 cohort < 55% AND Premium cohort 정상 (무료 한도 정책 의심) | learning + payment |
| Soft warning (release 진행) | 60-70% 범위 + 추세 하락 | learning + content audit |
| Rollback trigger | post-release 24h 내 -10%p 이상 하락 | release manager |

**중요**: lesson_complete_rate 자체가 release 차단의 유일 근거가 아님. 다음과 함께 평가:
- crash-free user % (crashlytics)
- TTS error rate
- attempt latency P95

---

## 8. 측정 누락 위험 + 보완

| 위험 | 영향 | 보완 |
|---|---|---|
| iOS background에서 lesson_completed emit 누락 | complete_rate 하향 false signal | 24h retroactive emit 허용 (event_time vs received_time 분리 측정) |
| 네트워크 단절로 emit 실패 | analytics 누락 | 클라이언트 큐 + 재전송 (3회 backoff) |
| 사용자 OS 시계 조작 | local_day_04 boundary 오작동 | 서버 시각 기준 보조 검증 |
| 앱 업데이트 직후 schema mismatch | event drop | event versioning + 하위 호환 (3 버전) |

---

## 9. 검토 / 승인

| Role | 이름 | 상태 |
|---|---|---|
| Learning (작성자) | learning agent | 작성 완료 (2026-05-11) |
| Analytics | analytics agent | review pending — BASELINE_METRICS.md §1 보강 필요 |
| Product (PRD §8 반영) | planner agent | reference 적용 대기 |
| Backend (event emit) | backend agent | non-block (W15 작업 큐 내) |

---

## 10. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-11 | M3 W15 초안 작성 — 3-tier absolute (75/60), cohort 분해 4가지, relative 전환 식, false signal 방지 5룰 |
