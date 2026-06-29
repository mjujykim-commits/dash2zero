# Seed Scripts — Synthetic Baseline (M3 W15)

> 책임: **devops** (M3 W15) — analytics agent의 `scripts/baseline/queries.sql` view가 동작하는 표면을 보장하기 위한 합성 데이터 seed.
>
> 범위: **Supabase staging 전용**. dev/local 도 허용. **prod 절대 금지** (스크립트 내 `assertNotProd()` 가드).
>
> real-user 수집(dogfood + closed beta)은 **M5 이연**. W15에는 합성 데이터 + 1인 dogfood 1 계정만.

---

## 0. 한 줄 요약

```bash
pnpm tsx scripts/seed/synthetic-baseline.ts \
  --supabase-url=https://<staging-project>.supabase.co \
  --service-role-key=<key> \
  --users=200 --days=14 --seed=20260511 \
  --cohort-label=synth_20260511_dev
```

분포 14일분 200명 cohort 삽입. 동일 `--cohort-label`로 재실행 시 멱등 (기존 행 제거 후 재삽입).

---

## 1. 사용 시점 / 사용 안 하는 경우

| 시점 | 사용? | 사유 |
|---|---|---|
| analytics agent가 baseline view 작성 직후 (W15) | **YES** | view smoke + funnel 표면 확인 |
| RLS evaluator nightly 통과 후 manual eval-nightly dispatch | YES | adversarial fixture와 무관, 부수효과 없음 |
| M4 dogfood 사용자 실제 데이터 수집 시작 | **NO** | 합성 데이터가 dashboard 신호 오염 — `synth_*` cohort 제거 후 실데이터만 사용 |
| prod 환경 | **금지** | 호스트명에 `staging|stg|dev|local` 없으면 abort. `ALLOW_NON_STAGING=1` 강제 통과는 책임 호출자 |

---

## 2. 분포 가설 (DEFAULT_DIST)

> devops 자율 결정. real-user 수치가 나오면 교체 예정. 분포 변경은 commit 메시지에 `[seed-dist]` prefix 부여하여 추적.

| 단계 | 비율 | 근거 |
|---|---:|---|
| `lesson_started` of signup | 100% | 정의상 onboarding 직후 1회 |
| `lesson_completed` of started (Day 0) | 65% | 일반 학습 앱 D0 completion rate band 60-70% |
| `word_mastered` 1+ of completed | 40% | stage 5 도달은 며칠 누적 필요 — Day 0에는 보수적 추정 |
| `paywall_viewed` of started | 30% | lesson 3회 또는 7일차 trigger 가정 |
| `purchase` of paywall | 4% | 학습 앱 free→paid 글로벌 band 2-6% 중간 |
| Day 1 retention (return) | 65% | M3 baseline 가설 |
| Day 3 retention | 40% | 게이트 핵심 지표 |
| Day 7 retention | 22% | 보조 |
| Day 1 streak (complete day 1) | 50% | streak 유지율 |

**경고**: 본 분포는 가설이며 실제 신호 아님. M3 게이트 결정에는 **합성 수치를 절대 사용하지 말 것**. 합성은 *파이프라인 정상성* 검증용.

---

## 3. 명령 옵션

| 플래그 | 기본값 | 설명 |
|---|---|---|
| `--supabase-url=` | `$SUPABASE_URL` | staging 프로젝트 URL. prod 식별 시 abort |
| `--service-role-key=` | `$SUPABASE_SERVICE_ROLE_KEY` | seed 삽입 = RLS 우회 필요 |
| `--users=` | 200 | 1~5000 (상한은 staging 보호) |
| `--days=` | 14 | 7~30 |
| `--seed=` | 20260511 | 결정적 PRNG seed — 동일 시 동일 분포 |
| `--cohort-label=` | `synth_<seed>_dev` | 멱등 키. `profiles.display_name` prefix로 식별 |
| `--dry-run` | (off) | 분포만 출력, DB 쓰기 생략 |

---

## 4. dogfood 1 계정 추가 절차 (W15 본인 dogfood)

orchestrator 결정: "**baseline 수집은 Supabase staging + synthetic seed + 1인 dogfood**". 합성과 별도로 본인(devops) 1명 실계정을 staging에 등록하여 end-to-end UX 검증.

