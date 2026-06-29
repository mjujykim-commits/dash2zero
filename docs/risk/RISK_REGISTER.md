# dash2zero — Risk Register (R-NN 통합 SSOT)

> 목적: M0~M3에 누적된 모든 R-NN risk를 단일 SoT로 통합. 각 agent가 작성한 context에 분산된 risk를 orchestrator가 통합 책임으로 모은다.
> 갱신 책임: orchestrator (모든 agent의 risk 등록/갱신/closed 표시 통합)
> 작성: 2026-05-12 (M3 W15 Cycle B dispatch 직후)
> SSOT 우선순위: 본 문서 > 각 agent context의 risks 절 > SSOT 산재 표기

---

## 0. 본 문서 작성 시 발견된 R-NN 충돌 (orchestrator 봉인)

여러 SSOT에 분산된 risk를 통합하며 다음 충돌을 발견:

### R-28 충돌 (designer ↔ security)

- **designer R-28** (먼저 등록, M2-S6 lesson chain 구현 시점): "lesson chain STUB → 실 N-카드 fetch" → frontend가 M3 W15에 해소 완료
- **security R-28** (W15 RLS_EVALUATOR_HYBRID_PLAN §134, 신규 등록 의도): "시드 데이터 신뢰성 — 시드가 틀리면 가짜 신뢰"
- **해소 (D-016 봉인)**: designer R-28 ID 유지(먼저 등록 + 이미 closed 후보), security 시드 신뢰성을 **R-33**으로 reroute

### R-29 충돌 (orchestrator Dashboard ↔ security)

- **orchestrator R-29** (Cycle A Dashboard §4, M3 W15 Cycle A 등록): "Phase 2 backend SRS module 본 구현 이전 (W16)"
- **security R-29** (W15 RLS_EVALUATOR_HYBRID_PLAN §135, 신규 등록 의도): "pg_test_role JWT 만료 — 5분 short-lived"
- **해소 (D-017 봉인)**: orchestrator R-29 ID 유지(먼저 등록), security JWT 만료를 **R-34**로 reroute

이 두 결정은 DECISION_LOG D-016/D-017로 봉인 (다음 commit). D-014/D-015와 동일한 cross-track 충돌 패턴(R-26 발현).

---

## 1. Risk ID 체계

| Prefix | 의미 | 예시 |
|---|---|---|
| R-NN | 글로벌 risk (M0~M5 누적) | R-01 ~ R-34 |
| R-W15-NN | W15 sprint 특정 risk (Cycle 단위) | R-W15-01 / 02 |
| R-W16-NN | W16 sprint 특정 risk | R-W16-01 / 02 |
| R-M4-NN | M4 sprint 특정 risk | R-M4-01 / 02 / 03 |
| R-M5-NN | M5 entry 특정 risk | R-M5-01 |
| B-NN | 출시 차단급 (REVIEW_QA §5에서 승계) | B-XX |

---

## 2. 글로벌 risk (R-NN) — M0~M3 누적

### 2.1 Open (잔존)

