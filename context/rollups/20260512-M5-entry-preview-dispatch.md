# Dispatch — M5 Beta Entry Preview (W19 + GA-W20, 2026-06-09 ~ 2026-06-22)

> 작성: orchestrator (사전 양식 v0, 2026-05-12)
> 실 발행 시점: M4 completed 직후 (2026-06-08)
> 사이클: M5 entry preview — W15 Cycle B 통합 직후 미리 작성
> 선행: `context/rollups/20260512-M4-entry-preview-dispatch.md` + `context/rollups/20260512-R-M5-01-user-reconfirm-template.md`
> 다음 사이클: M5-W19 진입 (M4 게이트 PASS + R-M5-01 응답 결과 반영 후)

---

## 0. M5 한 줄 목표

**베타 모집 30명 + 실 사용자 baseline 14d 수집 시작 + 약관/RC payout/Slack URL 활성화 + GA 출시 (W20) → dash2zero MVP launch**

---

## 1. M5 진입 전제 조건 (M4 게이트 통과 + R-M5-01 응답)

W18 종료(2026-06-08 일)에 다음이 충족되어야 M5 진입 가능:

- ✅ M4 게이트 13조건 PASS (또는 12/13 + 1 CONDITIONAL with documented exception)
- ✅ ADR-0008 (Secret 회전) Accepted
- ✅ M4 completed rollup commit
- ✅ R-M5-01 사용자 응답 수신 (2026-06-06 토 deadline)
- ✅ GA 일자 확정 (사용자 결정: 6/15 월 / 6/22 일 / 슬립)
- ✅ `docs/HANDOFF.md` §1 M4 completed 표기
- ✅ SWARM_LEDGER §M4 종료 entry

R-M5-01 미응답 또는 부분 응답 시: M5 진입 1~7일 슬립 + GA 일자 재조정.

---

## 2. M5-W19 작업 큐 (12건 — 운영 활성화 6 + 베타 모집 3 + 실 baseline 3)

### 운영 활성화 트랙 (6건)

#### W19-O1 — C-13 사업자 / 통신판매업 / RC payout 활성화

- **책임**: legal (lead) + devops (RC dashboard) + 사용자 (실 서류)
- **선행**: R-M5-01 §1 응답 "완료"
- **산출물**:
  - RevenueCat Publisher 정보 등록 완료
  - 결제 수령 계좌 RC 연결 확인
  - 통신판매업 신고증 사본 → Apple App Store Connect + Google Play Console 업로드
- **DoD**: RC dashboard에서 첫 sandbox 결제 1건 실 매출 처리 확인 + 양 스토어 신고증 업로드
- **시작**: W19 D-1 (2026-06-09 월)

#### W19-O2 — Slack #security webhook URL 활성화 (alert stub → live mode)

- **책임**: security (lead) + devops (vault secret 등록)
- **선행**: R-M5-01 §2 응답 "완료" + W17-S4 vault schema commit
- **산출물**:
  - GitHub Actions secret `SLACK_SECURITY_WEBHOOK` 등록 (W15-W17 devops AUDIT_ALERT_SECRETS.md §3 단계 4 절차)
  - Supabase vault.secrets에 동일 URL 등록 (양쪽 등록 정책)
  - `security-alert-stub.yml` → `security-alert.yml` 이름 변경 + workflow_dispatch input `mode=paper` → `mode=live` 기본값 전환
  - dry-run 1회 (인위적 위반 1건 → Slack 채널에 메시지 도착 확인)
- **DoD**: live mode 1회 dry-run 성공 + R-W15-02 closed + R-30 cron 등록 (또는 수동 TRUNCATE) + R-27 grep guard CI rule
- **시작**: W19 D-1

#### W19-O3 — 약관 / 개인정보처리방침 본 문서

- **책임**: legal (lead) + planner (UX 검토)
- **선행**: docs/13_payment_policy / docs/16_privacy_policy / docs/17_terms_of_service v0.3 봉인본 + W17-S3 Privacy Manifest evaluator
- **산출물**:
  - `docs/legal/TERMS_OF_SERVICE.md` 정식본 (영문 + 한국어 v0.3 봉인본 기반)
  - `docs/legal/PRIVACY_POLICY.md` 정식본
  - apps/mobile에 약관 본문 import (`Settings → Legal`)
  - GDPR 13개국 / CCPA 캘리포니아 권리 명시
  - 약관 effective date 2026-06-09 (W19 진입일)
