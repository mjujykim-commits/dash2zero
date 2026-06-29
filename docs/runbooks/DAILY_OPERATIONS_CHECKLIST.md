# Daily / Weekly Operations Checklist (1인 개발자 + 13 agent swarm)

> 작성: orchestrator
> 책임: 1인 개발자가 M3~GA 동안 매일 실제로 사용 가능한 routine
> 작성일: 2026-05-12 (M3 W15 사전 작업 마감 최종)
> 사용 시작: 2026-05-13 (W15 Day-2) 이후 매일
> 갱신 trigger: sprint 진입/종료 시점 + R-M5-01 응답 후 + GA 후

---

## 0. 사용 방법

매일 본 문서를 보면서 routine 진행. 각 항목 [ ]에 ✅ 또는 X 표기. 일일 종료 시 사용자가 본인의 GitHub repo private notes 또는 1Password vault에 commit. 추적 sheet:

```
context/operations/daily/YYYY-MM-DD.md  (사용자 본인 작성, repo commit 옵션)
```

---

## 1. 매일 routine (3 cycles)

### 1.1 09:00 morning routine (~15분)

- [ ] **GitHub 알림 확인**: PR / Issue / Actions 실패 알림 (Crashlytics + Sentry 알람 + nightly cron 실패)
- [ ] **dash2zero swarm coding 진행률 확인**: `SWARM_LEDGER.md` 어제 entry + 오늘 dispatch 작업 큐
- [ ] **RISK_REGISTER 점검**: 오늘 처리해야 할 risk 1건 이상 명시 (`docs/risk/RISK_REGISTER.md §3 일자별 추적 trigger`)
- [ ] **PM W15_SPRINT_BOARD 점검**: 오늘 critical path 작업 명확화
- [ ] **사용자 인박스 확인**: R-M5-01 알림 (6/2 이후) / 베타 사용자 CS (6/9 이후) / Apple/Google 알림 (6/15 이후)
- [ ] **Crashlytics + Sentry 임계 확인** (M4 W17 이후): crash-free users / error rate (정상 ≥ 99.5% / < 1%)
- [ ] **첫 작업 시작 일자/시각 기록**: `context/operations/daily/{YYYY-MM-DD}.md` 신규

### 1.2 점심 1회 check (~5분)

- [ ] **nightly cron 결과 확인**: `.github/workflows/eval-nightly.yml` 5 evaluator green / RLS hybrid green (M4 W17 이후)
- [ ] **baseline snapshot 적재 확인**: `metrics/daily/{YYYY-MM-DD}.json` 오늘 1건 commit
- [ ] **새 PR 또는 issue 응답**: 24h SLA 준수 (또는 best-effort)
- [ ] **사용자 명시 결정 응답 필요한 항목**: orchestrator escalation log 확인

### 1.3 22:00 close routine (~15분)

- [ ] **오늘 commit 내역 review**: `git log --oneline --since=today`
- [ ] **DoD 충족 확인** (AGENTS.md §7): 7 항목 — 코드/테스트/문서/context/harness/보안/orchestrator 승인
- [ ] **agent context 기록 commit** (사용한 agent별): `context/agents/{role}/{YYYYMMDD-HHMM}-{branch}-{sha}.md`
- [ ] **외부 가시 변경 있으면 CHANGELOG 갱신**
- [ ] **risk register 갱신**: 오늘 closed 또는 신규 risk 명시
- [ ] **내일 critical path 작업 1건 사전 정렬**: 09:00 morning routine 입력
- [ ] **22:30 이전 close 권고** (1인 개발자 캐파 보호, R-06)

---

## 2. 주간 routine

### 2.1 매주 월요일 09:30 (sprint 시작)

- [ ] **이번 주 sprint 작업 큐 review**: dispatch plan v2 또는 sprint plan 확인
- [ ] **자율 결정 위임 사항 확인**: 이번 주 agent 자율 영역 명확화
- [ ] **사용자 명시 결정 필요한 항목**: 사전 알림 (e.g. R-M5-01 6/2 화 송출)
- [ ] **이번 주 GA 일자 영향 평가**: 슬립 신호 발생 시 mitigation 점검

### 2.2 매주 수요일 21:00 (mid-sprint check)

- [ ] **PM W15_SPRINT_BOARD 진척률 갱신**: green/yellow/red 표시
- [ ] **mid-sprint orchestrator 통합 사이클 호출**: 진행률 분석 + blockers 해소
- [ ] **자율 결정 누락 항목 점검**: agent별 진척 + 충돌 위험 사전 차단