| ID | 항목 | 강도 | 책임 agent | 해소 트리거 | 등록 SSOT | 등록 일자 |
|---|---|---|---|---|---|---|
| R-01 | 콘텐츠 batch 검수 일정 슬립 (외부 검수자 모집 어려움) | medium/high → medium/medium (D-020) → **low/low (D-021)** | learning + qa | **D-021 봉인 (2026-05-15)**: 외부 검수자 모집 deferred ("제품 완성 후"). **qa 100% fallback 정식 활성** — D-020 cross-review로 형식·정합성 100% 처리, 자연성/문화/받침은 베타 사용자 retroactive 피드백 + qa M4 W17 batch로 보강. R-01 모집 자산 보존 (사용자 호출 시점에 게시) | CONTENT_QUALITY_POLICY §2 / D-021 / D-020 | M1 → D-019 → D-020 → **D-021 deferred** |
| R-02 | C-13 사업자 D-42 미확정 | medium / very high → **deferred (D-021)** | legal + pm | **D-021 봉인 (2026-05-15)**: 제품 완성 후 사용자 reconfirm. 베타 sandbox-only 운영으로 사업자 등록 없이 진행 가능. paid release는 GA 시점 사용자 결정 의존 | MVP_SCOPE / D-012 / D-021 | M1 → D-012 → **D-021** |
| R-03 | RC + Apple/Google IAP sandbox 결제 통합 지연 | medium / high | backend + devops | W10 진입 + W11 buffer + devops 합류 | MVP_SCOPE.md | M1 |
| R-04 | 심사 반려 (iOS Privacy Manifest / age gate) | medium / high | security + legal | M4 W17 Privacy Manifest evaluator + 모의 심사 체크리스트 | MVP_SCOPE.md | M1 |
| R-05 | TTS provider 라이선스 / 단가 변경 | low / medium | backend | Domain Model §7 추상화 (교체 가능 보장) | MVP_SCOPE.md | M1 |
| R-06 | 1인 개발자 주 20시간 가정 위반 | medium / medium | pm | 4주 buffer + P1 6개 슬립 가능 분류 | MVP_SCOPE.md | M1 |
| R-07 | 베타 모집 30명 채우기 실패 | low / low | pm | Reddit + Discord + 지인 다중 채널 | MVP_SCOPE.md | M1 |
| R-08 | Supabase 가격 인상 / 정책 변경 | low / medium | backend + architect | Domain Model 추상화로 vendor 교체 비용 완화 | MVP_SCOPE.md | M1 |
| R-25 | RLS static EXISTS 의미 simplification (W16 hybrid 미도입 시 false negative) | medium | security | M4 W17 hybrid 도입 (ADR-0007 패턴) | RLS_EVALUATOR_HYBRID_PLAN.md | M3 W15 |
| R-27 | audit_log emit 누락 (M4 통합 grep guard 부재) | medium | backend + security | M5 직전 `git grep` CI guard rule (AUDIT_ALERT_RUNBOOK §M5) | AUDIT_ALERT_RUNBOOK.md | M3 W15 |
| R-28 | lesson chain STUB → 실 N-카드 fetch | medium | designer + frontend | M3 W15 frontend 구현 (closed candidacy, Cycle B 종료 시 closed 권고) | LESSON_CHAIN_PATTERN.md | M2-S6 |
| R-29 | Phase 2 backend SRS module 본 구현 이전 (mobile + golden runner 양측 import) | low | backend | M4 W17 Phase 2 commit | M3_GATE_V2_DASHBOARD.md | M3 W15 Cycle A |
| R-30 | paper 모드 dedup 테이블 무한 누적 (W15 stub) | low | security + devops | M5 직전 cron 등록 또는 수동 TRUNCATE | AUDIT_ALERT_RUNBOOK.md / Dashboard | M3 W15 |
| R-31 | SRS-056~060 evaluator enum 미활성 | medium | backend | W15-09 Cycle B 5개 분기 함수 commit (W15 sprint 내) | M3_GATE_V2_DASHBOARD.md | M3 W15 Cycle A |
| R-32 | privacy evaluator union 3종 미반영 (family_share / minor_refund / ccpa_no_sale) | medium | backend + legal | W15-10 Cycle B `scripts/eval/privacy.ts` 분기 3종 추가 | M3_GATE_V2_DASHBOARD.md | M3 W15 Cycle A |
| R-33 (신규, D-016 봉인) | RLS hybrid 시드 데이터 신뢰성 — 시드가 틀리면 가짜 신뢰 (security RLS_HYBRID_PLAN §134 원래 R-28 등록 의도) | medium | security | fixture에 시드 hash 기록 + M4 W17 hybrid 도입 시 검증 | RLS_EVALUATOR_HYBRID_PLAN.md | M3 W15 |
| R-34 (신규, D-017 봉인) | pg_test_role JWT 만료 — 5분 short-lived (security RLS_HYBRID_PLAN §135 원래 R-29 등록 의도) | low | security + backend | evaluator가 발급 직전 갱신 (M4 W17 hybrid 도입 시) | RLS_EVALUATOR_HYBRID_PLAN.md | M3 W15 |

### 2.2 Closed (해소)

| ID | 항목 | 해소 일자 | 해소 방법 |
|---|---|---|---|
| R-12 | SRS sibling copy drift (mobile + Edge) | Phase 1 partial: M3 W15 Cycle A (ADR-0006 Accepted) / Phase 2: M3 W16 (W15_SPRINT_BOARD §12 commit) / **Phase 3 closed: M4 W17 (sibling 제거)** | ADR-0006 3-Phase 분리 |
| R-23 | RLS evaluator 부재 | [예정: M3 W15 Cycle B] | RLS evaluator nightly green |
| R-24 | distractors retire 미검증 | [예정: M3 W15 Cycle B] | `distractors_after_retire` 검증 함수 + content nightly green |
| R-26 | 12명 병렬 cross-track 충돌 | M3 W15 Cycle A (2026-05-12) | D-014 / D-015 봉인 |

---

## 3. Sprint별 risk (R-W15-NN / R-W16-NN / R-M4-NN / R-M5-NN)

