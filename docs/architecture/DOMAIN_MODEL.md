# dash2zero — Domain Model

> 작성: architect agent (M1, 2026-05-07)
> 협업 입력: backend (구현), learning (SRS), security (RLS)
> 상위 SSOT: PRD.md (planner), 07_erd_db_design.md v0.3, EVALUATION_SCENARIOS.md, HARNESS_LAYERED_ARCHITECTURE.md
> Skill 사용: software-architecture (5층 패턴) · prompt-engineering · mcp-builder (보류)

---

## 1. 설계 원칙

1. **계약은 백엔드/코어 도메인이 source of truth** (사용자 지시 §10)
2. **모든 엔티티는 Contract Layer(`packages/contracts/`)에 zod 스키마로 정의** — 클라이언트/서버/이벤트 모두 동일 타입 사용
3. **word_id, user_id는 영구 키** — content_version이 변해도 절대 변경 금지 (CC2-15)
4. **SRS 상태와 콘텐츠 상태는 분리** — 콘텐츠 변경 시 학습 진도 보존 (CC3-07)
5. **결제 entitlement는 RC webhook이 server-side 진실 원천** — 클라이언트는 read-only (CC2-08)
6. **모든 변경은 audit_log에 기록** — RLS service_role 경유 변경은 강제 (CC2-03)

---

## 2. 핵심 엔티티 (15개)

### 2.1 사용자 / 인증

| 엔티티 | 핵심 속성 | 비고 |
|---|---|---|
| **User** | id (uuid, PK), auth_provider, email_hash, locale, timezone (IANA), age_attestation_at, created_at, soft_deleted_at | Supabase auth.users.id 그대로 사용 (CC2-06) |
| **AuthProvider** (lookup) | apple, google, email_magic_link | CC-03, CC3-03 |
| **GuestSession** | device_install_id (PK), created_at, merged_to_user_id, merged_at | 게스트 학습 추적, 가입 시 머지 |
| **Profile** | user_id (FK PK), display_name, learning_motivation (kpop/kdrama/travel/other), srs_started_at | onboarding 결과 저장 |

### 2.2 콘텐츠

| 엔티티 | 핵심 속성 | 비고 |
|---|---|---|
| **Word** | word_id (영구 키, PK), korean, romanization (RR), content_version, retired_at, audio_asset_id, created_at | word_id는 절대 불변 (CC2-15, CC3-07) |
| **WordTranslation** | word_id (FK), locale (en-US), gloss, gloss_short (1-5단어), example_ko, example_en, content_version | locale별 번역 분리 |
| **Distractor** | word_id (FK), distractor_word_id (FK), distance_score, content_version | 객관식 4지선다 입력 (CC2-11 정량 룰) |
| **WordPack** | pack_id (PK), name, tier (starter/premium), monthly_release_at, version | Starter 60 / Premium 300 / 매월 50 (CC2-15) |
| **WordPackMember** | pack_id (FK), word_id (FK), order, is_free_sample (CC3-01) | many-to-many |
| **ContentManifest** | manifest_version (PK), pack_id (FK), pack_version, content_hash, words_diff (jsonb), released_at, rolled_back_at | 클라이언트 diff 다운로드 입력 (CC2-15) |
| **AudioAsset** | audio_id (PK), word_id (FK), kind (word/example), provider (TTS), voice_id, audio_url, audio_hash (SHA256), tier (free/premium), license, created_at | hash로 cache invalidation (CC3-04) |

### 2.3 학습 상태

| 엔티티 | 핵심 속성 | 비고 |
|---|---|---|
| **UserWordState** | user_id (FK), word_id (FK), stage (1-5), weak (bool), correct_count, incorrect_count, last_attempt_at, next_due_at, mastered_at, last_seen_content_version | composite PK (user_id, word_id) — server SSOT |
| **LearningAttempt** | attempt_id (uuid PK), user_id (FK), word_id (FK), client_attempt_id (idempotency), correct (bool), question_template_id, content_version_at_attempt, occurred_at (client clock), server_recv_at, device_install_id | append-only (CC-16) |
| **LearningSession** | session_id (PK), user_id (FK), started_at, completed_at, abandoned_at, new_words_count, reviews_count, duration_sec | lesson 단위 (J-001/J-002) |
| **DailyUsage** | user_id (FK), local_day (date), timezone, new_words_started_count, reviews_completed_count, lesson_completed_count, paywall_view_count | composite PK (user_id, local_day) — 04:00 리셋 (CC-17, CC2-07) |