### 2.3 매주 일요일 21:00 (sprint 종료)

- [ ] **Sprint rollup 작성**: `context/rollups/{YYYYMMDD}-{milestone}-{sprint}-complete.md`
- [ ] **HARNESS_COMPLIANCE_AUDIT 갱신**: 5층 완성도 % 재계산
- [ ] **RISK_REGISTER closed/new 갱신**: status 일자 + 해소 방법 + 증거 명시
- [ ] **다음 sprint 진입 신호 확인**: 차단 항목 0 검증
- [ ] **Skill 사용 점검** (orchestrator 책임): 모든 agent context의 "사용한 Skill" 항목 확인

### 2.4 매주 토요일 (옵션, 캐파 여유 시)

- [ ] **사전 양식 보강**: M3 종료 template / M4 dispatch / M5 dispatch / pre-mortem retrospective
- [ ] **외부 SaaS 비용 monitor**: Supabase / RC / Firebase / GitHub Actions usage dashboard
- [ ] **dash2zero project skill update**: skill-creator로 신규 skill 생성 (필요 시)

---

## 3. Sprint-specific tasks (M3~GA)

### 3.1 M3 W15 Cycle B (2026-05-13~17)

- [ ] (5/13 화) W15-09 SRS-056~060 evaluator enum 활성화 진척
- [ ] (5/13 화) W15-10 privacy evaluator union 3종 진척
- [ ] (5/13 화) W15-02b baseline Day-0 적재 (2026-05-13.json)
- [ ] (5/13 화) W15-11 PM REVIEW_QA 정합 시작
- [ ] (5/14 수) mid-sprint orchestrator 통합 사이클 — W15 Cycle B 진행률 점검
- [ ] (5/15 목) W15-04b SRS 57/57 strict nightly green 1차 확인
- [ ] (5/15 목) W15-06b alert stub dev 검증 (W15-01 머지 후)
- [ ] (5/16 금) W15-07b eval-nightly cron 단계 1~3 진입
- [ ] (5/17 토) Cycle B 통합 완료 + RISK_REGISTER R-23/R-24/R-31/R-32 closed
- [ ] (5/18 일) **Cycle C — W15 sprint 종료 rollup**

### 3.2 M3 W16 게이트 검증 (2026-05-19~25)

- [ ] (5/19 월) W16-01 baseline Day-7 시작
- [ ] (5/20 화) **mid-sprint orchestrator A** — baseline + ADR-0007 draft 점검
- [ ] (5/21 수) W16-02 ADR-0007 draft → architect 회람
- [ ] (5/22 목) W16-02 ADR-0007 final + orchestrator 승인 → **D-018 봉인**
- [ ] (5/23 금) **mid-sprint orchestrator B** — ADR-0007 Accepted + baseline check-thresholds 1회 실행
- [ ] (5/24 토) W16-05 REVIEW_QA W15 라운드 status 100% 갱신 (pm 12명 협업)
- [ ] (5/25 일) **W16-03 M3 게이트 검증** — 10조건 검증 + 판정 + rollup draft
- [ ] (5/26 화) **W16-04 M3 completed rollup commit** + CHANGELOG `M3-completed` release tag + M4 dispatch v1 발행

### 3.3 M4 W17 Security+QA 시작 (2026-05-26~6/1)

- [ ] (5/26 화) **M4 진입 신호** — HANDOFF §1 M4 표기 + DECISION_LOG D-019 봉인 (ADR-0008 Accepted)
- [ ] (5/27 수) W17-S1 ADR-0008 Secret 회전 정책 + W17-S2 RLS hybrid + W17-Q1 E2E Phase 0 동시 시작
- [ ] (5/28 목) W17-S3 Privacy Manifest evaluator + **Play 데이터 안전성 양식** (Sx-04 mitigation)
- [ ] (5/29 금) W17-S5 RLS-ADV-014 + W17-S6 DSR 모듈
- [ ] (5/30 토) W17-Q2 Crashlytics + Sentry 임계값
- [ ] (5/31 일) W17 mid-sprint 통합
- [ ] (6/1 일) W17 종료 — 8 작업 통합 + W18 진입

### 3.4 M4 W18 회귀 안정 (2026-06-02~6/8)

