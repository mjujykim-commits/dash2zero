# GA 출시 게이트 — 사전 양식 (CHECKLIST)

- **책임**: orchestrator (최종 판정) + Owner (실기 검증) + agent별 evidence 첨부
- **작성일**: 2026-06-01 (M4 W17 D-6, GA D-14~21 사전 양식)
- **검증 일자**: **2026-06-15 (GA 후보 1) 또는 2026-06-22 (GA 후보 2)** — R-M5-01 reconfirm 후 사용자 결정
- **참조**:
  - `docs/23_deployment_checklist.md` (v0.3 상세 SoT — 18 섹션)
  - `docs/runbooks/PRE_MORTEM_M3_TO_GA.md` (8 도메인 × 30 시나리오)
  - `docs/harness/M3_GATE_V2_CHECKLIST.md` (M3 종료 양식, 패턴 재사용)
  - `docs/harness/M4_GATE_CHECKLIST.md` (M4 종료 양식)
- **SSOT 우선순위**: 본 문서 > deployment_checklist > sprint plan

---

## 0. 한 줄 요약 (D-14 시점)

GA 출시 보류 P0 조건 **11건 (deployment §2) + 우리 작업 통합 5건 = 16조건** 검증. 각 조건마다 PASS/FAIL 도장. ≤2 FAIL 시 GA 진행, 3+ FAIL 시 보류.

---

## 1. 16조건 GA 검증 양식

각 조건 5요소: **Evidence 위치 / 검증 명령어 / Pass criteria / Fail action / 도장**.

---

### A. 기능·품질 (5건)

#### 조건 #1 — P0 QA 0 fail

- **Evidence**: `docs/qa/M4_E2E_SUITE_PLAN.md` 결과 + Maestro/Detox CI green
- **검증 명령어**:
  ```bash
  gh run list --workflow=e2e-on-pr.yml --branch main --limit 5
  ```
- **Pass criteria**: P0 케이스 0 fail + flake 0 (최근 5회 run)
- **Fail action**: P0 케이스 root-cause 즉시 + hotfix
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **qa**

#### 조건 #2 — 앱 실행 + 첫 lesson 완료 가능

- **Evidence**: 실기 빌드 후 fresh install → lesson 1 chain 완료 + lesson_completed 이벤트 발화
- **검증 명령어**: 실기 빌드 + 수동 1회
- **Pass criteria**: cold start ≤ 3초 (PRD 비기능) + lesson 첫 chain 완료 정상 + lesson_completed analytics 발화
- **Fail action**: 즉시 rollout halt + root-cause
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **frontend + qa**

#### 조건 #3 — Starter Pack 60단어 완성 + Core Pack 180 + Premium Pack 300+

- **Evidence**: `fixtures/seeded/words/*.yaml` + content quality cross-review 결과 (D-020)
- **검증 명령어**:
  ```bash
  find fixtures/seeded/words -name "*.yaml" | wc -l  # 540+ 기대
  pnpm eval:content
  ```
- **Pass criteria**: 540단어 + 0 quality violation + 1차 cross-review 종료
- **Fail action**: 누락 단어 추가 / quality issue 즉시 해소
- **D-14 도장**: ✅ **PASS** (D-019 봉인 시점 540단어 완성, content_quality_policy.md 정합)

#### 조건 #4 — Lesson 4단계 시그니처 모션 (D-029 봉인)

- **Evidence**: D-029 W17 Work Order P0-1 (StageReveal + MorphingKoreanWord) 봉인 + Designer Full Sign-off (D-030)
- **검증 명령어**: 실기 빌드 → lesson 진행 → Notice→Hear→Meaning→Retrieve 4단계 시각 확인
- **Pass criteria**: stagger fade-up + 한글 hero scale 보간 정상 + reduce-motion fallback 동작
- **Fail action**: D-029 사전 승인 fallback (MorphingKoreanWord scale 0.875→0.90, SE <44px 시) 적용
- **D-14 도장**: ✅ **PASS** (D-030 Designer Full Sign-off 2026-06-01)

#### 조건 #5 — 4-rule Merge Gate (motion 시스템)

- **Evidence**: 신규/갱신 컴포넌트 10건 cross-validate (NeonButton/Shimmer/JellySwitch/BottomSheet/AudioButton/StageReveal/MorphingKoreanWord/QuizOption/PulseOverlay(deprecated)/ChoiceCard(deprecated))
- **검증 명령어**: 코드 review + Designer §1 일관 규칙 5조 / 4-rule (GPU/Lifecycle/Timing/Skeleton) 확인
- **Pass criteria**: 4 Rule 모두 PASS + Designer Sign-off 수신 (D-027 + D-030)
- **D-14 도장**: ✅ **PASS** (사전 봉인 완료, 재검증 불필요)