### 2.4 결제 / 권한

| 엔티티 | 핵심 속성 | 비고 |
|---|---|---|
| **SubscriptionEntitlement** | id (PK), user_id (FK), rc_app_user_id, rc_original_app_user_id, rc_customer_id, entitlement_id, product_id, store, environment, status (enum), period_started_at, period_ends_at, grace_period_ends_at, auto_renew_status, ownership_type, last_rc_event_id, last_synced_at | RC webhook이 write-only, 클라이언트 read-only (CC2-08) |
| **EntitlementStatus** (enum) | active, grace_period, billing_retry, expired, refunded, revoked, transferred, cancelled, unknown | CC3-05 |

### 2.5 운영 / 감사

| 엔티티 | 핵심 속성 | 비고 |
|---|---|---|
| **ContentReport** | report_id (PK), word_id (FK), reporter_user_id (FK or device_install_id), category (typo/translation/audio/level/other), description, status (pending/resolved/rejected), reported_at, resolved_at, resolved_by, action (retire/edit/no_action) | J-006 |
| **AccountDeletionRequest** | request_id (PK), user_id (FK), requested_at, scheduled_hard_delete_at, completed_at, exported_at, export_format (json) | 30일 SLA (C-11, J-007) |
| **AuditLog** | log_id (PK), actor (user_id or 'system' or 'service_role'), action, target_table, target_id, before_jsonb, after_jsonb, occurred_at | 운영자 변경 / 보안 위반 / 머지 / 환불 etc. |

---

## 3. 관계 다이어그램 (텍스트)

```
User ─┬─ Profile (1:1)
      ├─ UserWordState (1:N) ─── Word (N:1)
      ├─ LearningAttempt (1:N) ── Word (N:1)
      ├─ LearningSession (1:N)
      ├─ DailyUsage (1:N, by local_day)
      ├─ SubscriptionEntitlement (1:N, history)
      ├─ ContentReport (1:N, reporter)
      └─ AccountDeletionRequest (1:1)

GuestSession ─── (merged_to) ─── User

Word ─┬─ WordTranslation (1:N, by locale)
      ├─ Distractor (N:N self via word_id ↔ distractor_word_id)
      ├─ AudioAsset (1:N, by kind)
      └─ WordPackMember (N:N) ─── WordPack
                                    └─ ContentManifest (1:N, by version)

AuditLog ── (polymorphic) ── 모든 테이블
```

---

## 4. 비즈니스 규칙 (Domain Invariants)

### 4.1 SRS 전이 (CC2-10, CC3-05 기반)

```typescript
function applySrsTransition(state: UserWordState, attempt: LearningAttempt): UserWordState {
  const correct = attempt.correct;
  const cycle = sameDueCycle(state.last_attempt_at, attempt.occurred_at, state.timezone);

  if (correct) {
    return {
      stage: Math.min(5, state.stage + 1),
      weak: false,
      next_due_at: nextDueDate(state.stage + 1, attempt.occurred_at, state.timezone),
      correct_count: state.correct_count + 1,
      mastered_at: stage === 5 ? attempt.occurred_at : state.mastered_at,
    };
  }

  // 오답
  if (cycle && state.last_attempt_correct === false) {
    // 같은 due cycle 2연속 오답 → stage 1 + weak
    return { stage: 1, weak: true, ... };
  }

  // Mastered 보호 (CC3-05): stage 5에서 1회 오답 → stage 4
  // 일반 오답: stage = max(1, stage - 1)
  return {
    stage: state.stage === 5 ? 4 : Math.max(1, state.stage - 1),
    weak: false,
    incorrect_count: state.incorrect_count + 1,
    ...
  };
}

const STAGE_INTERVALS_DAYS = [1, 3, 7, 14, 30]; // CC-08
```

**Invariants:**
- `1 ≤ stage ≤ 5`
- `next_due_at` 계산은 사용자 timezone 04:00 기준 (CC-17)
- `attempts append-only` — 절대 update/delete 금지 (CC-16)
- Mastered (stage=5) 도달 후에도 30일 maintenance review만 (CC2-09)