1. **Supabase staging 콘솔** → Auth → Users → Add user
   - Email: `<본인>+dogfood-w15@<도메인>` (alias 권장, prod 메인 메일과 분리)
   - 비밀번호: 1Password 신규 항목 `dash2zero / staging / dogfood-w15` 저장
2. **모바일 앱** → Settings에서 staging 환경 빌드로 전환 (EAS dev client).
   - 환경 분리는 `Q-OPS-NEW-006` 참조 (번들 ID `com.dash2zero.staging`)
3. **opt-in flow 통과** — privacy-choices.tsx에서 analytics opt-in 선택.
   - 이 단계에서 `applyConsent → setAnalyticsCollectionEnabled(true)` 발화 확인 (DebugView)
4. **14일 dogfood 사용 규약**
   - 매일 1회 이상 lesson_started + 가능한 한 lesson_completed
   - Day 3, Day 7에 의도적 재방문 (retention 측정 anchor)
   - paywall 노출 시 의도적으로 1회 viewed (purchase는 RC sandbox로 1회)
5. **합성 cohort와 분리** — 본인 user_id는 `display_name`에 `dogfood/` prefix를 별도 부여(수동 update). analytics view에서 cohort 분리 가능.
   ```sql
   UPDATE profiles SET display_name='dogfood/devops-w15'
   WHERE user_id='<본인 uuid>';
   ```
6. **종료 시 정리** — M5 closed beta 시작 전 dogfood 데이터는 별도 cohort로 archive (analytics 결정).

---

## 5. 멱등성 / 정리

- 동일 `--cohort-label`로 재실행 시 `purgeCohort()`가 기존 행 `profiles.display_name LIKE '<label>/%'` 매칭을 종속 테이블 포함 DELETE.
- 종속 정리 순서: `subscription_entitlements → paywall_events → learning_attempts → user_word_states → daily_usage → guest_sessions → profiles`.
- `auth.users`는 별도 admin API 호출 필요 (본 스크립트는 `profiles`까지만). staging이라 잔존 user 0건 무해.
- **전체 합성 데이터 일괄 삭제**:
  ```sql
  DELETE FROM profiles WHERE display_name LIKE 'synth_%';
  ```

---

## 6. analytics view와의 계약 (정합성)

> analytics agent의 `scripts/baseline/queries.sql`이 다음 컬럼을 요구한다고 가정. 실제 view 작성 후 본 README와 cross-check.

| 테이블 | 본 seed가 채우는 컬럼 |
|---|---|
| `profiles` | `user_id, display_name, learning_motivation, email_hash, locale, timezone, age_attestation_at, srs_started_at, created_at, updated_at` |
| `learning_attempts` | `id, user_id, word_id, attempted_at, correct, mode, local_day` |
| `paywall_events` | `id, user_id, viewed_at, source, entitlement_status` (테이블 미존재 시 soft-skip) |
| `subscription_entitlements` | `user_id, product_id, store, status, starts_at, expires_at, created_at, updated_at` |

스키마 mismatch 발생 시: seed가 fail-fast로 abort. error 메시지에 컬럼명 포함. analytics에 ping → schema 합의 → seed 보강.

---

## 7. 운영 가드

- **PII 미주입**: 이메일은 `synth+<uuid>@dash2zero.local` (실제 도메인 아님), 표시명은 `synth-user-<n>`.
- **service_role 키 보관**: 1Password `dash2zero / staging / service-role` (rotation 분기별).
- **CI 자동 실행 금지**: 본 seed는 manual only. workflow에서 자동 호출하지 않는다.
- **결정성**: 동일 `--seed` 동일 분포. 분포 회귀 시 차이 추적 가능.

---

## 8. 의존성

| 항목 | 상태 | 메모 |
|---|---|---|
| `0001_init.sql` migration 적용 | 필수 | profiles, learning_attempts |
| `paywall_events` 테이블 | optional | 미존재 시 soft-skip (analytics view가 LEFT JOIN) |
| analytics `scripts/baseline/queries.sql` view | W15 작성 예정 | 본 seed가 동작 표면 제공 |
| Supabase staging 프로젝트 | 필수 | prod와 분리된 URL |

---

## 9. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 | 초안 작성 (M3 W15) — 분포 8개 + 멱등 purge + prod 가드 + dogfood 1 계정 절차 | devops |
