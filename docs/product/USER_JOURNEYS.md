# dash2zero — User Journeys

> 작성: planner agent (M1, 2026-05-07)
> 협업 입력: designer (Direction), architect (Domain Model)
> 위치: 본 문서는 5층 하네스의 Evaluation Layer가 검증할 E2E 시나리오의 SSOT
> 연결: PRD §4 / EVALUATION_SCENARIOS.md / 06_feature_spec.md (v0.3)

---

## 1. Journey 분류

5개 핵심 + 3개 보조 = 총 8개. 각 journey는 **시작 → 분기 → 끝** 형태로 정의.

| ID | Journey | 분류 | 우선순위 |
|---|---|---|---|
| J-001 | 신규 사용자 첫 학습 | 핵심 | P0 (M2 thin vertical slice) |
| J-002 | 매일 3분 루틴 (재방문) | 핵심 | P0 |
| J-003 | Free → Premium 결제 | 핵심 | P0 |
| J-004 | 게스트 → 가입 전환 | 핵심 | P0 |
| J-005 | 환불 / 만료 / Free 강등 | 핵심 | P0 |
| J-006 | 콘텐츠 신고 → 운영자 처리 | 보조 | P1 |
| J-007 | 계정 삭제 + 데이터 내보내기 | 보조 | P1 (CC-11) |
| J-008 | 디바이스 변경 (multi-device 동기화) | 보조 | P1 |

---

## 2. J-001: 신규 사용자 첫 학습 (P0 — M2 thin vertical slice)

### 2.1 흐름

```
앱 실행
  ↓
[Age Gate]
  - "Are you 13 or older?" 단일 질문 (CC2-14: 무결성 보강)
  - under-13 선택 → 차단 화면 (재시도 lockout 24h)
  - 13+ 선택 → 다음
  ↓
[Privacy Choices] (CC2-18)
  - "Allow analytics?" toggle (default OFF — UK Children's Code 13–17 처리 포함)
  - "Allow crash diagnostics?" toggle (default OFF)
  - 비필수 동의는 거부해도 진행 가능
  ↓
[Onboarding]
  - 한국어 학습 동기 선택 (K-pop / K-drama / 여행 / 기타)
  - "Start learning" CTA (가입 강제하지 않음 — 게스트 모드 진입)
  ↓
[Home — Today]
  - "Today's words: 3 new + N reviews" 표시
  - "Start" 탭
  ↓
[Lesson — 단어 카드 4단계 × 3개 = 12 step]
  - Notice → Hear → Meaning → Retrieve (객관식 4지선다)
  - 정답/오답 시 SRS stage 적용
  ↓
[Lesson Complete]
  - "3 words learned" + Streak 1 표시
  - "Come back tomorrow" CTA
```

### 2.2 KPI

- 측정: First lesson completion rate
- baseline 목표: ≥ 60% (PRD §8)
- 측정 이벤트: `app_open` → `age_gate_completed` → `privacy_choices_completed` → `onboarding_completed` → `lesson_started` → `lesson_completed`

### 2.3 분기 / 실패

| 분기 | 처리 |
|---|---|
| under-13 차단 | 화면 정지 + "We can't offer dash2zero to users under 13" + 24h device lockout |
| 분석 거부 | 운영 필수 이벤트만 송신 (CC3-04) |
| 게스트 lesson 중단 | partial state 로컬 저장, streak 미증가 |
| 네트워크 오프라인 | Starter Pack 캐시 자료로 진행, attempts append-only 큐 |

### 2.4 E2E 시간 약속

- App open → Lesson Complete: < 3분 (CC2-25, PRD §2)
- 측정: Detox/Maestro 자동 시연 (M3)

---

## 3. J-002: 매일 3분 루틴 (P0)

### 3.1 흐름

```
[Push Notification or 직접 실행]
  ↓
[Home — Today]
  - "Today: 3 new + 7 reviews"
  - 04:00 로컬 리셋 직후라면 fresh count
  - Streak: 5 days
  ↓
[Lesson]
  - 신규 3 + 복습 7 = 10 step
  - 각 단어는 SRS due 우선순위 큐에서 fetch
  ↓
[Lesson Complete]
  - Mastered N개 / Streak 6 days
  - "See you tomorrow"
```

### 3.2 KPI

- D1 / D7 / D30 retention
- 측정: 사용자 로컬 timezone 04:00 기준 calendar day 정의 (Firebase Analytics + BigQuery — CC2-23 후 도입)

### 3.3 분기

| 분기 | 처리 |
|---|---|
| 04:00 리셋 직전 lesson 미완료 | 익일로 이월, streak 미증가 (CC3-08) |
| 무료 일일 3 한도 도달 | paywall 트리거 (Premium pack 무료 샘플 10개 preview pool — CC3-01) |
| 복습 큐 비어있음 | "Great job, no reviews due!" 표시 |

---

## 4. J-003: Free → Premium 결제 (P0)

### 4.1 흐름

