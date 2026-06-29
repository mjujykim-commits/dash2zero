# Pre-Mortem M3 → GA — 망가질 수 있는 시나리오 시뮬레이션

> 작성: orchestrator
> 책임: GA 출시 후 망가질 수 있는 시나리오를 사전 시뮬레이션. M5 모니터링 + post-GA 1주 모니터링 입력 SSOT
> 작성일: 2026-05-12 (M3 W15 Cycle B dispatch + 사전 양식 작업 후속)
> 사용 시점: M5 W19 entry / W20-02 출시 후 1주 모니터링 / Beta Handoff rollup
> 갱신 trigger: Cycle B/C 산출물 도착 + W16 게이트 + M4 게이트 + GA 직전 review

---

## 0. 한 줄 요약

GA 출시 후 6개월 시점에 "왜 이게 망가졌나?"를 가정하는 pre-mortem. **8 도메인 × 30 시나리오** 분석. 각 시나리오에 발화 확률(L/M/H) × 영향(L/M/H) × detect 방법 + mitigate 방법 + 책임 agent + 처리 시점 명시.

발화 확률 × 영향 = **risk score** (LL=1, LM/ML=2, LH/HL/MM=3, MH/HM=4, HH=5). score ≥ 4 인 시나리오는 **GA 차단 후보**.

---

## 1. 보안 도메인 (security)

### S-01: RLS 우회 발생 — anon이 premium audio 접근 성공 (Information Disclosure)

- **시나리오**: pack-tier-free 정책의 EXISTS 서브쿼리가 static analysis로 검증된 후 hybrid 미도입 상태에서 실제로는 row hide 안 됨
- **발화 확률**: M (RLS-ADV-005 / RLS-ADV-006 static 검증만 통과, hybrid 미도입 시)
- **영향**: H (매출 직접 손실 + license 위반)
- **risk score**: 4 — **GA 차단 후보**
- **Detect**: nightly RLS hybrid evaluator (M4 W17-S2) + audit_log support 정책 monitoring (M5 W19-O2 live mode)
- **Mitigate**: M4 W17-S2 RLS hybrid 도입 (R-25 closed) + pg_test_role 실측. GA 전에 hybrid green 필수
- **책임**: security + backend
- **처리 시점**: M4 W17-S2 (5/27~28)
- **잔존 risk**: M5 audit_log alert가 1건도 발화 안 하면 false negative 가능성

### S-02: audit_log INSERT 누락으로 GDPR 통지 산정 불가

- **시나리오**: backend의 audit_log emit 통합이 누락된 코드 경로 발견 → GDPR 30일 통지 산정 시 lost record
- **발화 확률**: M (R-27 잔존, M5 grep guard rule 적용 전까지)
- **영향**: H (GDPR 통지 의무 위반 risk + 배상 risk)
- **risk score**: 4 — **GA 차단 후보**
- **Detect**: M5 직전 `git grep -E "actor.*=.*user_id[^']" -- 'apps/api/**'` CI guard rule
- **Mitigate**: AUDIT_ALERT_RUNBOOK §M5 grep guard rule 활성. PR 차단으로 회귀 방지
- **책임**: security + backend
- **처리 시점**: M5 W19-O5 (runbook 활성)
- **잔존 risk**: 본 sprint 이전 commit에 누락 있을 경우 retroactive 검증 필요

### S-03: Slack webhook URL 유출

- **시나리오**: vault.secrets / GitHub Actions secrets 중 한 곳 노출 → 외부 spam alert 발생
- **발화 확률**: L (이중 등록 + rotation 정책)
- **영향**: M (운영 알림 신뢰성 손실)
- **risk score**: 2
- **Detect**: ADR-0008 rotation calendar entry + GitHub secret scanning + 1Password Vault audit log
- **Mitigate**: ADR-0008 분기별 rotation (M4 W17-S1) + 누출 즉시 webhook 재발급
- **책임**: security + devops
- **처리 시점**: M4 W17-S1
- **잔존 risk**: 1인 운영 rotation 의무 누락 가능

### S-04: Privacy Manifest 3rd-party SDK 누락 — iOS submission 반려