---

### B. 결제·법무 (3건)

#### 조건 #6 — Production 결제·복원 정상

- **Evidence**: RevenueCat dashboard + StoreKit Configuration test
- **검증 명령어**: TestFlight 또는 production sandbox에서 월간/연간 구독 + Restore 1회씩
- **Pass criteria**:
  - Apple ID + Google 계정 각각 1회 결제 성공
  - Restore 정상 (다른 디바이스에서 entitlement 동기)
  - Premium pack 즉시 unlock
  - 가족공유 비활성화 동작 (D-018 정합)
  - 무료 체험 없음 명시 표시
- **Fail action**: RevenueCat product ID + StoreKit Configuration 정합 점검 + hotfix
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **frontend + Owner**

#### 조건 #7 — 개인정보 처리방침 + 약관 게시 + 계정 삭제 흐름

- **Evidence**:
  - `docs/16_privacy_policy.md` + `docs/17_terms_of_service.md` 외부 공개 URL
  - apps/mobile/app/settings.tsx Delete account flow
- **검증 명령어**: Settings → Delete account 실행 → 30일 grace period 시작 확인
- **Pass criteria**:
  - 정책 URL 외부 공개 + 앱 내 deep link 동작
  - 삭제 요청 → 30일 후 실제 삭제 (cron 검증)
  - 삭제 전 사용자 데이터 export 옵션 (선택, M5+ 권고)
- **Fail action**: 정책 미게시 시 GA 즉시 중단 (C-13 정합)
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **legal + frontend**

#### 조건 #8 — C-13 D-42 사업자/결제 게이트

- **Evidence**: `docs/23_deployment_checklist.md` §3 D-42 게이트 7항목
- **검증 명령어**: deployment_checklist §3 7건 모두 [x] 확인
- **Pass criteria**:
  - 한국 개인사업자 등록 확정
  - 통신판매업 신고 확정
  - 결제 수령 주체 확정
  - 세금계산서/원천세 처리 확정
  - 등 7항목 모두
- **Fail action**: 게이트 실패 후 유료 출시 강행 금지 — **deployment §2 출시 보류 명시 조건**
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **Owner + legal** (D-021 deferred 정합 — "제품 완성" 시점 사용자 호출)

---

### C. 보안·개인정보 (4건)

#### 조건 #9 — Age Gate + 13세 미만 차단

- **Evidence**: `apps/mobile/app/age-gate.tsx` + age_blocked screen + AGE-001/AGE-003 evaluator
- **검증 명령어**:
  ```bash
  pnpm eval --category=privacy  # AGE-001, AGE-003 포함
  ```
- **Pass criteria**: under-13 응답 시 24h device lockout 동작 + 분석 동의보다 먼저 표시
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **frontend + qa + security**

#### 조건 #10 — RLS policy test 통과 (M3 게이트 #3 정합)

- **Evidence**: `pnpm eval:rls --strict` + nightly cron green
- **검증 명령어**:
  ```bash
  pnpm eval:rls --strict
  gh run list --workflow=eval-nightly.yml --limit 3
  ```
- **Pass criteria**: 13/13 RLS adversarial PASS + nightly cron green (최근 3회)
- **Fail action**: 즉시 RLS policy review + hotfix
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **security + backend**

#### 조건 #11 — Privacy Manifest + Required Reason API (CC2-04)

- **Evidence**: `apps/mobile/app.json` privacyManifests 섹션 + 3rd-party SDK manifest cross-check
- **검증 명령어**:
  ```bash
  # iOS 빌드 후 manifest 검증
  grep -A 5 "privacyManifests" apps/mobile/app.json
  ```
- **Pass criteria**:
  - NSPrivacyTracking false
  - NSPrivacyAccessedAPITypes 정확 (UserDefaults / FileTimestamp 등)
  - Expo / RN / Firebase / RevenueCat 4 SDK manifest 누락 0건 (R-M4-02 정합)
- **Fail action**: iOS 제출 중단 + 누락 manifest 추가
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **security + frontend**

#### 조건 #12 — Production secret / service role key 노출 0건

- **Evidence**:
  - `git log --all --pretty=format: --name-only --diff-filter=A | sort -u | xargs grep -l "service_role\|SUPABASE_SERVICE_ROLE" 2>/dev/null` 결과
  - GitHub Actions secrets + 1Password Vault audit