```
[Paywall 트리거]
  - 일일 한도 도달 / Premium pack 클릭 / Settings에서 Upgrade
  ↓
[Paywall 화면]
  - $4.99/mo 또는 $49.99/yr 표시 (D-018 봉인 2026-05-13, Annual 약 16% off)
  - 자동갱신 24시간 전 알림 명시 (CC3-05 강행규정 단서구)
  - 가족 공유 비활성 사전 고지 (CC2-09 / Q-PL-NEW-005)
  - "Restore Purchases" 버튼 (CC2-09)
  ↓
[로그인 강제 (게스트면)]
  - Apple Sign In / Google / Email magic link (CC-03, CC3-03)
  - 로그인 후 RevenueCat appUserID = auth.users.id (CC2-06)
  ↓
[App Store/Google IAP 시트]
  - 사용자 결제 완료
  ↓
[RC webhook → Edge Function]
  - subscription_entitlements row insert/update (CC2-08)
  - status: active, period_ends_at, will_renew=true
  ↓
[클라이언트 entitlement 갱신]
  - Premium 기능 즉시 활성화
  - "Welcome to Premium!" 토스트
```

### 4.2 KPI

- Free → Paid conversion rate
- Paywall view → purchase 전환율 (source 별: free_limit_reached / premium_pack_locked / settings_upgrade)

### 4.3 분기 / 실패

| 분기 | 처리 |
|---|---|
| 결제 취소 | paywall 복귀 + `checkout_cancelled` 이벤트 |
| 결제 실패 | "Payment failed" 안내 + retry CTA |
| 게스트 상태 결제 시도 | 차단 (CC2-06: 인증 사용자만) → 로그인 화면 |
| Restore: 기존 구독 발견 | entitlement 즉시 active 부여 |
| Restore: 구독 없음 | "No purchases to restore" 안내 |
| RC webhook 지연 (5초+) | 클라이언트는 polling 또는 RC SDK 직접 조회 |

---

## 5. J-004: 게스트 → 가입 전환 (P0)

### 5.1 흐름

```
[게스트 학습 진행 중]
  - 로컬 SQLite에 user_word_states 누적
  - device_install_id 기준
  ↓
[가입 트리거]
  - paywall 클릭 / Settings "Sign up" / 30일 게스트 한도 (선택)
  ↓
[로그인 화면]
  - Apple Sign In / Google / Email magic link
  ↓
[Edge Function: mergeGuestData]
  - 단일 SQL 트랜잭션 (CC2-04)
  - idempotency-key: device_install_id + merge_token
  - 충돌 해결: server_max(stage), attempts append-only union
  - profile.merged_at 기록
  ↓
[클라이언트]
  - 머지 성공 토스트
  - 학습 진도 그대로 유지
```

### 5.2 KPI

- 게스트 → 가입 전환율
- 머지 실패율 (목표 < 1%)

> **W14 evaluator 미포함 → W15-W16 추가 검증 표기 (2026-05-11 planner 결정)**:
> J-004 게스트→가입 머지는 W14 4종 evaluator (Payment / Privacy / Content / SRS) 어디에도 포함되지 않음.
> W15-W16 동안 다음 두 채널로 추적 가능성을 검증:
> 1. **analytics 채널**: `guest_merge_started` / `guest_merge_succeeded` / `guest_merge_failed{reason}` 이벤트 송신 — Firebase funnel로 머지 실패율 측정
> 2. **backend 채널**: `audit_log.action='guest_merge'` row insert + `merge_conflicts_resolved` count 필드 — Supabase에서 직접 query
> M4 진입 시점에 머지 evaluator 신설 여부를 별도 ADR로 결정.

### 5.3 분기 / 실패

| 분기 | 처리 |
|---|---|
| 충돌 발생 (server stage > guest stage) | server stage 채택, audit_log 기록 |
| 머지 트랜잭션 실패 | retry (idempotency-key로 멱등 보장), 3회 실패 시 사용자에게 보고 |
| 동일 계정에 다른 device 게스트 데이터 존재 | 둘 다 머지 (attempts union) |
| 게스트가 결제 시도 | 차단 → 로그인 → 머지 → 결제 (J-003 흐름 합류) |

---

## 6. J-005: 환불 / 만료 / Free 강등 (P0)

### 6.1 흐름

```
[RevenueCat webhook 수신]
  - 이벤트 종류: REFUND / EXPIRATION / REVOKE / BILLING_ISSUE / CANCELLATION
  ↓
[Edge Function: handleRevenueCatWebhook]
  - 시그니처 검증 (위변조 거부)
  - last_rc_event_id로 멱등 체크
  - status enum 매핑 (CC2-08)
    - REFUND → status='refunded'
    - EXPIRATION → status='expired'
    - REVOKE → status='revoked'
    - BILLING_ISSUE + grace_period_ends_at → status='grace_period'
    - BILLING_ISSUE 없음 → status='billing_retry' (24h grace 후 강등 — CC3-05)
    - CANCELLATION (will_renew=false) → status='cancelled', period_ends_at까지 active
  ↓
[entitlement 갱신]
  - active vs grace_period vs free 분기
  ↓
[클라이언트]
  - 다음 화면 진입 시 entitlement 조회
  - Premium 기능 차단
  - 학습 데이터/Mastered/SRS는 보존 (CC3-05)
  - paywall 트리거에서 "Reactivate" CTA
```