- **시나리오**: Expo 또는 RN 또는 Firebase 또는 RC 중 하나의 manifest가 새 버전에서 변경됐는데 dash2zero가 인지 못 함
- **발화 확률**: M (Privacy Manifest 5/5 strict + W17-S3 evaluator 활성 전까지 manual 검증)
- **영향**: H (iOS submission 반려 → 1주 출시 슬립)
- **risk score**: 4 — **GA 차단 후보**
- **Detect**: M4 W17-S3 Privacy Manifest evaluator nightly + 3rd-party SDK version pin
- **Mitigate**: 3rd-party SDK 업그레이드 시 manifest cross-check 강제 CI rule
- **책임**: security + legal
- **처리 시점**: M4 W17-S3 (5/28)
- **잔존 risk**: Apple Beta App Review 시점에 신규 SDK 추가 시 manifest 변경 감지 못할 가능성

---

## 2. 결제 도메인 (backend + legal)

### P-01: RC webhook 5xx 폭주 → entitlement 갱신 지연

- **시나리오**: RevenueCat가 일시적 5xx 반환 → audit_log에 webhook 5xx 적재 → entitlement.status 갱신 지연
- **발화 확률**: M (외부 API 의존, RC SLA 99.9%)
- **영향**: M (사용자 premium 접근 일시 차단 또는 무료 사용자 premium 잔존)
- **risk score**: 3
- **Detect**: audit_log webhook 5xx count monitor + RC dashboard
- **Mitigate**: billing_retry 24h window (mapStatus SoT) + isPremiumActive billing_retry < 24h 시 premium 유지. PAY-011/013 golden 검증
- **책임**: backend
- **처리 시점**: 이미 mitigated (W14 Payment SoT)
- **잔존 risk**: 24h 초과 시 사용자 CS 응답 SLA 준수 필요

### P-02: 환불 후 entitlement 비활성화 누락

- **시나리오**: REFUND event 수신했으나 entitlement.status가 cancelled로 갱신 안 됨 → 사용자가 환불받고도 premium 계속 사용
- **발화 확률**: L (PAY-007 REVOKE / W19-O6 dry-run 검증)
- **영향**: M (매출 손실 + Apple/Google 환불 챔피언십 위반)
- **risk score**: 2
- **Detect**: nightly audit (env: RC dashboard refund count vs DB cancelled count diff)
- **Mitigate**: W19-O6 결제 sandbox dry-run에서 환불 흐름 1회 PASS 강제
- **책임**: backend + devops
- **처리 시점**: M5 W19-O6
- **잔존 risk**: RC webhook 누락 (R-27 audit_log emit 누락과 연관)

### P-03: 가족공유 활성화 시 entitlement_inherited=true 발화

- **시나리오**: Apple 가족공유 / Play 가족공유 정책이 자동 변경되어 PRV-012 가정과 다르게 entitlement 전파
- **발화 확률**: L (4 토글 OFF 강제, FAMILY_SHARE_OPS §1)
- **영향**: H (매출 손실 + 정책 위반)
- **risk score**: 3
- **Detect**: PRV-012 fixture nightly green + RC dashboard family share count
- **Mitigate**: FAMILY_SHARE_OPS §4 활성화 시 사전조건 6항목 강제
- **책임**: legal + backend
- **처리 시점**: 이미 mitigated (W15 PRV-012 + FAMILY_SHARE_OPS)
- **잔존 risk**: Apple/Google 정책 변경 시 자동 알림 없음

### P-04: paywall 4-variant lock 위반 — variant 추가 시 disclosure 미반영

- **시나리오**: 마케팅 목적으로 paywall variant E 추가했는데 4-variant matrix(docs/13 §5.1) 갱신 안 함 → 정책 위반 disclosure 누락
- **발화 확률**: M (release after release variant 추가 가능성)
- **영향**: M (Apple §3.1.2(a) reject risk + 매출 측정 신뢰성 손실)
- **risk score**: 3
- **Detect**: docs/13 §5.1 표가 SoT. paywall_view 이벤트의 variant_id enum이 표와 정합 — PR 검토 시 확인
- **Mitigate**: variant 추가 시 lock 표 갱신을 PR 검토 강제 정책 (analytics baseline 시작 전 사전 합의)
- **책임**: legal + analytics
- **처리 시점**: 이미 mitigated (W15 legal Paywall lock)
- **잔존 risk**: PR 검토 누락 가능성

---