- **검증 명령어**:
  ```bash
  # repo 전체 grep
  grep -rn "service_role\|SUPABASE_SERVICE_ROLE_KEY" --include="*.{ts,tsx,json,js}" --exclude-dir=node_modules .
  ```
- **Pass criteria**:
  - secret 0건 검출
  - .env, .env.local 등 모든 secret 파일이 .gitignore에 포함
  - ADR-0008 secret rotation 정책 활성
- **Fail action**: 즉시 secret rotation + force-push history rewrite (Owner 결정 필요)
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **security + devops**

---

### D. 운영·인프라 (4건)

#### 조건 #13 — Baseline 3-source 14d 적재 (M3 게이트 #4, ADR-0007 정합)

- **Evidence**: `metrics/daily/*.json` 14건 + check-thresholds 결과
- **검증 명령어**:
  ```bash
  ls metrics/daily/ | wc -l
  pnpm test:seed
  pnpm baseline:check --weekly
  ```
- **Pass criteria**:
  - 14건 누적 + 3-source 신호 (staging/synthetic/dogfood)
  - synthetic 결정성 test PASS (ADR-0007 §3)
  - check-thresholds red 0건 (yellow 허용 — Q-ADR-0007-3 정합)
- **Fail action**: 누락 day 보강 + R1 reversal trigger 검토
- **D-14 도장**: ✅ **PASS** (M3 D-7 통과 기준 — 확인 필요) — 책임: **analytics + devops**

#### 조건 #14 — Crash-free users ≥ 99.5%

- **Evidence**: Firebase Crashlytics dashboard
- **검증 명령어**: Firebase Crashlytics → 최근 7일 crash-free rate
- **Pass criteria**:
  - crash-free users ≥ 99.5%
  - ANR rate ≤ 0.5%
  - p95 cold start ≤ 3초
- **Fail action**: 상위 crash 분석 + hotfix
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **frontend + devops**

#### 조건 #15 — Phased rollout 5%→25%→50%→100% (CC3-08)

- **Evidence**: App Store Connect + Google Play Console rollout 설정
- **검증 명령어**: store dashboard 확인
- **Pass criteria**:
  - 5% 1일 → crash-free 99% 이상 유지 시 25% 진행
  - 25% 2일 → 결제 실패 5% 미만 유지 시 50% 진행
  - rollout halt 임계 명시 (crash-free 99% / ANR 0.5% / 결제 5%)
- **Fail action**: 즉시 halt + Owner 수동 재개
- **D-14 도장**: `[ ] PASS (rollout 준비 OK)  [ ] FAIL  ` 책임: **devops + Owner**

#### 조건 #16 — OTA EAS Update 정책 + 핫픽스 SOP

- **Evidence**: `docs/23_deployment_checklist.md` §17 OTA SOP + EAS Update 설정
- **검증 명령어**: EAS Update channel 확인 + OTA 허용 범위 SOP 명시
- **Pass criteria**:
  - OTA 허용 변경: JS-only fixes
  - OTA 금지 변경: native code, 결제, 권한
  - 핫픽스 rollout halt 조건 명시
- **Fail action**: OTA 정책 명세 보강
- **D-14 도장**: `[ ] PASS  [ ] FAIL  ` 책임: **devops**

---

## 2. D-14 일자별 체크리스트

### D-14 (GA-2주, 6/1 또는 6/8) — orchestrator 사전 양식 작성 ✅

본 문서 작성 완료. 16조건 evidence 양식.

### D-7 (GA-1주) — Owner + agent 실기 검증

- [ ] 조건 #1 P0 QA + 조건 #2 cold start + 조건 #6 결제·복원 (Owner 실기 1회)
- [ ] 조건 #9 age gate + 조건 #10 RLS + 조건 #11 Privacy Manifest (security 검증)
- [ ] 조건 #12 secret 노출 grep + 조건 #13 baseline 14d (devops + analytics)
- [ ] 조건 #15 phased rollout 설정 + 조건 #16 OTA 정책 확정 (devops)

### D-3 (GA-3일) — Conditional gate 검증

- [ ] 조건 #7 정책 URL 외부 공개 + 조건 #8 D-42 7항목 (Owner + legal)
- [ ] PRE_MORTEM_M3_TO_GA.md 8 도메인 30 시나리오 review (orchestrator + Owner)
- [ ] 모든 PASS/FAIL 도장 1차 확정

### D-1 (GA 전일) — 최종 판정