### 3.1 W15 sprint risk

| ID | 항목 | 강도 | 책임 | mitigation |
|---|---|---|---|---|
| R-W15-01 | analytics 4 큐 동시 부하 (HIGH LOAD — SRS lead + Mastered/Weak + baseline + content evaluator 보강) | medium → low (Cycle A 1차 commit 완료) | pm + analytics | Cycle A 1차 commit 완료 시점에 부하 분산 확인 |
| R-W15-02 | W15-06 stub 모드의 회귀 catch가 실 alert 부재 시 누락 risk 잔존 | low | security + pm | M5 entry stub→실 webhook 활성화 절차 ALERT_RUNBOOK §M5 명시 |
| Q-W15-1 (해소) | synthetic seed 결정성 | resolved | devops | 결정적 PRNG seed 고정 (W15-02 commit) |
| Q-W15-2 (해소) | dogfood vs synthetic 신호 분리 라벨링 | resolved | devops | M5 `is_dogfood` boolean 컬럼 추가 권고 (Q-OPS-W15-007) |
| Q-W15-3 (해소) | ADR-0006 경계 (workspace 패키지 vs _shared) | resolved | architect | Option A `packages/srs-core` workspace 봉인 |
| Q-W15-4 (해소) | 가격 정합성 — 사업계획서 $1.99 vs qa placeholder $4.99 충돌 | **resolved (2026-05-13)** | 사용자 + orchestrator | D-018 봉인: $4.99/mo · $49.99/yr 채택 |

### 3.2 W16 sprint risk

| ID | 항목 | 강도 | 책임 | mitigation |
|---|---|---|---|---|
| R-W16-01 | baseline 14d cron 중간 1~2일 누락 | medium | analytics + devops | 다음날 보강 commit + 게이트 CONDITIONAL 표시 |
| R-W16-02 | ADR-0007 architect 작성이 W16 D-4까지 못 끝날 위험 | medium | architect | D-3 draft → D-4 final 강제. 미달 시 M3 게이트 #4 별도 검증 |

### 3.3 M4 sprint risk (사전 등록)

| ID | 항목 | 강도 | 책임 | mitigation |
|---|---|---|---|---|
| R-M4-01 | RLS hybrid pg_test_role flake (Supabase ephemeral DB 시작 시간) | medium | security + devops | devops 6단계 게이트 (M3 패턴) + W17 D-3까지 안정화 |
| R-M4-02 | Privacy Manifest 3rd-party SDK manifest 누락 | high | security + legal | Expo + RN + Firebase + RevenueCat 각 SDK 버전 cross-check |
| R-M4-03 | E2E Phase 0 CI 통합 시 Detox build 시간 | medium | qa + devops | Maestro 메인 + Detox sub로 분리 (qa M4_E2E_SUITE_PLAN §2.2) |
| R-M4-04 | **Work Order P0-1 lesson stage 전환 latency 변화** (StageReveal 240ms × 4 stagger + MorphingKoreanWord scale animation → user-perceived advance 지연 가능) | medium | frontend (구현) + analytics (모니터링) | (1) analytics가 `lesson_completed.duration_sec` p50/p95 변화 W17 D-4까지 추적, baseline 대비 +0~+400ms 이내 (Work Order §3.4 eval 기준). (2) p95 +500ms 초과 시 StageReveal delayIndex 60ms → 40ms 단축 또는 stagger 비활성. (3) reduce-motion 시 translateY 비활성으로 이미 짧음 — 별도 mitigation 불필요. 등록 사유: Work Order §11 (2) 명시 의무 |

### 3.4 M5 entry risk

| ID | 항목 | 강도 | 책임 | mitigation |
|---|---|---|---|---|
| R-M5-01 | M5 entry 시점 사용자 reconfirm 3건 (C-13 사업자 / Slack URL / 실 베타 모집) 미해소 → GA 슬립 | high → **deferred (D-021)** | pm | **D-021 봉인 (2026-05-15)**: 6/2 PM 자동 알림 취소 → **사용자가 "제품 완성"으로 호출하는 시점**에만 reconfirm 알림 송출. 양식 유지: `context/rollups/20260512-R-M5-01-user-reconfirm-template.md`. 베타 (M5 W19) sandbox-only 운영으로 사업자 등록 불필요 |

---

## 4. risk → 결정/ADR 매핑