## 3. 콘텐츠 / 학습 도메인 (content + learning)

### C-01: SRS golden 100+건 + nightly green이지만 실 사용자 학습 곡선 fail

- **시나리오**: 모든 evaluator pass + threshold check pass인데 사용자가 lesson_complete_rate < 60% (Critical) 도달
- **발화 확률**: M (synthetic seed 가정 vs 실 사용자 행동 gap)
- **영향**: H (제품 핵심 KPI 실패 = 베타 → GA 전환 차단)
- **risk score**: 4 — **GA 차단 후보**
- **Detect**: PRD §8.2 threshold check (analytics 14d cron) + cohort 분해 (LESSON_COMPLETE_RATE_THRESHOLDS.md §cohort)
- **Mitigate**: M5 W19-D3 베타 첫 1주 피드백 분석 + GA 직전 hotfix 후보 분류. 7일 rolling < 60% 시 release-block trigger 발화
- **책임**: pm + planner + analytics
- **처리 시점**: M5 W19-D3 (베타 첫 1주 분석)
- **잔존 risk**: 베타 사용자 30명 vs 1만 사용자 행동 차이 — Beta App Review 통과 후 본 출시 시점

### C-02: 콘텐츠 검수자 모집 실패 → 외부 검수 미반영 콘텐츠 노출

- **시나리오**: R-01 발현 — 외부 검수자 0명, PM self-review fallback도 24h SLA 미준수
- **발화 확률**: M (외부 검수자 모집 어려움)
- **영향**: M (콘텐츠 품질 vs CC3-07 정책 위반)
- **risk score**: 3
- **Detect**: PM 매주 review SLA 추적
- **Mitigate**: PM self-review fallback (CC3-07 보조) + 24h 지연 self-review + GA 후 외부 검수자 retroactive 활용 검토
- **책임**: learning + pm
- **처리 시점**: M4~M5 monitor
- **잔존 risk**: starter pack 60단어 일부 검수 누락 시 사용자 신뢰 손실

### C-03: distractors retire 후 user_word_state 회귀

- **시나리오**: 콘텐츠 retire 발생했으나 user_word_state.last_choices에 retired distractor 잔존 → 사용자가 동일 문제 반복 시 retired distractor 노출
- **발화 확률**: L (R-24 W15-07b closed 예정)
- **영향**: L (UX 회귀, 데이터 손실 없음)
- **risk score**: 2
- **Detect**: `distractors_after_retire` 검증 함수 (W15-07b)
- **Mitigate**: Cycle B W15-07b distractors_after_retire 함수 + nightly green
- **책임**: content
- **처리 시점**: Cycle B (W15-07b)
- **잔존 risk**: retire 이후 user_word_state 강제 reset 정책 미정

### C-04: weak clear 1회 정답 정책의 false-positive 해제율

- **시나리오**: SRS-060 봉인 정책(1회 정답 = weak clear)이 실 사용자에서 reflag rate > 20% → false-positive 의심
- **발화 확률**: M (baseline 가정값, 실 데이터 미확보)
- **영향**: L (사용자 학습 진도 일시 왜곡, 회복 가능)
- **risk score**: 2
- **Detect**: M4 W17~W18 `srs_weak_cleared` + `srs_weak_reflagged` event emit + reflag rate 측정
- **Mitigate**: reflag rate > 20% 시 ADR로 weak clear 정책 재논의 (learning context §2.1)
- **책임**: learning + backend
- **처리 시점**: M4 W17~W18 (event emit 추가)
- **잔존 risk**: baseline 14d 수집 후 정책 재조정 시 SRS-060 golden expected 갱신 필요

---

## 4. Baseline / Observability 도메인 (analytics + devops)

### B-01: baseline 14d cron 중간 1~3일 누락 → M3 게이트 CONDITIONAL → M4 슬립