- [ ] orchestrator 본 CHECKLIST의 16/16 도장 확정
- [ ] PASS ≥ 14/16 → GA 진행
- [ ] PASS 12~13/16 → CONDITIONAL (D-2 추가 검증 후 진행)
- [ ] PASS ≤ 11/16 → HOLD (1주 보강 후 재판정)

### D-0 (GA 출시일, 6/15 또는 6/22)

- [ ] Phased rollout 5% 시작
- [ ] 첫 24h 모니터링 (crash-free / 결제 / age block / 정책 동의 rate)
- [ ] 25% 진행 결정

---

## 3. 판정 행렬 (PASS 누적)

| PASS 수 | 판정 | 다음 액션 |
|---|---|---|
| 16/16 | **GA 진행** | phased rollout 5% 시작 |
| 14~15/16 | **CONDITIONAL GA** | 1~2건 mitigation 후 5% rollout 시작, 25% 진행 전 재판정 |
| 12~13/16 | **CONDITIONAL HOLD** | 24~48h 보강 후 재판정 (GA 일정 1~2일 지연) |
| 9~11/16 | **HOLD** | 1주 보강 후 재판정 (GA 일정 1주 지연) |
| ≤ 8/16 | **FAIL** | Owner 결정 — M5 추가 sprint 또는 GA 일정 재설정 |

---

## 4. Post-GA 모니터링 7일 (조건 #15 phased rollout 정합)

deployment_checklist §19 7일 모니터링 + 본 CHECKLIST 조건 #15:

| 지표 | 임계 | rollout halt 트리거 |
|---|---|---|
| crash-free users | < 99% | halt + 재개 보류 |
| ANR rate | > 0.5% | halt + 재개 보류 |
| 결제 실패율 | > 5% | halt + 재개 보류 |
| under-13 차단 실패 | 1건 이상 | halt + 보안 분석 |
| Premium 미반영 | 1건 이상 | halt + RevenueCat 점검 |
| 데이터 노출 의심 | 1건 이상 | halt + GDPR 통지 검토 |

→ 위 6 임계는 deployment_checklist §17 + PRE_MORTEM 정합. 위반 시 Owner 수동 재개 결정.

---

## 5. 사용자(Owner) reconfirm 양식

```
GA 출시 게이트 D-1 판정 결과 (2026-06-14 또는 2026-06-21)

조건별 도장:
A. 기능·품질
  #1 P0 QA 0 fail:                    [PASS/FAIL]
  #2 앱 실행 + 첫 lesson 완료:         [PASS/FAIL]
  #3 콘텐츠 540단어:                   PASS (사전 충족)
  #4 Lesson 4단계 시그니처 모션:       PASS (D-030 사전 충족)
  #5 4-rule Merge Gate:                PASS (사전 충족)

B. 결제·법무
  #6 Production 결제·복원:             [PASS/FAIL]
  #7 정책 게시 + Delete account:       [PASS/FAIL]
  #8 C-13 D-42 사업자 게이트:          [PASS/FAIL]

C. 보안·개인정보
  #9 Age Gate + under-13 차단:         [PASS/FAIL]
  #10 RLS policy test:                  [PASS/FAIL]
  #11 Privacy Manifest:                 [PASS/FAIL]
  #12 Secret 노출 0:                    [PASS/FAIL]

D. 운영·인프라
  #13 Baseline 3-source 14d:           PASS (M3 D-7 사전 충족)
  #14 Crash-free ≥99.5%:               [PASS/FAIL]
  #15 Phased rollout 준비:              [PASS/FAIL]
  #16 OTA 정책 + 핫픽스 SOP:            [PASS/FAIL]

누적: N/16 PASS

orchestrator 판정: [GA 진행 / CONDITIONAL GA / CONDITIONAL HOLD / HOLD / FAIL]
사유: <1~3 sentence>

Owner reconfirm: [통합 승인 / 부분 수정 / 보류]
```

---

## 6. Reversal Trigger (GA 통과 후 7일 monitoring)

- **R1**: §4 임계 1 violation → rollout halt + Owner 재개 결정
- **R2**: Privacy Manifest manifest 누락 발견 → iOS rollback + hotfix
- **R3**: 결제 후 Premium 미반영 ≥ 5건/day → RevenueCat 긴급 점검
- **R4**: Audit_log 누락 검증 시 GDPR 통지 산정 불가 → 즉시 supplementary investigation

---

## 7. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-06-01 | GA-2주 사전 양식 작성 (orchestrator) — 16조건 evidence 양식 + 판정 행렬 + post-GA 모니터링 + Reversal Trigger. M3/M4 GATE CHECKLIST 패턴 적용 |
