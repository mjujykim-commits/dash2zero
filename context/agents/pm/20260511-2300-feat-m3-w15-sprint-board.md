# M3 W15 Sprint Board + Capacity Ledger + REVIEW_QA 갱신 + M3-M5 일정 재계산

- **Agent**: pm
- **작성일**: 2026-05-11 23:00 KST
- **사이클**: M3 W15 진입 직후, 사용자 결정(D-010~D-013) 반영 후 실작업
- **참조**:
  - `context/agents/pm/20260511-2200-chore-m3-w15-readiness.md` (W15 readiness 자가 진단, +40% 부하 우려)
  - `context/rollups/20260511-M3-W15-dispatch-plan-v2.md` (orchestrator dispatch v2)
  - DECISION_LOG D-010 / D-011 / D-012 / D-013 (사용자 결정 4 봉인)
- **사용한 Skill**: humanizer (built-in) · taste-skill

---

## 1. 작업 요약

사용자 자율 결정("C-13 등 운영 blocker 무시, 제품 개발 몰두") 반영 → 4개 산출물 작성/갱신:

| # | 산출물 | 경로 | 상태 |
|---|---|---|---|
| 1 | W15 Sprint Board (12명 트랙) | `docs/pm/W15_SPRINT_BOARD.md` | 신규 작성 |
| 2 | Capacity Ledger | `docs/pm/CAPACITY_LEDGER.md` | 신규 작성 |
| 3 | REVIEW_QA PM 섹션 status 갱신 + Q-PM-W15-004 신규 | `docs/REVIEW_QA.md` Q-PM-W15-001/002/003/004 | 갱신 + 신규 1건 |
| 4 | M3-M5 일정 재계산 | 본 문서 §3 | 본 컨텍스트 기록 |

`docs/harness/HARNESS_EXECUTION_BOARD.md`는 3-workstream 마일스톤 SSOT로 그대로 유지하고, W15 12-트랙 일일 운영판은 별도 `docs/pm/W15_SPRINT_BOARD.md`로 분리 (책임 경계 명확화).

---

## 2. 핵심 결정 (PM 자율 권한)

### 2.1 W15 sprint board 12명 트랙 정렬

- 12명 시니어 페르소나 모두 코드 트랙 배정 (운영 트랙 0건)
- READY 11 / ACTIVE 1 (pm 본인) / HIGH LOAD 1 (analytics 4 큐 동시)
- DEFERRED-M5 표기 5건: C-13 7항목 / Slack 실 webhook / 실 베타 모집 / RC payout / App Store 운영
- 7 작업(W15-01 ~ W15-08 + planner D-013) 5/12(월) 동시 착수

### 2.2 Capacity envelope 4종 가이드 발행

| Sprint 유형 | 권장 | Hard cap |
|---|---|---|
| 표준 (M2-style) | 1,000-1,400줄 / 10-12 파일 | 1,800줄 / 25 파일 |
| fixture-heavy (M3-W14, W15) | 1,500-1,800줄 (보정) / 30-50 파일 | 2,200줄 / 70 파일 |
| operational (M5 entry, GA) | 600-900줄 + 운영 | 1,300줄 |
| Buffer (W19/W20) | 0-600줄 hotfix only | 1,000줄 |

W15는 "fixture-heavy 상단 (~1,750줄 보정)" 위치 — 캐파 한계 영역. 사용자 결정으로 운영 트랙이 0건 정렬되어 코드 캐파 envelope 안에 fit 가능.

### 2.3 REVIEW_QA Q-PM-W15-001/002/003 status (PM 자율 갱신)

- **Q-PM-W15-001 (콘텐츠 batch)**: ESCALATED → M3 W15 learning agent. content 3 fixtures + Starter 60 그대로 유지.
- **Q-PM-W15-002 (C-13)**: 무시 — 사용자 결정으로 M5+ 이연. M5 entry sprint(W19)에서 reconfirm.
- **Q-PM-W15-003 (Slack)**: M5 이연 — stub 모드만 W15 작성, 실 webhook URL은 M5 reconfirm.
- **Q-PM-W15-004 (M3 게이트 갱신, 신규)**: real-user baseline 14d 수집 → 하네스 수집 파이프 검증으로 변경됨을 SSOT 동기화 추적. W16 dry-run(5/20) 시점 검증.

### 2.4 M5 entry reconfirm 항목 우선순위 (PM 자율)

M5 entry sprint(2026-06-09 W19) 진입 직전 사용자 reconfirm 필수 3건, PM 권고 우선순위:

1. **(P0) C-13 사업자 등록 / 통신판매업 / RC payout** — paid release 직접 차단, lead time 2-4주이므로 W19 시점에 늦으면 GA 슬립
2. **(P0) Slack workspace + #security webhook URL + on-call 회전** — M5 베타 시 운영 alert 채널 필수
3. **(P1) 실 베타 사용자 모집 채널 / 인원 / SLA** — Reddit/Discord/지인 채널 결정 + 30명 모집 lead time 1-2주

---

## 3. M3-M5 일정 재계산 (사용자 결정 반영)

C-13 / 운영 blocker 무시로 GA 차단이 W15 시점에서 해소됨. 단 M5 entry reconfirm으로 회수.

### 3.1 일정표

