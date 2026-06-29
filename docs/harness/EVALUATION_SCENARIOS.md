# dash2zero — Evaluation Scenarios (Harness Input)

> 작성: analytics agent (D-006로 사전 활성화, 2026-05-07)
> 협업: learning (SRS), backend (결제), security (privacy), qa (회귀 케이스)
> 목적: 하네스 Evaluation Layer가 매 빌드/사이클마다 검증할 시나리오의 SSOT
> 위치: M3 evaluation runner는 본 문서를 입력으로 `fixtures/golden/`, `fixtures/adversarial/`로 전개

---

## 1. 평가 철학

dash2zero는 LLM-heavy 서비스가 아니라 **결정론적 학습 알고리즘 + 콘텐츠 데이터** 중심이다. 따라서 평가는:

- **Golden case** (정답이 미리 정해진 입력→출력) 비율이 높음
- **Adversarial case** (의도적 우회/실패 케이스) 비율은 보안과 결제에 집중
- **A/B / experiment**는 MVP 후 가격·페이월·온보딩에 한정

평가는 다음 4개 축으로 나눈다:

1. **SRS 정확성** (Learning Core)
2. **결제 상태 무결성** (Monetization)
3. **Privacy / Consent 게이팅** (Security)
4. **콘텐츠 manifest 무결성** (Content Pipeline)

---

## 2. SRS Golden Case (50개 — learning + analytics 공동 작성)

### 2.1 알고리즘 핵심 (CC-08, CC2-10, CC3-05 결정 반영)

| 결정 | 적용 |
|---|---|
| Leitner 5단계 / 1·3·7·14·30일 | base interval table |
| 오답 시 `next_stage = max(1, current - 1)` | 기본 강하 |
| Mastered(5) 1회 오답 → stage 4 | Mastered 보호 |
| 같은 due cycle 2회 연속 오답 → stage 1 + weak=true | 정체 단어 식별 |
| 04:00 로컬 리셋 | day boundary |

### 2.2 Golden Case 분포 (50개)

| 카테고리 | 개수 | 대표 케이스 |
|---|---:|---|
| stage 전이 (정답) | 10 | stage 1→2, 2→3, 3→4, 4→5(Mastered), 각 단어 형태 |
| stage 전이 (오답) | 10 | stage 2→1, 3→2, 4→3, 5→4, 1→1 (이미 최저) |
| 같은 cycle 2연속 오답 | 5 | stage 3 → stage 1 + weak=true, due 즉시 |
| Mastered 보호 | 3 | stage 5 1회 오답 → stage 4, 5 2연속 오답 → stage 1 + weak |
| 04:00 경계 | 5 | 23:55 학습→04:00 직전 미완료/완료 차이, streak 처리 |
| 타임존 변경 | 3 | 비행 후 사용자 timezone 변경, 같은 달력일 두 번 시작 방지 |
| 멀티 디바이스 | 4 | A에서 stage 3, B에서 stage 4 동시 → server max 채택 |
| 게스트→가입 머지 | 3 | 게스트 stage 2, 서버 stage 1 → max=2 + attempts append |
| 콘텐츠 retire | 3 | 학습 중인 단어 retire 시 user_word_states 보존 + 큐 제외 |
| 일일 한도 (무료/Premium) | 4 | 무료 일일 3 진입 후 차단, Premium 15 진입 후 차단, paywall 트리거 |

### 2.3 Golden Case 양식 (예시)

```yaml
# fixtures/golden/srs/SRS-001.yaml
id: SRS-001
description: stage 1 정답 → stage 2, due+3일
input:
  user_id: u-test-001
  word_id: w-001
  current_stage: 1
  current_due: 2026-05-07T04:00:00+09:00
  attempt:
    correct: true
    occurred_at: 2026-05-07T10:00:00+09:00
expected:
  next_stage: 2
  next_due: 2026-05-10T04:00:00+09:00
  weak: false
  user_word_state:
    correct_count: 1
    incorrect_count: 0
```

### 2.4 검증 방법

- M2: 단위 테스트로 SRS 함수 직접 검증
- M3: evaluation runner가 50개 case 일괄 실행 → baseline 대비 회귀 시 halt
- baseline metric: 50/50 통과율 = 100% (단 1건이라도 실패 시 halt)

---

## 3. 결제 상태 매트릭스 (9 상태 × 회귀 케이스)

CC-08, CC3-05 결정 반영. RevenueCat webhook 이벤트 → entitlement 매핑.

### 3.1 9 상태 매트릭스

| State | Webhook 이벤트 | grace_period | entitlement | 학습 데이터 보존 |
|---|---|---|---|---|
| `active` | INITIAL_PURCHASE / RENEWAL | - | active | yes |
| `grace_period` | BILLING_ISSUE + grace_period_ends_at 존재 | yes (스토어 제공값) | active until grace_ends | yes |
| `billing_retry` | BILLING_ISSUE 단독 (grace 없음) | no | active 24h만, 이후 free | yes |
| `expired` | EXPIRATION | - | free | yes |
| `refunded` | REFUND | - | free 즉시 | yes (Mastered/SRS 유지) |
| `revoked` | REVOKE | - | free 즉시 | yes |
| `transferred` | TRANSFER | - | 새 user_id로 active 이전 | 새 user_id로 머지 |
| `cancelled (will_renew=false)` | CANCELLATION | - | period_ends_at까지 active | yes |
| `unknown` | (스키마 외) | - | error log + 안전 강등 (free) | yes |

### 3.2 Adversarial 케이스 (`fixtures/adversarial/payment/`)