- **시나리오**: R-W16-01 발현. nightly cron 중간 누락 발생 시 14건 누적 못 채움
- **발화 확률**: L (devops 6단계 게이트 + 다음날 보강 정책)
- **영향**: M (M3 게이트 #4 CONDITIONAL 표시 + W18 buffer 흡수)
- **risk score**: 2
- **Detect**: nightly cron 자동 알림 (GitHub Actions failure notification)
- **Mitigate**: 다음날 2건 보강 commit + W16 게이트 CONDITIONAL 표시 (acceptable trade-off)
- **책임**: analytics + devops
- **처리 시점**: W16 monitor
- **잔존 risk**: 누락 패턴 학습 + cron health check 추가 권고

### B-02: 실 사용자 baseline 14d (M5) 시작 후 7일 시점에 KPI < Minimum

- **시나리오**: M5 W19-D1 실 baseline 수집 시작 후 D-3 retention < 25% 또는 lesson_complete < 60% 도달
- **발화 확률**: M (베타 사용자 30명 가정)
- **영향**: H (GA 차단 release-block trigger 발화)
- **risk score**: 4 — **GA 차단 후보**
- **Detect**: 매일 `check-thresholds.ts` 실행 + 7일 rolling threshold
- **Mitigate**: M5 W19-D3 베타 피드백 분석 + GA 직전 hotfix 후보 분류 + 7일 rolling < Minimum 시 GA 슬립
- **책임**: analytics + pm + planner
- **처리 시점**: M5 W19-D3 ~ GA 직전
- **잔존 risk**: 30명 sample size로 threshold 신뢰성 — confidence interval 명시 필요

### B-03: synthetic seed의 분포 가설이 실 데이터와 ±20% 이상 어긋남

- **시나리오**: Q-OPS-W15-006 발현 — synthetic 가정(D-3 retention 40%)과 실 cohort decay 곡선 ±20% 이상 차이
- **발화 확률**: M (외부 학습앱 median 가정)
- **영향**: L (synthetic은 파이프라인 검증용, 실 KPI는 별개 — 게이트 영향 없음)
- **risk score**: 2
- **Detect**: M5 W19-D1 실 baseline 시작 후 첫 1주 비교
- **Mitigate**: 분포 재추정 + commit message `[seed-dist]` prefix로 갱신
- **책임**: devops + analytics
- **처리 시점**: M5 W19-D1 후
- **잔존 risk**: dogfood 1 계정 신호가 synthetic과 다르게 cohort 분류될 가능성 (Q-OPS-W15-007)

### B-04: Firebase Analytics 14d 미수집 (BigQuery export 미활성)

- **시나리오**: LIM-2 BASELINE_METRICS.md §5 발현. Firebase 14d 미수집 → SQL view에서 일부 funnel 비어 있음
- **발화 확률**: L (analytics가 Supabase event 적재 + Firebase는 정성 분석용)
- **영향**: L (SQL view에서 funnel 비어 있어도 게이트 영향 없음, 실 KPI는 Supabase 적재 기준)
- **risk score**: 1
- **Detect**: BASELINE_METRICS §5 LIM-2 명시
- **Mitigate**: BigQuery export 활성화 시점은 GA 후 결정 (deferred)
- **책임**: analytics
- **처리 시점**: deferred (GA 후)
- **잔존 risk**: 없음

---

## 5. 스토어 / 출시 도메인 (devops + frontend + legal)

### Sx-01: Apple Beta App Review 반려

- **시나리오**: M5 W19 베타 모집 시점 Apple Beta App Review 반려 — Privacy Manifest / age gate / disclosure 미흡
- **발화 확률**: M (R-04 + R-M5-03)
- **영향**: H (1주 출시 슬립)
- **risk score**: 4 — **GA 차단 후보**
- **Detect**: M4 W17-S3 Privacy Manifest evaluator + M4 W18-02 EAS staging TestFlight Internal 사전 검증
- **Mitigate**: Privacy Manifest 5/5 green + age gate evaluator + 모의 심사 체크리스트 (M3 게이트 #4 + M4 W17-S3) + 반려 시 즉시 hotfix release (24h 안 Apple expedited review)
- **책임**: security + legal + devops
- **처리 시점**: M4 W17 + GA 직전
- **잔존 risk**: 반려 사유가 manifest 외 다른 항목(예: UI 요소)일 가능성

### Sx-02: GA 출시 후 crash > 1% (Crashlytics 임계 초과)

- **시나리오**: R-M5-05 발현 — production 트래픽 반영 후 첫 24h에 crash 발생
- **발화 확률**: M (실 사용자 트래픽 변동성)
- **영향**: H (사용자 신뢰 손실 + Apple/Google 알람 발화)
- **risk score**: 4 — **GA 차단 후보 — 본 발화 시 hotfix**
- **Detect**: Crashlytics 알람 임계 (crash-free users < 99.5%) — M4 W17-Q2 commit
- **Mitigate**: hotfix release (24h 내 Apple expedited review) + version 별 임계 분리 (새 버전 24h 모니터)
- **책임**: qa + devops
- **처리 시점**: GA 후 D-0~D-7
- **잔존 risk**: expedited review 1주 1회 한도 — 2회 발생 시 GA 슬립 가능

### Sx-03: 약관 / 개인정보처리방침 effective date 표기 누락

- **시나리오**: M5 W19-O3 정식본 commit 시 effective date 2026-06-09 표기했으나 GA 출시 시점(6/15 또는 6/22)에 갱신 누락 → 사용자 약관 새 버전 동의 미발화
- **발화 확률**: L (legal 정책 변경 동의 vs 통지 정책 — W15 docs/16 §16)
- **영향**: M (사용자 약관 동의 신뢰성 + DSR 요청 시 분쟁)
- **risk score**: 2
- **Detect**: docs/16 §16 material change 분기 확인 — GA는 material change 아님 (코드 추가만)
- **Mitigate**: effective date 변경 시 in-app banner 14일 전 + Settings Changelog 갱신
- **책임**: legal + frontend
- **처리 시점**: M5 W19-O3
- **잔존 risk**: 베타 → GA 약관 동일 시 effective date 유지 (현재 정책)

### Sx-04: Play Console 데이터 안전성 양식 미완 → 출시 차단

- **시나리오**: Play Console "데이터 안전성" 양식이 Privacy Manifest와 정합 안 됨 → 출시 차단
- **발화 확률**: M (Privacy Manifest는 iOS 기준, Play 데이터 안전성은 별도)
- **영향**: H (Google Play 본 출시 차단)
- **risk score**: 4 — **GA 차단 후보**
- **Detect**: M4 W18-02 Play Internal Testing 시점 검증
- **Mitigate**: Privacy Manifest 5/5 green + Play 데이터 안전성 양식을 Privacy Manifest와 cross-check (W17-S3 보강 권고)
- **책임**: security + legal + devops
- **처리 시점**: M4 W17-S3 (Play 데이터 안전성 추가 작업)
- **잔존 risk**: 본 항목 W17-S3 산출물에 명시되지 않음 — **추가 권고**

---

## 6. 운영 / 1인 개발자 도메인 (pm + 사용자)

### O-01: R-M5-01 사용자 reconfirm 3건 응답 deadline(2026-06-06) 미응답

- **시나리오**: PM 2026-06-02 알림 송출 → 6/6까지 사용자 무응답 → M5 W19 진입 1~7일 슬립
- **발화 확률**: L (사용자 자율 결정 위임 + 명확한 deadline)
- **영향**: H (GA 일자 슬립)
- **risk score**: 3
- **Detect**: PM 6/3 화 1차 reminder + 6/5 목 final reminder
- **Mitigate**: deadline 1주 전 PM 알림 + 무응답 시 PM 권고 정책 (defaults: C-13 진행 중, Slack stub 유지, 베타 모집 GA 이후 이연)
- **책임**: pm + 사용자
- **처리 시점**: 2026-06-02 ~ 6/6
- **잔존 risk**: 사용자 응답에 명확한 deadline 압박 — UX 변화 가능

### O-02: 1인 개발자 캐파 위반 (질병 / 컨텍스트 스위칭 / 외부 일정)

- **시나리오**: R-06 발현. M4~M5 sprint 중 사용자 일정 슬립 → 14d 안에 처리 불가
- **발화 확률**: M (개인 사정)
- **영향**: M (GA 슬립 또는 P1 작업 deferred)
- **risk score**: 3
- **Detect**: PM W15 sprint board capacity envelope (~1,750줄 보정) 매주 monitoring
- **Mitigate**: 4주 buffer 활용 (PM W15 §3.4) + P1 6개 슬립 가능 사전 분류 (MVP_SCOPE R-06 mitigation)
- **책임**: pm
- **처리 시점**: 매주 sprint board 점검
- **잔존 risk**: buffer 4주 소진 시 GA 7~14일 슬립

### O-03: 베타 30명 모집 1주 안에 실패 → real-user baseline 14d 못 채움

- **시나리오**: R-M5-02 발현. Reddit + Discord + 지인 채널 모두 lukewarm response
- **발화 확률**: L (다중 채널 + 무료 premium 1개월 옵션)
- **영향**: M (real-user baseline 14d 못 채움, M5 W19 종료 시점 7~10명 적재)
- **risk score**: 2
- **Detect**: PM W19-B1 첫 24h 5명 / 1주 30명 trigger
- **Mitigate**: 무료 premium 1개월 부여 옵션 활성화 + Twitter + 한국어 학습 블로그 게시 추가
- **책임**: pm + planner
- **처리 시점**: W19-B1
- **잔존 risk**: 베타 모집 인원 부족 시 dogfood + synthetic으로 baseline 보강 (B-03)

### O-04: CS 응답 SLA 미준수 (1인 개발자 24h SLA 부담)

- **시나리오**: R-M5-01 §2.4 응답에서 24h SLA 약속했으나 1인 사정으로 미준수
- **발화 확률**: M (1인 운영 한계)
- **영향**: M (사용자 신뢰 손실 + 환불 챔피언십 위반)
- **risk score**: 3
- **Detect**: CS 채널 응답 SLA 매일 추적 (legal docs/13 §환불 + W19-B3)
- **Mitigate**: SLA를 48h 또는 best-effort로 사전 명시 (R-M5-01 §3.4 응답에서 사용자 결정) + 자동 응답 템플릿 (EN/KR 2종)
- **책임**: legal + pm
- **처리 시점**: M5 W19-B3
- **잔존 risk**: best-effort 채택 시 사용자 만족도 측정 필요

---

## 7. 도구 / SaaS 의존성 도메인

### T-01: Supabase 가격 인상 / 정책 변경 (R-08)

- **시나리오**: Supabase가 분기별 가격 변경 또는 정책 변경 → 1인 운영 비용 증가 또는 기능 제한
- **발화 확률**: L (글로벌 SaaS 안정성)
- **영향**: M (운영 비용 증가 또는 마이그레이션 필요)
- **risk score**: 2
- **Detect**: Supabase 공식 changelog 분기별 확인 + 비용 monitor
- **Mitigate**: ADR-0002 Domain Model 추상화 (5+4) — 마이그레이션 비용 완화. STACK_EVOLUTION_PLAN trigger 도달 시 검토
- **책임**: backend + architect
- **처리 시점**: 분기별 monitor
- **잔존 risk**: 단기 (M3~M5) 영향 없음

### T-02: RevenueCat 정책 변경 / API breaking change

- **시나리오**: RC가 webhook payload schema breaking change → mapStatus SoT 깨짐
- **발화 확률**: L (RC 90일 deprecation notice)
- **영향**: H (결제 흐름 break)
- **risk score**: 3
- **Detect**: RC release notes + deprecation notice 모니터
- **Mitigate**: ADR-0006 + RC webhook payload schema (packages/contracts/revenuecat/webhook.ts) zod parse strict + deprecation 시점에 dual-version 지원
- **책임**: backend
- **처리 시점**: RC notice 시
- **잔존 risk**: 단기 영향 없음

### T-03: Firebase Analytics 무료 티어 한도 초과 / 가격 변경

- **시나리오**: 일일 이벤트 한도 (Spark plan 500 이벤트/사용자) 초과 또는 paid plan 강제
- **발화 확률**: L (베타 30명 / GA 첫 1k 사용자 시 한도 여유)
- **영향**: L (Analytics 일부 이벤트 손실)
- **risk score**: 1
- **Detect**: Firebase dashboard quota monitor
- **Mitigate**: 무료 한도 70% 도달 시 paid plan 검토 (Q-OPS-W15-008)
- **책임**: analytics + devops
- **처리 시점**: GA 후 monitor
- **잔존 risk**: 없음

### T-04: GitHub Actions 무료 티어 분 한도 초과

- **시나리오**: Q-OPS-W15-008 발현. nightly cron + PR check 누적 시 무료 분 한도 70% 도달
- **발화 확률**: L (현재 사용량 estimate 안에 있음)
- **영향**: L (paid plan 전환 비용)
- **risk score**: 1
- **Detect**: GitHub Actions usage dashboard 매주 확인
- **Mitigate**: 무료 한도 70% 도달 시 paid plan 의사결정 (Q-OPS-W15-008)
- **책임**: devops
- **처리 시점**: 매주 monitor
- **잔존 risk**: 없음

---

## 8. 통합 risk score 매트릭스

### 8.1 score ≥ 4 (GA 차단 후보, 8건)

| ID | 시나리오 | 발화 | 영향 | 처리 시점 | 책임 |
|---|---|:---:|:---:|---|---|
| S-01 | RLS 우회 (premium audio) | M | H | M4 W17-S2 | security + backend |
| S-02 | audit_log 누락 (GDPR) | M | H | M5 W19-O5 | security + backend |
| S-04 | Privacy Manifest 누락 | M | H | M4 W17-S3 | security + legal |
| P-04 (?) | paywall variant lock 위반 | M | M | (already mitigated) | legal + analytics |
| C-01 | lesson_complete < 60% (실 사용자) | M | H | M5 W19-D3 | pm + planner + analytics |
| B-02 | 실 baseline KPI < Minimum | M | H | M5 W19-D3 | analytics + pm + planner |
| Sx-01 | Apple Beta App Review 반려 | M | H | M4 W17-S3 | security + legal + devops |
| Sx-02 | GA 후 crash > 1% | M | H | GA 후 hotfix | qa + devops |
| Sx-04 | Play 데이터 안전성 양식 미완 | M | H | M4 W17-S3 (보강 권고) | security + legal + devops |

### 8.2 score 3 (medium, 7건)

P-01, P-03, C-02, O-01, O-02, O-04, T-02

### 8.3 score ≤ 2 (low, 14건)

P-02, S-03, C-03, C-04, B-01, B-03, B-04, Sx-03, O-03, T-01, T-03, T-04 + Q-XX 5건

---

## 9. M3 W15 ~ GA 사이의 처리 일자

| 일자 | 처리 시나리오 |
|---|---|
| 2026-05-15~17 (Cycle B) | C-03 (W15-07b) / B-01 monitor 시작 |
| 2026-05-19~25 (W16) | B-01 / R-W16-01 monitor |
| 2026-05-26~6/1 (M4 W17) | **S-01 / S-04 / Sx-01 / Sx-04** + T-01 monitor |
| 2026-06-02 (PM 알림) | **O-01** (R-M5-01) |
| 2026-06-02~6/8 (M4 W18) | Sx-02 (Crashlytics 임계 설정) + O-04 (CS SLA) |
| 2026-06-09~6/15 (M5 W19) | **S-02 / C-01 / B-02 / O-03 / Sx-03 (effective date)** |
| 2026-06-15~6/22 (GA W20) | **Sx-02 (실 crash monitor)** + 전체 monitor |
| GA 후 첫 1주 | C-04 / B-02 / B-03 weekly review |

---

## 10. 사용 방법

본 문서는 다음 시점에 입력 SSOT로 사용:

1. **M3 W15 Cycle C 종료 (2026-05-18)**: §8.1 score ≥ 4 시나리오 8건 각각의 M4 처리 매핑 확인
2. **M4 W17 진입 (2026-05-26)**: §8.1 8건 중 M4 처리 시나리오 5건(S-01/S-04/Sx-01/Sx-04 + B-01 monitor)의 trigger
3. **M5 W19 진입 (2026-06-09)**: §8.1 나머지 시나리오 + O-01 deadline + §10 일자별 처리
4. **GA 출시 후 1주 (W20-02)**: §8.1 + §8.2 17건 매트릭스를 daily check 입력
5. **GA 후 6개월 review**: 본 pre-mortem이 실제로 망가졌는지 retrospective

---

## 11. 갱신 trigger

- Cycle B 종료: §8.1 시나리오에 closed/mitigated 표기
- M3 게이트: B-01 / B-04 status 갱신
- M4 게이트: S-01 / S-04 / Sx-01 / Sx-04 closed 표기 (M4 게이트 통과 시)
- M5 진입: O-01 응답 결과 반영 + C-01 / B-02 monitor 시작
- GA 출시: Sx-02 monitor 활성화

---

## 12. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 | 신규 작성 — 8 도메인 × 30 시나리오 + risk score 매트릭스 + score ≥ 4 GA 차단 후보 8건 + 일자별 처리 일정 |