- [ ] (**6/2 화** P0) **R-M5-01 사용자 reconfirm 알림 송출** — `context/rollups/20260512-R-M5-01-user-reconfirm-template.md` 양식 사용자에게 전달
- [ ] (6/2 화) W18-01 회귀 14d 모니터 시작
- [ ] (6/4 목) mid-sprint orchestrator — 회귀 14d 8d 시점 + EAS staging
- [ ] (6/5 목) R-M5-01 응답 reminder 1차 (deadline 6/6)
- [ ] (**6/6 금** P0) **R-M5-01 응답 deadline** — 미응답 시 default 정책 적용 (Q-M5-O1 mitigation)
- [ ] (6/7 토) W18-02 EAS staging + TestFlight Internal 배포
- [ ] (**6/8 일** P0) **M4 게이트 13조건 검증 + M4 completed rollup + M5 dispatch v1 발행**

### 3.5 M5 W19 베타 entry (2026-06-09~6/15)

- [ ] (6/9 월) **M5 진입 신호** — W19-O1 C-13 활성화 + W19-O4 스토어 metadata + W19-D1 실 baseline Day-0
- [ ] (6/9 월) W19-B1 베타 모집 글 게시 (Reddit + Discord + 지인)
- [ ] (6/10 화) W19-O2 Slack alert live mode + W19-O3 약관 정식본 + W19-O6 결제 sandbox dry-run
- [ ] (6/11 수) mid-sprint — 모집 진행률 (목표: 24h 5명 / 1주 30명)
- [ ] (6/11 수) W19-O5 운영 runbook 5종 활성화
- [ ] (6/13 금) W19-D3 베타 첫 1주 피드백 분석 + hotfix 분류
- [ ] (6/14 토) GA 직전 review — Pre-mortem score ≥ 4 시나리오 8건 cross-check
- [ ] (6/15 월) **GA 일자 결정 1: 6/15 월 GA 출시** (사용자 응답 기반, 옵션 A)

### 3.6 GA W20 (2026-06-16~6/22)

- [ ] (6/15 또는 6/22) **GA 출시** — Apple App Store + Google Play production
- [ ] (GA + D-0~7) Sx-02 daily crash monitor (Crashlytics + Sentry)
- [ ] (GA + D-7) **W20-03 Beta Handoff rollup** + HANDOFF §1 M5 completed 표기
- [ ] (6/22 일) **GA 일자 결정 2: 6/22 일 GA 출시** (사용자 응답 기반, 옵션 B)

### 3.7 Post-GA 첫 1주

- [ ] (매일) Crashlytics 알람 임계 확인 (crash-free < 99.5% 시 즉시 hotfix)
- [ ] (매일) Pre-mortem score ≥ 4 시나리오 발화 여부 cross-check
- [ ] (매일) CS 응답 SLA (24h or 48h or best-effort, R-M5-01 §2.4 응답 기반)
- [ ] (D+7) 1주차 KPI dashboard commit + Pre-mortem retrospective draft

---

## 4. 일자별 critical path 표 (M3~GA 한 페이지)

| 일자 | sprint | critical path | 책임 | 사용자 행동 |
|---|---|---|---|---|
| 5/13~17 | W15 Cycle B | Cycle B 7건 작업 | 12명 agent | morning + close routine |
| 5/18 | W15 종료 | Cycle C rollup | orchestrator | sunday routine |
| 5/19~24 | W16 sprint | baseline + ADR-0007 | analytics + architect | morning + close routine |
| 5/25 | W16 게이트 | 10조건 검증 | orchestrator | sunday + sprint 종료 |
| **5/26** | **M3 종료** | M3 completed + M4 dispatch v1 + D-019 봉인 | orchestrator | M3 종료 commit + CHANGELOG release tag |
| 5/27~31 | M4 W17 | 8 작업 (보안+QA) | security + qa + devops | morning + close routine |
| **6/2** | M4 W18 D-1 | **R-M5-01 PM 알림 송출** | pm + 사용자 | 사용자에게 양식 전달 |
| 6/6 | M4 W18 D-5 | R-M5-01 deadline | 사용자 | 사용자 응답 (3건) |
| **6/8** | M4 종료 | M4 게이트 13조건 + rollup + M5 dispatch v1 | orchestrator | M4 종료 commit |
| **6/9** | M5 W19 D-1 | 운영 활성화 6 + 베타 모집 시작 + 실 baseline | 12명 + 사용자 | C-13 / Slack / 모집 동시 활성 |
| 6/13 | M5 W19 D-5 | 베타 첫 1주 피드백 | pm + planner | hotfix 분류 |
| **6/15 또는 6/22** | **GA** | GA 출시 + Sx-02 monitor | devops + frontend + legal | GA 출시 / D-7 모니터링 |