- **DoD**: 양 문서 정식본 commit + 앱 내 표시 + Privacy Manifest evaluator 5/5 green 유지
- **시작**: W19 D-2 (2026-06-10 화)

#### W19-O4 — App Store Connect / Play Console 운영 계정 점검

- **책임**: devops (lead) + frontend (앱 메타데이터)
- **선행**: TestFlight Internal / Play Internal 배포 (W18-02)
- **산출물**:
  - App Store Connect: 본 출시 정보 (스토어 설명 영문 + 스크린샷 6장 + 미리보기 영상 옵션 + 가격 freemium + IAP 2건)
  - Play Console: 본 출시 정보 동일 + 데이터 안전성 양식
  - 외부 베타 테스트 (TestFlight 외부 / Play Open Testing) 활성화 — R-M5-01 §3 응답 시
- **DoD**: 양 스토어 metadata 완성도 100% + 외부 베타 활성화 (응답 시)
- **시작**: W19 D-1

#### W19-O5 — 운영 manual / runbook 활성화

- **책임**: devops (lead) + 12명 agent 각자 runbook 갱신
- **선행**: ALERT_RUNBOOK W15 + AUDIT_ALERT_SECRETS W15 + 각 agent 도메인 runbook
- **산출물**:
  - `docs/runbooks/SECURITY_REVIEW.md` M5 mode (실 alert 활성화 후 P0/P1/P2 처리 절차)
  - `docs/runbooks/DATA_POLICY.md` M5 mode (실 사용자 데이터 처리)
  - `docs/runbooks/RETENTION_POLICY.md` M5 mode (30일 grace + DSR)
  - `docs/runbooks/CUSTOMER_SUPPORT.md` (legal CS 템플릿 + EN/KR 2종)
  - on-call 회전 표 (R-M5-01 §2.4 응답 기반)
- **DoD**: 5개 runbook commit + on-call 회전 표 시작
- **시작**: W19 D-3 (2026-06-11 수)

#### W19-O6 — 결제 sandbox 실 매출 dry-run (D-018 가격 적용)

- **책임**: backend (lead) + devops (RC 환경)
- **선행**: W19-O1 RC publisher 등록 + W17-S6 DSR 모듈 + **D-018 봉인 가격 ($4.99/mo · $49.99/yr)**
- **산출물**:
  - **Apple App Store Connect 가격 등록**: Premium Monthly Tier 5 ($4.99) + Premium Annual Tier 50 ($49.99) — Apple Pricing Matrix 기준
  - **Play Console 가격 등록**: KRW 환산 권고 (예: 6,500원 / 65,000원, Google 환산률 자동)
  - **StoreKit Configuration 갱신**: `apps/mobile/StoreKit/dash2zero.storekit` premium_monthly $4.99 + premium_annual $49.99 (qa context에 이미 작성된 값과 정합)
  - Apple sandbox account 1개 / Play License Tester account 1개로 실 결제 흐름 검증
  - RC webhook 수신 → audit_log 적재 → entitlement 활성화 → mobile 화면 premium UI 노출
  - 환불 시뮬레이션 (REFUND event) → entitlement 비활성화 → premium UI 해제
- **DoD**: 결제 흐름 양 스토어에서 1회 PASS + 환불 흐름 1회 PASS + RC dashboard에 매출 1건 표시 ($4.99 net $3.49 또는 $49.99 net $34.99 확인)
- **시작**: W19 D-2

### 베타 모집 트랙 (3건)

#### W19-B1 — 모집 글 작성 + 게시

- **책임**: pm (lead) + planner (마이크로카피)
- **선행**: R-M5-01 §3 응답 (모집 채널 + 인원 + 시점 결정)
- **산출물**:
  - Reddit r/Korean 게시글 (영문, 30~60단어 + 스크린샷 3장 + TestFlight/Play 외부 링크)
  - Discord 한국어 학습 커뮤니티 알림
  - 지인 채널 (사용자 본인 네트워크)
  - 모집 현황 추적 sheet (`docs/pm/BETA_RECRUITMENT_TRACKER.md`)
- **DoD**: 첫 24시간 안에 5명 이상 가입 + 1주 안에 30명 목표 달성 (R-07 mitigation)
- **시작**: W19 D-1 또는 D-3 (R-M5-01 §3.3 응답)

#### W19-B2 — 베타 사용자 onboarding flow