### 4.2 Daily Usage (CC2-07)

```typescript
function checkDailyLimit(user: User, action: 'new_word' | 'review'): boolean {
  const localDay = currentLocalDay(user.timezone, '04:00');
  const usage = getOrCreateDailyUsage(user.id, localDay);
  const entitlement = getActiveEntitlement(user.id);
  const limits = entitlement?.status === 'active' || entitlement?.status === 'grace_period'
    ? { new_word: 15, review: Infinity }   // Premium
    : { new_word: 3, review: 20 };          // Free

  if (action === 'new_word') return usage.new_words_started_count < limits.new_word;
  if (action === 'review') return usage.reviews_completed_count < limits.review;
}
```

**Invariants:**
- 한도 초과 시 paywall 트리거 (J-002)
- 04:00 경계 직전 미완료 lesson은 익일로 이월 (CC3-08)

### 4.3 Entitlement 매핑 (CC2-08, CC3-05)

| RC webhook | Status 매핑 | Premium 권한 |
|---|---|---|
| INITIAL_PURCHASE / RENEWAL | active | yes |
| BILLING_ISSUE + grace_period_ends_at | grace_period | yes (until grace_ends) |
| BILLING_ISSUE 단독 | billing_retry | yes 24h만, 이후 free |
| EXPIRATION | expired | no |
| REFUND | refunded | no (즉시) |
| REVOKE | revoked | no |
| TRANSFER | transferred | 새 user_id로 active |
| CANCELLATION + will_renew=false | cancelled | yes (period_ends_at까지) |
| (스키마 외) | unknown | no (안전 강등) |

**Invariants:**
- `last_rc_event_id`로 멱등 (동일 이벤트 재전송 무시)
- 클라이언트는 entitlement 직접 write 불가 (RLS)
- 환불/만료 시에도 학습 데이터(UserWordState, LearningAttempt)는 보존 (CC3-05)

### 4.4 게스트 머지 (CC2-04, CC2-06)

```typescript
async function mergeGuestData(userId: string, deviceInstallId: string, idempotencyKey: string): Promise<MergeResult> {
  return await db.transaction(async (tx) => {
    // 1. idempotency 체크
    if (await tx.merge_jobs.exists({ idempotency_key: idempotencyKey })) {
      return cachedResult;
    }

    // 2. attempts append (idempotent by client_attempt_id)
    await tx.learning_attempts.upsert(guestAttempts, ['client_attempt_id']);

    // 3. user_word_states 재계산 (max stage + max correct_count + earliest next_due)
    const conflicts = await reconcileUserWordStates(tx, userId, guestStates);

    // 4. profile.merged_at 기록
    await tx.profiles.update({ user_id: userId }, { merged_at: new Date() });

    // 5. audit_log
    await tx.audit_log.insert({ action: 'guest_merge', actor: userId, before_jsonb: ..., after_jsonb: ... });

    return { success: true, conflicts };
  });
}
```

**Invariants:**
- 단일 트랜잭션 (부분 실패 → 전체 롤백)
- `client_attempt_id`로 attempts dedup
- 충돌 시 `server.stage = max(server.stage, guest.stage)`
- 머지 후 `device_install_id`는 `merged_to_user_id` 기록만 보존, 학습 데이터 출처 표시

---

## 5. 5층 하네스 Layer 매핑

각 엔티티는 5층 중 어느 layer에 어떻게 노출되는가.