---

## 5. 비상 시 (위반 / 차단 / 슬립)

### 5.1 Crashlytics 알람 (crash-free < 99.5%)

1. 즉시 새 commit 차단 (production 출시는 모두 hold)
2. crash log 분석 (24h 안에)
3. hotfix release (Apple expedited review 신청)
4. 24h 안에 fix 안 되면 release rollback 검토

### 5.2 RLS evaluator nightly 1건 fail

1. fixture 변경 / migration 변경 / 코드 변경 중 어느 것이 원인인지 git diff로 확인
2. 1건만 fail이면 hotfix PR (Cycle B 진입 후)
3. 2건 이상 fail이면 cron 일시 중단 + 보강 PR 우선

### 5.3 사용자 R-M5-01 미응답 (6/6 deadline 후)

1. 6/7 토 PM이 default 정책 적용 (Q-M5-O1 mitigation):
   - C-13: 진행 중 가정 → GA 6/22 일 권고
   - Slack: stub 모드 유지 → 베타 alert는 GitHub Actions notification만
   - 베타 모집: 6/9 D-1 게시, 24h 모집 5명 미달 시 무료 premium 1개월 옵션 활성

### 5.4 사용자 캐파 위반 (R-06)

1. PM W15_SPRINT_BOARD에 진척률 red 표시
2. P1 작업 슬립 우선 (P0 작업 보호)
3. buffer 4주 활용 (PM §3.4)
4. buffer 소진 시 GA 7~14일 슬립

---

## 6. agent별 standby 신호

| Agent | standby 활성 신호 | 비활성 (안 부르는 사이클) |
|---|---|---|
| orchestrator | 모든 사이클 (매일) | 없음 — 매일 활성 |
| planner | M5 entry 전 / sprint 진입 시 | M3~M4 일상적 sprint 중 |
| pm | 매주 sprint board 갱신 + R-M5-01 알림 (6/2) | 일상적 일자 |
| designer | 디자인 영향 PR 발생 시 + W17 다크모드 | 일상적 |
| architect | ADR 작성 시 + 5층 영향 변경 시 | 일상적 |
| frontend | mobile PR 발생 시 + emit 변경 | API 영향 없는 sprint |
| backend | API/Edge Function PR + RLS 변경 | UI-only sprint |
| security | RLS / Privacy / audit 영향 PR + M4 entry | 일상적 |
| qa | E2E PR + nightly fail 분석 + M4 게이트 | M5 W19 일상적 |
| learning | content batch / SRS 변경 / M5 검수 | M3~M4 일상적 |
| analytics | event 추가 + baseline 분석 + threshold check | UI-only sprint |
| legal | 약관 / 결제 / 환불 정책 영향 시 + M5 entry | 코드만 sprint |
| devops | CI/CD / EAS / Secret rotation / GA 출시 | 코드만 sprint |

---

## 7. 갱신 trigger

본 checklist는 다음 시점에 갱신:

- **M3 종료 (2026-05-26)**: §3.1~3.2 closed 표기 + §3.3 활성화
- **R-M5-01 응답 (2026-06-06)**: §5.3 default 정책 → 응답 결과 반영
- **GA 출시 (6/15 또는 6/22)**: §3.7 post-GA 활성화 + §3.4~3.6 closed
- **GA 후 6개월**: pre-mortem retrospective + 본 checklist 효용성 review

---

## 8. 사용 동기

이 checklist는 1인 개발자의 **운영 부담을 최소화**하는 목적이다:
- 매일 동일한 routine을 따르면 잊지 않는다
- agent에게 위임한 자율 결정 + 사용자 명시 결정 영역 명확
- 비상 시 5.x 절차로 즉시 행동 가능
- agent standby 신호로 불필요한 사이클 호출 방지

---

## 9. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-12 23:59 | 신규 작성 — 매일 3 cycles + 주간 4 routine + sprint-specific (M3~GA) + 비상 절차 + agent standby 신호. 1인 개발자 운영 부담 최소화 목적. orchestrator 사전 작업 10번째 사이클 최종 |