- **책임**: frontend (lead) + designer (UX 토큰)
- **선행**: M2 onboarding flow (이미 구현)
- **산출물**:
  - 베타 사용자 전용 환영 메시지 ("dash2zero 베타에 오신 것을 환영합니다 — 피드백을 보내주세요")
  - CS 채널 안내 (R-M5-01 §3.6 응답 기반)
  - 베타 한정 무료 premium 1개월 권리 (R-07 mitigation 강화) — 선택 사항, 사용자 결정
- **DoD**: 베타 user_id에 `is_beta=true` 플래그 + 환영 화면 1회 표시
- **시작**: W19 D-3

#### W19-B3 — CS 채널 활성화

- **책임**: legal (lead) + pm
- **선행**: R-M5-01 §3.6 응답
- **산출물**:
  - CS 이메일 자동 응답 템플릿 (EN/KR 2종 — legal FAMILY_SHARE_OPS §CS 템플릿 패턴)
  - 환불 처리 절차 (legal docs/13 §환불)
  - DSR 요청 처리 (privacy_policy §DSR)
  - 응답 SLA (R-M5-01 §3.4: 24h / 48h / best-effort)
- **DoD**: CS 채널 active + 첫 응답 1건 처리 (또는 첫 1주 무응답 baseline)
- **시작**: W19 D-2

### 실 baseline 14d 수집 트랙 (3건)

#### W19-D1 — 실 사용자 baseline 14d 시작

- **책임**: analytics (lead) + devops (cron 가동)
- **선행**: M3 게이트 #4 baseline 3-source + M4 회귀 안정
- **산출물**:
  - 실 베타 사용자 30명 활동 신호 적재 (synthetic seed에서 dogfood + 실 사용자로 cohort 전환)
  - Day-0 (W19 D-1) snapshot 첫 실 사용자 cohort commit
  - `metrics/daily/2026-06-{09~22}.json` 14건 누적
  - `is_dogfood` boolean 컬럼 추가 (Q-OPS-W15-007 / RISK_REGISTER §3.1 해소)
- **DoD**: Day-0~13 14건 누적 + 실 사용자 cohort 30명 신호 적재 + PRD §8.2 threshold check 1회 실행
- **시작**: W19 D-1 (베타 사용자 첫 활동 시점)

#### W19-D2 — Mastered/Weak event emit 실 사용자 검증

- **책임**: analytics (lead) + frontend
- **선행**: W15-03 emit helpers commit
- **산출물**:
  - 실 사용자 lesson 활동 → `srs_mastered_reached` / `srs_mastered_lost` / `srs_weak_flagged` emit 확인
  - Firebase DebugView로 12 properties 전체 적재 확인
  - SQL view 집계로 `mastered_per_user_per_week` / `weak_rate` 1주 측정
- **DoD**: Firebase에서 30명 사용자 emit log 확인 + SQL view 1회 집계 → BASELINE_METRICS 갱신
- **시작**: W19 D-3

#### W19-D3 — 베타 사용자 피드백 첫 1주 분석

- **책임**: pm (lead) + planner (제품 결정) + analytics
- **선행**: W19-B1 모집 글 + W19-B2 onboarding + W19-B3 CS 채널
- **산출물**:
  - 베타 사용자 응답 분석 (UX 문제 / 콘텐츠 품질 / 결제 흐름 / 다른)
  - GA 직전 hotfix 후보 분류 (P0: GA 차단 / P1: GA 후 1주 / P2: GA 후 이연)
  - `docs/pm/BETA_FEEDBACK_FIRST_WEEK.md`
- **DoD**: 30명 응답 ≥ 50% 수집 + hotfix 분류 + GA 일자 reconfirm
- **시작**: W19 D-5 (2026-06-13 토)

---

## 3. M5-W20 GA 작업 큐 (3건 — GA + post-GA 모니터링)

### W20-01 — GA 출시 (Apple + Google 본 출시 심사 제출 + 통과)

- **책임**: devops (lead) + frontend + legal
- **선행**: W19 완료 + M5 hotfix (P0)
- **산출물**:
  - Apple App Store Connect "Submit for Review" 클릭
  - Google Play Console "Production Track" 활성화
  - 심사 통과 후 GA timeline:
    - 6/15 월 GA: 6/12 금 심사 제출 → 6/13~14 심사 → 6/15 통과 → 본 출시
    - 6/22 일 GA: 6/19 금 심사 제출 → 6/20~21 심사 → 6/22 통과