| Case ID | 시나리오 | 기대 결과 |
|---|---|---|
| PAY-ADV-001 | 동일 webhook 이벤트 재전송 | last_rc_event_id로 중복 무시 (멱등) |
| PAY-ADV-002 | 환불 후 재구매 | 학습 데이터 그대로 + active 복원 |
| PAY-ADV-003 | grace 중에 사용자가 결제 정보 갱신 | active 유지 + grace_period_ends_at 클리어 |
| PAY-ADV-004 | RevenueCat webhook 시그니처 위조 | 401 거부 + audit_log + alert |
| PAY-ADV-005 | 게스트 상태에서 IAP 시도 | 차단 (CC2-06: 인증 사용자만 결제) |
| PAY-ADV-006 | 가족 공유 활성 시도 | 차단 (CC2-09: 가족공유 비활성) |

### 3.3 검증 방법

- M3: webhook 시뮬레이터로 9 상태 + 6 adversarial = 15 case 실행
- baseline: 15/15 통과 + entitlement DB 상태 일관성

---

## 4. Privacy / Consent Evaluation

CC2-05, CC2-18, CC3-04 반영.

### 4.1 First-run 흐름 검증

| Case | 검증 |
|---|---|
| PRIV-001 | 앱 첫 실행 시 age gate가 분석 동의보다 먼저 표시됨 |
| PRIV-002 | age gate 통과 전 Firebase Analytics setEnabled = false 유지 |
| PRIV-003 | privacy choices에서 비필수 분석 거부 시 운영 필수 이벤트만 전송 |
| PRIV-004 | onboarding 진입 전 privacy choices 완료 강제 |

### 4.2 13세 미만 차단 회귀

| Case | 검증 |
|---|---|
| AGE-001 | age gate에서 under-13 선택 시 계정 생성/학습/결제/분석 모두 차단 |
| AGE-002 | 게스트 상태에서도 under-13 차단 |
| AGE-003 | 디바이스 재시도(생년월일 변경) 시 lockout (CC2-14 권고) |

### 4.3 UK 13–17세 처리 (CC2-05)

| Case | 검증 |
|---|---|
| UK-001 | UK 거주자 13–17세는 비필수 분석 default OFF |
| UK-002 | 마케팅 push 차단 (학습 리마인더는 허용) |
| UK-003 | geolocation 미수집 |

### 4.4 검증 방법

- M2: 단위 테스트로 게이트 함수 검증
- M3: Detox/Maestro E2E로 first-run 시퀀스 검증
- baseline: 11/11 통과

---

## 5. Content Manifest Validation

CC2-15, CC3-04, CC3-07 반영.

### 5.1 Schema 무결성

| Case | 검증 |
|---|---|
| CONTENT-001 | manifest.words[].audio_hash가 Storage 실제 파일 SHA와 일치 |
| CONTENT-002 | word_id가 영구 키 (content_version 변경에도 불변) |
| CONTENT-003 | distractor 3개가 동일 pack/품사 + 의미 거리 임계값 충족 |
| CONTENT-004 | romanization이 RR 표준 일치 (받침/격음/경음 룰) |

### 5.2 Pack 다운로드 무결성 (CC3-04)

| Case | 검증 |
|---|---|
| PACK-001 | Starter Pack 60단어는 public bucket 접근 |
| PACK-002 | Premium pack은 entitlement 검증 후 signed URL TTL 6시간 |
| PACK-003 | signed URL 만료 시 클라이언트가 manifest 재요청 |
| PACK-004 | content rollback 시 캐시 무효화 |

### 5.3 검수 워크플로우 회귀 (CC3-07)

| Case | 검증 |
|---|---|
| REVIEW-001 | published 콘텐츠는 작성자/검수자 분리 (audit_log 기록) |
| REVIEW-002 | AI 검증 통과 + 사람 pass/fail 모두 통과해야 publish |
| REVIEW-003 | 콘텐츠 신고 → retire 처리 시 학습자 SRS 보존 |

### 5.4 검증 방법

- M2: schema validator (zod / pydantic)
- M3: evaluation runner가 manifest fetch → hash 검증 → signed URL 흐름 일괄 실행
- baseline: 11/11 통과

---

## 6. 평가 SLO (M3 baseline)

| Layer | Metric | Target | Halt Threshold |
|---|---|---|---|
| SRS | Golden 통과율 | 100% (50/50) | < 100% (1건이라도) |
| 결제 | 9 상태 + 6 adversarial 통과율 | 100% (15/15) | < 100% |
| Privacy | 11 case 통과율 | 100% | < 100% |
| Content | 11 case 통과율 | 100% | < 100% |
| 전체 | E2E 핵심 시나리오 (lesson 1회 완료) | < 3분 | > 3분 (CC2-25 약속 위반) |

위 SLO는 M3 evaluation runner가 매 PR/매일 실행. halt 시 머지 차단 + alerting.

---

## 7. M3 진입 시 산출물

본 시나리오 윤곽이 채워지면 M3에서 다음을 구현:

- `scripts/eval/runner.ts` — golden + adversarial 일괄 실행
- `scripts/eval/srs.ts`, `payment.ts`, `privacy.ts`, `content.ts` — 영역별 evaluator
- `fixtures/golden/{srs,payment,privacy,content}/` — YAML case 파일
- `fixtures/adversarial/{payment,privacy}/` — 적대적 시나리오
- (선택) Langfuse experiment integration

---

## 8. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | D-006으로 analytics 사전 활성화 + 1차 시나리오 윤곽 (SRS 50 + 결제 15 + privacy 11 + content 11 = 87 case) | analytics |