| Phase | 기간 | 종료일 | 주요 산출 | 게이트 |
|---|---|---|---|---|
| **M3-W15** Harness Hardening | 2026-05-12 월 ~ 05-18 일 | 5/18 | 12명 트랙 7 작업 + ADR-0006 Accepted | W15 종료 rollup |
| **M3-W16** M3 게이트 검증 | 2026-05-19 월 ~ 05-25 일 | **5/25** | baseline trend / nightly cron green / fixture window 검증 / ADR-0007 baseline 저장소 outline | M3 게이트 통과 (10조건 v2) |
| **M3 종료** | — | **5/26 화** | M3 completed rollup | M4 진입 신호 |
| **M4-W17** Security+QA | 2026-05-26 화 ~ 06-01 일 | 6/1 | secret 회전 ADR-0008, RLS hardening, QA test cases 강화 | — |
| **M4-W18** QA 안정화 | 2026-06-02 월 ~ 06-08 일 | 6/8 | 회귀 14-day 안정 검증, EAS staging 점검 | M4 게이트 통과 |
| **M5-W19** Beta entry | 2026-06-09 월 ~ 06-15 일 | **6/15** | 베타 모집 / 약관 / RC payout / Slack URL / 실 베타 baseline 시작 (사용자 reconfirm 3건 필수) | M5 베타 게이트 |
| **GA-W20** GA 출시 또는 슬립 | 2026-06-16 월 ~ 06-22 일 | **6/22** (조정 가능) | GA 출시 또는 buffer 흡수 | GA 신호 |

### 3.2 사용자 결정 영향

- **C-13 무시 (D-012)**: W15-W18 코드 sprint 직접 차단 0. 단 M5 entry W19 시점에 reconfirm 필수 — 미해소 시 무료 출시(scope 축소) 또는 GA 슬립 결정 필요.
- **Slack URL 이연 (D-011)**: W15 stub 모드 작동, M3 게이트 부분 충족 (실 alert 통합은 M5).
- **실 베타 모집 이연 (D-012)**: W15 baseline은 synthetic + dogfood. M3 게이트 4번이 "수집 파이프 동작 검증"으로 갈음(D-010). real-user 14-day는 M5에서 시작.
- **PRD threshold planner 자율 (D-013)**: planner가 W15 동안 4 KPI band commit, M3 게이트 10조건에 포함.

### 3.3 일정 자율 결정 사항 (PM)

- **M3 종료 일자 5/26 (화) 확정**: dispatch v2 일자(5/25)에서 +1일, M3 종료 rollup 작성 시간 buffer 확보.
- **GA 목표 W20/6/22 (일)** 또는 6/15 (월) 둘 중 선택 가능 — GA를 6/15 월요일에 두면 W20 전체가 buffer로 흡수됨, 6/22 일요일에 두면 W20 6일차 출시 + 1일 안정화. **PM 권고: 6/15 월 GA, W20 전체 buffer**. (안전성 우선)
- 단 사용자 자율 결정 권한이므로, GA 일자 6/15 vs 6/22는 M4 게이트 통과 시점(6/8 일)에 사용자에게 reconfirm 받음.

### 3.4 critical path (수정)

```
W15 (5/12-18) ─→ W16 게이트 검증 (5/19-25) ─→ M3 종료 rollup (5/26)
  └─ baseline 파이프 동작 검증 (D-010)이 critical path 대체

M4-W17 (5/26-6/1) ─→ M4-W18 (6/2-8) ─→ M4 게이트 통과 (6/8)
  └─ secret 회전 ADR-0008 + 회귀 안정

M5-W19 (6/9-15) ─→ M5 베타 게이트 (6/15)
  └─ 사용자 reconfirm 3건이 critical path 핵심 — 늦으면 GA 슬립

GA-W20 (6/16-22) → GA 출시 (6/15 월 권고 또는 6/22 일)
```

---

## 4. 위험 / 후속 추적

| ID | 위험 | 강도 | 추적 |
|---|---|---|---|
| R-W15-01 | analytics 4 큐 동시 부하 (HIGH LOAD) | medium | W15 mid-sprint A 점검(5/14)에서 SRS 28 진척 < 50% 시 qa 분담 자율 결정 |
| R-W15-02 | W15-06 stub 모드의 회귀 catch가 실 alert 부재 시 누락 risk 잔존 | low | M5 entry stub→실 webhook 활성화 절차를 ALERT_RUNBOOK에 명시 |
| R-M5-01 | M5 entry 시점(6/9) 사용자 reconfirm 3건 미해소 → GA 슬립 | high | 본 문서 §2.4 P0/P1 우선순위 + W19 진입 1주 전(6/2) PM이 사용자에게 reconfirm 알림 송출 |
| R-M3-04 | M3 게이트 갱신 SSOT 동기화 미완료 (HARNESS_EXECUTION_BOARD §2.3) | medium | Q-PM-W15-004 추적, W16 dry-run(5/20) 시점 검증 |

---

## 5. 다음 추천 액션

1. **PM 본인 (5/12 월 21:00)**: Day-1 점검 — 7 작업 동시 착수 첫 commit 확인.
2. **PM 본인 (5/14 수 21:00)**: mid-sprint A 점검 (orchestrator 사이클 A 협업), Q-PM-W15-001 learning agent 진척 확인.
3. **PM 본인 (5/20 수 21:00)**: M3 게이트 dry-run 진단 + Q-PM-W15-004 SSOT 동기화 검증.
4. **PM 본인 (6/2 화 ~ 6/8 일)**: M5 entry reconfirm 3건 사용자 알림 송출 + M5 sprint board 사전 양식.
5. **architect**: `HARNESS_EXECUTION_BOARD.md` §2.3 W1-M4 게이트 문구 D-010 정합 갱신 (Q-PM-W15-004 추적).

---

## 6. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-11 23:00 | M3 W15 실작업 완료 — sprint board / capacity ledger / REVIEW_QA 4건 / M3-M5 일정 재계산 산출. 사용자 결정 D-010~D-013 정렬 | pm |