- **DoD**: 양 스토어 production 출시 + first download 1건 확인
- **시작**: W20 D-1 또는 D-4 (사용자 GA 일자 결정)

### W20-02 — 출시 후 1주 모니터링

- **책임**: 12명 agent 전원 + orchestrator (통합)
- **선행**: GA 출시
- **산출물**:
  - 매일 nightly cron green 확인 (실 사용자 trafffic 반영)
  - Crashlytics + Sentry 알람 모니터 (M4 W17-Q2 임계값 적용)
  - 매출 / 환불 / DSR 요청 / 신고 추적
  - 1주차 KPI dashboard (lesson_complete_rate / D-3 retention / Day-1 streak / paywall_view_to_purchase 4 KPI)
- **DoD**: 1주차 KPI dashboard commit + 회귀 0 + 매출 (sandbox 외) 1건+ + 사용자 응답 SLA 24h/48h 준수
- **시작**: GA + D-0 ~ GA + D-7

### W20-03 — Beta Handoff rollup

- **책임**: orchestrator (lead) + 12명 agent 협업
- **선행**: GA 출시 + 1주 모니터링
- **산출물**:
  - `context/rollups/20260622-M5-beta-launch.md` (또는 GA 일자 기준)
  - M0~M5 통합 산출물 인덱스
  - 누적 결정 / risk / ADR 인덱스
  - 외부 팀 인수 가이드 (clone → 실행 → demo → seed → runbook → handoff)
- **DoD**: rollup commit + HANDOFF.md §1 M5 completed 표기 + SWARM_LEDGER §M5 종료 entry
- **시작**: GA + D-7

---

## 4. M5 의존성 그래프

```
W19 (6/9~6/15) — 12 작업
  [T+0 즉시 병렬 — R-M5-01 응답 결과 의존]
    ├─ W19-O1  (C-13 / RC payout)              legal + devops + 사용자
    ├─ W19-O2  (Slack alert live mode)         security + devops
    ├─ W19-O4  (스토어 운영 계정)              devops + frontend
    ├─ W19-D1  (실 baseline 14d 시작)          analytics + devops
  [T+0~3일]
    ├─ W19-B1  (모집 글 게시)                  pm + planner
    ├─ W19-O3  (약관 / 개인정보 본 문서)      legal + planner
    ├─ W19-O6  (결제 sandbox dry-run)          backend + devops
    ├─ W19-B3  (CS 채널 활성화)                legal + pm
  [T+2~5일]
    ├─ W19-B2  (베타 onboarding)               frontend + designer
    ├─ W19-D2  (Mastered/Weak 실 사용자)       analytics + frontend
    └─ W19-O5  (운영 runbook 활성화)           devops + 12명
  [T+5~6일]
    └─ W19-D3  (베타 첫 1주 피드백 분석)       pm + planner + analytics

W20 (6/16~6/22) — 3 작업
  [GA 일자 기준]
    ├─ W20-01  (GA 출시 심사 + 통과)           devops + frontend + legal
    ├─ W20-02  (출시 후 1주 모니터링)          12명
    └─ W20-03  (Beta Handoff rollup)           orchestrator + 12명
```

---

## 5. M5 게이트 조건 (사전 정의, 10조건)

| # | 조건 | 책임 |
|---:|---|---|
| 1 | C-13 사업자 + 통신판매업 + RC payout 활성화 | legal + devops + 사용자 |
| 2 | Slack alert live mode 1회 dry-run | security + devops |
| 3 | 약관 / 개인정보처리방침 정식본 commit + 앱 표시 | legal + planner |
| 4 | App Store / Play 운영 metadata 100% + 외부 베타 활성화 (옵션) | devops + frontend |
| 5 | 운영 runbook 5종 commit + on-call 회전 시작 | devops + 12명 |
| 6 | 결제 sandbox 실 매출 1건 PASS + 환불 1건 PASS | backend + devops |
| 7 | 베타 모집 30명 (또는 응답 결과별 목표) | pm + planner |
| 8 | CS 채널 active + 첫 응답 처리 | legal + pm |
| 9 | 실 baseline Day-0~13 14건 누적 + threshold check 1회 | analytics + devops |
| 10 | 베타 첫 1주 KPI dashboard + hotfix 분류 | pm + planner + analytics |

---

## 6. M5 자율 결정 위임 (orchestrator)