| 엔티티 | Contract | Policy | Retrieval | Evaluation | Observability |
|---|---|---|---|---|---|
| User | `user.schema.ts` | RLS owner-only | `getCurrentUser()` | - | login event |
| Word + Translation + Distractor | `word.schema.ts` | published read-only | `getNextWords()`, `getWord()` | content 11 case | manifest fetch trace |
| AudioAsset | `audio.schema.ts` | tier-based access (free public, premium signed URL) | `getAudioUrl()` | content 11 (audio_hash) | audio play latency |
| UserWordState | `user_word_state.schema.ts` | RLS owner-only, server SSOT | `applySrsTransition()` | SRS 50 golden | mastered count |
| LearningAttempt | `learning_attempt.schema.ts` | append-only, idempotent | `recordAttempt()` (batch) | SRS 50 (attempts → state) | session duration |
| DailyUsage | `daily_usage.schema.ts` | server SSOT, RLS owner-only | `checkDailyLimit()` | (no golden, 단위 테스트) | paywall trigger |
| SubscriptionEntitlement | `entitlement.schema.ts` | client read-only / webhook write | `getEntitlement()` | 결제 9 + 6 adversarial | conversion funnel |
| ContentManifest | `manifest.schema.ts` | published read-only | `getManifestDiff()` | content 11 | manifest version |
| ContentReport | `content_report.schema.ts` | reporter or owner / staff resolve | `submitReport()` | (no golden) | report rate |
| AuditLog | `audit_log.schema.ts` | service_role write only | `logAction()` | (no golden) | security alert |

---

## 6. Contract 패키지 구조 (M1 후반 구현)

```
packages/contracts/
├── package.json                  # @dash2zero/contracts
├── tsconfig.json
├── src/
│   ├── index.ts                  # 모든 schema export
│   ├── user/
│   │   ├── user.schema.ts        # zod schema
│   │   ├── profile.schema.ts
│   │   └── auth.schema.ts
│   ├── content/
│   │   ├── word.schema.ts
│   │   ├── audio.schema.ts
│   │   ├── manifest.schema.ts
│   │   └── pack.schema.ts
│   ├── learning/
│   │   ├── user_word_state.schema.ts
│   │   ├── learning_attempt.schema.ts
│   │   ├── learning_session.schema.ts
│   │   └── daily_usage.schema.ts
│   ├── billing/
│   │   ├── entitlement.schema.ts
│   │   ├── revenuecat_webhook.schema.ts
│   │   └── status.enum.ts
│   ├── ops/
│   │   ├── content_report.schema.ts
│   │   ├── account_deletion.schema.ts
│   │   └── audit_log.schema.ts
│   └── analytics/
│       └── events.schema.ts      # snake_case object_action 이벤트 (CC2-22, CC2-24)
└── test/
    └── *.spec.ts                 # zod parse 통과/실패 케이스
```

**버전 관리 규칙:**
- semver `0.x.y` until M5 (breaking change 자유)
- M5 이후 `1.x.y` (breaking change → ADR + migration)
- 모든 schema 변경은 `CHANGELOG.md` 갱신 (changelog-generator)

---

## 7. 교체 가능성 (사용자 지시 §2 경계면 추상화)

| 추상화 | 현재 (M1 잠정) | 교체 후보 |
|---|---|---|
| Auth | Supabase Auth + Apple/Google/Magic Link | Auth0 / Clerk / 자체 OAuth |
| Database | Supabase Postgres | 자체 Postgres (RDS/Neon) / Firestore |
| Storage | Supabase Storage | S3 / R2 / CloudFront |
| Queue / Background | Edge Functions (단순) | Inngest / BullMQ / SQS |
| Model Provider (TTS) | Google / Azure / Naver Clova / ElevenLabs (M1 미정) | 교체 시 audio_assets.provider 컬럼만 변경 |
| Observability | Crashlytics + Firebase Analytics | + Langfuse / Sentry / Datadog |
| Billing | RevenueCat | Stripe (post-MVP, 자체 결제 시) |
| Search / Vector | (현재 미사용) | post-MVP — 단어 검색 시 Postgres FTS |
| Notification | FCM / APNs (Expo Notifications) | OneSignal / Pusher |

각 추상화는 Contract Layer에서 인터페이스로 노출 → 도구 변경 시 인터페이스만 보존.

---

## 8. ADR 연결

| ADR | 결정 | 영향 받는 엔티티 |
|---|---|---|
| ADR-0001 | 기술 스택 (Lean / Balanced / Scale) | 모두 |
| ADR-0002 | Domain Model 경계면 추상화 범위 (Contract Layer) | Auth, Storage, Provider |
| ADR-0003 | Harness 도구 선택 | AuditLog, Observability |
| ADR-0004 | RLS 정책 매트릭스 | 모든 테이블 |

---

## 9. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-5 v1.0 작성 — 15 엔티티 + 4 비즈니스 규칙 + 5층 매핑 + Contract 패키지 구조 + 교체 가능성 9개 | architect |