| Risk | 관련 결정 / ADR | 비고 |
|---|---|---|
| R-01 | CC3-07 (작성자/검수자 분리) | DECISION_LOG D-001~D-004 sweep 시 명시 |
| R-02 | C-13 / D-012 | M5 entry 이연 |
| R-04 | D-013 §Privacy Manifest / M4 W17-S3 | planner W15 4 KPI commit + M4 W17 evaluator |
| R-12 | ADR-0006 (3-Phase) | Phase 3에서 closed |
| R-23 | ADR-0004 (RLS 매트릭스) + W15-01 evaluator | Cycle B nightly green = closed |
| R-25 | ADR-0007 (baseline) — RLS hybrid 패턴 적용 | M4 W17-S2 |
| R-26 | D-014 / D-015 | Cycle A 해소 |
| R-28 (lesson chain) | designer R-28 LESSON_CHAIN_PATTERN | Cycle B closed candidacy |
| R-29 (Phase 2) | ADR-0006 Phase 2 | W17 backend commit |
| R-31 | D-015 + W15-09 | W15-09 enum 활성화 |
| R-32 | W15-10 | privacy evaluator union 3종 |
| R-33 | RLS hybrid plan W17 시드 hash | M4 W17 |
| R-34 | RLS hybrid plan W17 JWT 갱신 | M4 W17 |
| R-M5-01 | C-13 / D-011 / 실 베타 모집 | M5 entry sprint user reconfirm |

---

## 5. 다음 일자별 risk 추적 (자동 갱신 trigger)

| 일자 | 트리거 | 영향 받는 risk |
|---|---|---|
| 2026-05-13~14 | W15 Cycle B Day-0~1 진척 | R-31 / R-32 / R-23 / R-24 진척 표기 |
| 2026-05-15~17 | W15-06b / W15-07b 머지 | R-23 closed / R-24 closed / R-30 잔존 확인 |
| 2026-05-18 | W15 sprint 종료 | R-W15-01 / R-W15-02 sprint risk closed |
| 2026-05-25 | M3 게이트 검증 | R-12 (Phase 1+2 진척) / R-23 / R-24 / R-W16-01 / R-W16-02 sprint risk closed |
| 2026-06-01 | M4-W17 종료 | R-12 (Phase 3 closed) / R-25 (hybrid 도입 후 closed) / R-29 (Phase 2 closed) / R-33 / R-34 / R-M4-01~03 |
| 2026-06-02 | PM R-M5-01 사용자 알림 송출 | R-M5-01 응답 추적 시작 |
| 2026-06-08 | M4 게이트 통과 | R-04 (Privacy Manifest evaluator green) 부분 closed |
| 2026-06-09 | M5 entry 진입 | R-02 / R-30 / R-M5-01 처리 결과 |
| 2026-06-15 또는 6/22 | GA 출시 | R-04 (심사 통과) / R-07 (베타 모집 결과) |

---

## 6. orchestrator 통합 정책

1. **단일 SoT 원칙**: 본 문서가 R-NN의 최종 SoT. 다른 SSOT에 risk 등록 시 본 문서에도 동시 등록 강제.
2. **ID 충돌 사전 차단**: agent가 신규 risk 등록 시 본 문서 §1 마지막 ID 다음 번호 사용. 충돌 발견 시 즉시 orchestrator escalate.
3. **status 갱신 일자 명시**: closed 시 일자 + 해소 방법 + 증거 commit SHA 또는 SSOT 링크 명시.
4. **sprint risk → 글로벌 promotion**: R-W15-NN이 M5 이후까지 잔존 시 R-NN으로 promotion + 본 문서 §2 등재.

---

## 7. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-12 | RISK_REGISTER 신규 작성 — 15개 SSOT에 분산된 R-NN 통합 + R-28/R-29 충돌 발견 + D-016/D-017 봉인 권고 (R-33/R-34로 reroute) + sprint risk(R-W15/W16/M4/M5) 4 namespace 정리 + risk→ADR 매핑 + 일자별 추적 trigger | orchestrator |
| 2026-05-13 | Q-W15-4 가격 정합성 resolved 추가 (D-018 봉인 — Premium $4.99/mo · $49.99/yr 사용자 명시 결정) | orchestrator |
| 2026-05-13 | R-01 콘텐츠 검수자 모집 mitigation 강화 (D-019 봉인 후 — starter 60 + core 180 + premium 100 = 340 단어 작성 완료, 검수자 모집 채널 5종 정합) | orchestrator |
| 2026-06-01 | R-M4-04 신규 등록 — Work Order P0-1 lesson stage 전환 latency 변화 (StageReveal stagger + MorphingKoreanWord scale → user-perceived advance 지연 가능). owner=frontend, mitigation=analytics `lesson_completed.duration_sec` p50/p95 monitoring (Work Order §11 (2) 명시 의무) | orchestrator |