| 결정 영역 | 권한 위임 받는 agent | 비고 |
|---|---|---|
| 베타 사용자 무료 premium 1개월 권리 부여 여부 | pm + 사용자 | R-07 mitigation 강화 옵션 |
| 외부 베타 (TestFlight Beta App Review) vs Internal only | devops + 사용자 | R-M5-01 §3.7 응답 |
| GA 일자 6/15 월 vs 6/22 일 | 사용자 + pm | R-M5-01 §1~3 종합 응답 |
| 베타 첫 1주 hotfix P0 분류 임계 | pm + planner | crash-free < 99% / D-3 retention < minimum / 다른 |

---

## 7. M5 Risks

| ID | 항목 | 강도 | mitigation |
|---|---|---|---|
| R-M5-01 (잔존) | 사용자 reconfirm 3건 미해소 | high | 2026-06-02 PM 알림, 6/6 deadline |
| R-M5-02 (신규) | 베타 모집 30명 미달 (R-07 발현) | medium | Reddit + Discord + 지인 + 트위터 + 기타 다중 채널, 무료 premium 1개월 옵션 |
| R-M5-03 (신규) | Apple Beta App Review 반려 | medium | Privacy Manifest evaluator green + age gate evaluator + R-04 mitigation 모두 적용 |
| R-M5-04 (신규) | 실 baseline Day-0~13 14건 누적 못 채움 (모집 슬립 시) | medium | dogfood + synthetic seed로 보강 (M3 패턴 재활용) |
| R-M5-05 (신규) | GA 출시 후 첫 1주 crash > 임계 | high | Crashlytics 알람 + 즉시 hotfix release (24h 안에 Apple expedited review) |
| R-04 (잔존) | 심사 반려 (iOS Privacy Manifest / age gate) | medium | M4 W17-S3 evaluator green + 모의 심사 체크리스트 적용 |

---

## 8. M5 일정 및 GA sensitivity

| 시나리오 | M5 W19 진입 | GA W20 | M0~GA 총 lead time |
|---|---|---|---|
| R-M5-01 모두 완료 + Privacy Manifest green | 2026-06-09 월 | 2026-06-15 월 | 39일 (5/7 ~ 6/15) |
| R-M5-01 §1 진행 중 (6/9 완료) | 2026-06-09 (긴급) | 2026-06-22 일 | 46일 (5/7 ~ 6/22) |
| R-M5-01 §3 = GA 이후 이연 | 2026-06-09 (quasi-GA) | 2026-06-15 월 | 39일 |
| R-M5-01 §1.1 미시작 | 2026-06-16~ (슬립) | 2026-06-29~ | 53일+ |

---

## 9. M5 후속 (post-GA, M5 종료 후 옵션 사이클)

M5 종료(2026-06-22 또는 그 이후) 다음 일정:

- **post-GA 14일 모니터링**: 실 사용자 100명+ 도달 시 ADR 재검증 trigger (STACK_EVOLUTION_PLAN)
- **콘텐츠 batch 2 추가**: starter 60단어 → core 180단어 (CC2-09 / learning sprint)
- **TopikⅠ pack 추가**: 한글 학습 진행 후 (M6 sprint, 옵션)
- **이메일 인증 + OAuth 확장**: Apple/Google 외 (M6 옵션)
- **iPad / Android tablet 적응**: (M6 옵션)

---

## 10. Definition of Done — M5

- [ ] W19 12 작업 통합 commit
- [ ] W20 3 작업 통합 commit (GA 일자 결정에 따라)
- [ ] M5 게이트 10조건 검증 + 판정
- [ ] R-M5-01 closed (응답 수신 + 결정 commit)
- [ ] GA 출시 1건 (Apple + Google 둘 다)
- [ ] 출시 후 1주 KPI dashboard
- [ ] Beta Handoff rollup
- [ ] HANDOFF §1 M5 completed 표기
- [ ] DECISION_LOG ADR 인덱스 최종 (ADR-0001~0008 모두 Accepted)
- [ ] RISK_REGISTER 최종 closed/open 정리

---

## 11. 서명

- M5 entry preview dispatch v0 (사전 양식) 작성: 2026-05-12 orchestrator
- v1 발행 (실 dispatch): 2026-06-08 [TBD: M4 completed + R-M5-01 응답 수신 후]
- 실행 착수: M4 게이트 PASS + R-M5-01 응답 결과 반영 = 2026-06-09 월
- 차단 항목 (v0 시점): 없음
- 다음 orchestrator 호출: Cycle B 통합 (2026-05-15~17, W15 후반 작업 결과)