### 6.2 KPI

- Refund rate, churn rate, grace recovery rate

### 6.3 분기 / 실패

| 분기 | 처리 |
|---|---|
| webhook 시그니처 위조 시도 | 401 + audit_log + alert |
| 동일 event_id 재전송 | 멱등 무시 |
| RC webhook 누락 (네트워크 장애) | 클라이언트 RC SDK 직접 polling이 fallback |
| 환불 직후 재구매 | active 즉시 복원, 학습 데이터 그대로 |

---

## 7. 보조 Journey 요약

### 7.1 J-006: 콘텐츠 신고 → 운영자 처리 (P1)

```
[단어 카드 메뉴 → "Report this word"]
  ↓ 5종 카테고리 (typo / translation / audio / level / other)
[content_reports row insert]
  ↓
[운영자 (Owner)]
  - 어드민 시트에서 신고 확인 (CC2-15: 콘텐츠 50단어 batch 운영 + audit_log)
  - retire 처리 또는 수정
  ↓
[학습자 SRS 보존]
  - retired 단어는 큐에서 제외
  - user_word_states는 보존 (CC3-07)
```

### 7.2 J-007: 계정 삭제 + 데이터 내보내기 (P1, F-010 M4 W15)

```
[Settings → Delete account]
  ↓ 확인 다이얼로그 + 데이터 내보내기 옵션 (JSON)
  ↓ "Type DELETE to confirm" + 보존 항목 고지 (결제/세무 30일+, 비식별화)
[Edge Function: deleteAccount]
  1. DSR export 생성 (JSON, signed URL TTL 24h) — 사용자 요청 시
  2. RevenueCat alias 삭제 (CC2-08, M4 W15 신규 명세):
     - DELETE /v1/subscribers/{appUserID}/attributes (alias unbind)
     - DELETE /v1/subscribers/{appUserID} (subscriber 자체 삭제)
     - 실패 시 retry 3회 (exponential backoff) → 실패 audit_log + manual queue
  3. Supabase user soft-delete (auth.users.deleted_at SET)
  4. user_word_states / streak / daily_usage 즉시 hard-delete
  5. 30일 후 hard-delete cron (auth.users row 완전 삭제)
  6. 결제/세무 보존 데이터: sha256(user_id+salt) 비식별화 (CC2-11) — refund/tax audit용
  7. audit_log row insert (actor=user, action=account_delete, rc_status, sla_30d_due_at)
  ↓
[클라이언트]
  - 즉시 로그아웃
  - "Your account will be permanently deleted within 30 days. We have emailed your data export."
  - 30d SLA exception 시나리오: cron 실패 → on-call alert + 사용자 안내 메일
```

#### 7.2.1 RC alias 삭제 분기

| 분기 | 처리 |
|---|---|
| RC subscriber not found | 성공으로 간주 (멱등) |
| RC 5xx 응답 | retry queue 등록, 30d SLA cron이 재시도 책임 |
| 활성 구독 보유 사용자 | 환불 자동 트리거 안 함. 안내 메시지: "Active subscription will continue until period ends or you cancel in App Store" |

### 7.3 J-008: 디바이스 변경 (multi-device 동기화) (P1)

```
[새 디바이스에서 로그인]
  ↓
[서버에서 user_word_states / entitlement / streak 동기화]
  - server SSOT (CC-04, CC2-07)
  - last_seen_at + device_install_id 갱신
  ↓
[학습 재개]
  - 기존 SRS 큐 그대로
  - 일일 한도는 daily_usage 서버 SSOT (CC2-07)
```

---

## 8. Journey × Layer 매핑 (5층 하네스)

| Journey | Contract | Policy | Retrieval | Evaluation | Observability |
|---|---|---|---|---|---|
| J-001 첫 학습 | 분석 이벤트 schema | age gate / privacy 게이팅 | content manifest fetch | golden 11 (privacy + content) | first lesson trace |
| J-002 매일 루틴 | API request | daily_usage 한도 | SRS getNextWords | golden 50 (SRS) | retention KPI |
| J-003 결제 | RC webhook payload | 인증 사용자만 | entitlement 조회 | golden 9 (결제 상태) | paywall funnel |
| J-004 머지 | 머지 페이로드 | 인증 + idempotency | merge transaction | golden 5 (머지) | merge 실패율 |
| J-005 환불 | RC webhook | webhook 시그니처 | status 매핑 | golden 6 (환불 + adversarial) | refund rate |

8개 journey 모두 Evaluation Layer의 87 golden case로 검증된다.

---

## 9. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-2 v1.0 작성 — 5 핵심 + 3 보조 = 8 journey + 5층 매핑 | planner |
| 2026-05-11 | M3 W15 — J-007 RC alias 삭제 흐름 7단계 + 30d SLA exception 명세 / J-004 W14 evaluator 미포함 → W15-W16 analytics+backend 채널 추가 검증 표기 | planner |
