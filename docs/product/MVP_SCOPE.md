# dash2zero — MVP Scope

> 작성: pm agent (M1, 2026-05-07)
> 협업 입력: planner (PRD), architect (Domain Model), all agents (Sprint estimation)
> 상위 SSOT: PRD.md, USER_JOURNEYS.md, DOMAIN_MODEL.md, 22_mvp_development_tasks.md (v0.3)
> Skill 사용: humanizer (built-in) · theme-factory · frontend-design · taste-skill

---

## 1. Scope 한 줄 정의

**MVP는 P0 기능 15개를 20주 안에 완성하여 US/CA/UK/AU/NZ 5개 스토어에 출시 가능한 상태**다.

- 16주 baseline 구현 + 4주 buffer (CC2-14)
- 1인 개발자 주 20시간 가용 (A-101)
- C-13 사업자 D-42 데드라인 (paid release만 차단, 개발 진행 무관)

---

## 2. P0 / P1 / P2 분류

### 2.1 P0 — MVP 출시 필수 (15개)

PRD §5 그대로. 모두 Beta Handoff(M5) 전에 완성.

| ID | 기능 | 마일스톤 | 담당 |
|---|---|---|---|
| F-001 | 가입/로그인 (Apple+Google+Magic Link) | M2 W7-W8 | frontend + backend |
| F-002 | 게스트 학습 | M2 W6 | frontend + learning |
| F-003 | 게스트→가입 머지 | M2 W9 | backend + qa |
| F-004 | 단어 카드 4단계 학습 | M2 W6-W7 | frontend + designer |
| F-005 | 객관식 4지선다 퀴즈 | M2 W7 | frontend + learning |
| F-006 | Leitner 5단계 SRS | M2 W6 | backend + learning |
| F-007 | 일일 학습 한도 (daily_usage) | M2 W7 | backend |
| F-008 | 단어 카드 음성 재생 (TTS Storage 캐시) | M2 W8 | frontend + backend |
| F-009 | RevenueCat 구독 | M2 W10-W11 | backend + frontend |
| F-010 | 인앱 계정 삭제 + 데이터 내보내기 | M4 W15 | backend + security |
| F-011 | First-run age gate → privacy → onboarding | M2 W5-W6 | frontend + designer + security |
| F-012 | 13세 미만 차단 | M2 W6 | backend + security |
| F-013 | Streak / 진행률 / Mastered | M2 W8 | frontend + backend |
| F-014 | 콘텐츠 manifest 원격 업데이트 + audio_hash 검증 | M2 W9 | backend + content pipeline |
| F-015 | 콘텐츠 신고 (앱 내 5종 카테고리) | M2 W11 | frontend + backend |

### 2.2 P1 — 출시 전 권장 (6개, 슬립 가능)

| ID | 기능 | 마일스톤 | 슬립 시 영향 |
|---|---|---|---|
| F-101 | Settings (계정/구독/알림 토글/언어) | M2 W11 | UX 완성도, 영향 중간 |
| F-102 | Push 알림 (학습 리마인더) | M2 W12 | D7 retention 영향, M5 슬립 가능 |
| F-103 | 다기기 동기화 충돌 알림 | M4 W15 | edge case, 슬립 가능 |
| F-104 | Streak freeze (주 1회 자동 보호) | M5 | 게임화, post-MVP 검토 가능 |
| F-105 | 사용자 데이터 export 형식(JSON download) | M4 W15 | F-010과 함께 |
| F-106 | 운영 어드민 (Supabase Studio + 시트 + audit_log) | M2 W11 | 운영 부담, 출시 직후 보강 가능 |

### 2.3 P2 — Post-MVP (Non-Goals 명시)

PRD §9 그대로:

- 음성 녹음 / 발음 평가
- AI 실시간 튜터
- UGC / 소셜 / 친구 / 리더보드
- Mastered 후 30/60/120일 재노출 (CC2-09 결정대로 MVP 제외)
- BigQuery export (CC2-23)
- EU/EEA 출시 (CC2-20)
- 태블릿 / 가로 모드 / 다크 모드
- A/B 가격 실험

---

## 3. 20주 일정 — Sprint 분해

### 3.1 일정 한눈에

| 주차 | M | Sprint 핵심 | 게이트 |
|---|---|---|---|
| W1-W2 | M0 | Bootstrap (헌장 + 13 agent + skill 11 + 보안 심사) ✅ | M0 게이트 통과 ✅ |
| W3-W4 | M1 | PRD + Domain + Stack Decision + Design Direction | M1 게이트 (orchestrator 서명) |
| W5 | M2-S1 | Project scaffold (apps/mobile + apps/api + packages/contracts), CI 골격, 환경 분리 (dev/staging) | scaffold 동작 |
| W6 | M2-S2 | First-run 흐름 (age gate → privacy → onboarding) + 게스트 모드 + Word/UserWordState 기본 | F-011 / F-012 / F-002 / F-006 |
| W7 | M2-S3 | 단어 카드 4단계 + 객관식 퀴즈 + 일일 한도 | F-004 / F-005 / F-007 |
| W8 | M2-S4 | 음성 재생 + Streak / 진행률 / Mastered | F-008 / F-013 |
| W9 | M2-S5 | 콘텐츠 manifest 원격 업데이트 + 게스트→가입 머지 + 가입 흐름 | F-014 / F-003 / F-001 (1차) |
| W10-W11 | M2-S6 | RevenueCat 통합 + paywall + 콘텐츠 신고 + 운영 어드민 1차 | F-009 / F-015 / F-106 |
| W12 | M2-S7 | E2E 1개 시나리오 완주 (J-001 첫 학습) + Push 알림 | M2 게이트 (J-001 시연 가능) |
| W13-W14 | M3 | golden 87 case yaml + evaluation runner + baseline 14일 | M3 게이트 (regression 0) |
| W15-W16 | M4 | adversarial / e2e / audit / secret / retention / 계정 삭제 / 데이터 export | M4 게이트 (security 통과) |
| W17-W18 | M5 | README + demo + seed + runbook + 베타 모집 + Phased Rollout | M5 베타 게이트 |
| W19 | Buffer | 심사 반려 / hotfix / 콘텐츠 검수 슬립 | - |
| W20 | Buffer | GA 출시 또는 슬립 흡수 | GA |

### 3.2 콘텐츠 작업 별도 트랙 (CC2-15: 50단어 batch × 6)

콘텐츠 제작은 코드 트랙과 **병행**. 1태스크 ≤ 3일 원칙으로 분해.

| Batch | 시점 | 단어 수 | 책임 |
|---|---|---:|---|
| B-1 Starter Pack | W5-W7 | 60 | learning + analytics (검수표) + content pipeline |
| B-2 Premium #1 | W8-W9 | 50 | learning + 외부 검수자 1명 (CC3-07) |
| B-3 Premium #2 | W10-W11 | 50 | learning + 외부 검수자 |
| B-4 Premium #3 | W12-W13 | 50 | learning + 외부 검수자 |
| B-5 Premium #4 | W14-W15 | 50 | learning + 외부 검수자 |
| B-6 Premium #5 | W16-W17 | 50 | learning + 외부 검수자 |
| **합계** | | **310** | (Starter 60 + Premium 250, MVP 300단어 약속 충족) |

각 batch = draft → AI 보조 초안 → human review → TTS 생성/업로드 → 앱 import → content QA → rollback manifest. 단어당 30-45분 가정 (A-103, A-104).

### 3.3 콘텐츠 작업과 코드 작업 결합

콘텐츠 batch 1 (Starter Pack 60)은 **W5-W7 코드 sprint M2-S1~S3와 병행 진행**해야 W7 종료 시 단어 카드 화면이 실제 단어로 동작.

W11까지 batch 1+2 (110단어) 완료가 M2 thin vertical slice 시연의 콘텐츠 입력.

---

## 4. Specialist 활성 트리거

| Agent | 활성 시점 | 산출물 | 활동 트리거 |
|---|---|---|---|
| **learning** | W5 (B-1 시작) | Starter Pack 60 검수 + SRS 정확성 자문 | M2 진입 즉시 |
| **analytics** | W12 (M3 진입 1주 전) | golden 87 yaml 작성 + evaluation runner 설계 | M2-S7 진행 중 |
| **legal** | W14 (D-42, C-13 확정 deadline) | 약관/처리방침/결제 정책 영문 final + 사업자 정보 치환 | C-13 확정 시점 |
| **devops** | W11 (M2-S6 결제) | EAS production 환경 + GitHub Actions 정밀 설정 + 모니터링 alert | RC 결제 통합과 함께 |

각 활성화 시 `docs/DECISION_LOG.md` D-NNN 추가, `docs/HANDOFF.md`에 마일스톤 매핑 갱신.

---

## 5. Worktree 활성화 (M2 진입 시)

W5에서 git worktree 분기 시작. 각 agent는 자신의 worktree에서 병렬 작업.

```
worktrees/
  orchestrator/   # 검토/통합 (코드 변경 없음)
  planner/        # docs/product/, docs/adr/ 보강
  pm/             # 본 문서 + harness execution board 갱신
  designer/       # docs/brand/, packages/design-tokens/
  architect/      # docs/architecture/, packages/contracts/
  frontend/       # apps/mobile/
  backend/        # apps/api/, packages/domain/, infra/
  security/       # docs/runbooks/, RLS, Privacy Manifest
  qa/             # apps/*/test/, fixtures/
  learning/       # B-1~B-6 콘텐츠
  analytics/      # docs/harness/, packages/analytics-sdk/
  legal/          # 13/16/17번 v0.3 보강
  devops/         # infra/eas/, scripts/release/
```

main 직접 commit 금지. Orchestrator 승인 후 머지.

---

## 6. Risk Register

| ID | 리스크 | 확률 | 영향 | 완화책 |
|---|---|---|---|---|
| R-01 | 콘텐츠 batch 검수 일정 슬립 (외부 검수자 모집 어려움) | 중 | 높음 | W4 안에 검수자 후보 2명 모집 시도, 실패 시 PM 자체 검수 + 24h 지연 self-review (CC3-07 보조) |
| R-02 | C-13 사업자 D-42 미확정 | 중 | 매우 높음 (paid release 차단) | 한국 개인사업자 신고 절차 W3에 시작 (lead time 2-4주) |
| R-03 | RC + Apple/Google sandbox 결제 통합 지연 | 중 | 높음 | W10에 시작, W11 buffer + devops sprint 합류 |
| R-04 | 심사 반려 (특히 iOS Privacy Manifest, age gate) | 중 | 높음 (M5에서 1주 손실) | M4 W15-W16에 모의 심사 체크리스트 + Privacy Manifest 검증 자동화 |
| R-05 | TTS provider 라이선스 / 단가 변경 | 낮음 | 중간 | provider 추상화 (Domain Model §7) — 교체 가능 |
| R-06 | 1인 개발자 주 20시간 가정 위반 (질병, 컨텍스트 스위칭) | 중 | 중간 | 4주 buffer 활용, P1 6개는 슬립 가능으로 사전 분류 |
| R-07 | 베타 모집 30명 채우기 실패 | 낮음 | 낮음 | Reddit r/Korean + Discord 커뮤니티 + 지인 모집 다중 채널 |
| R-08 | Supabase 가격 인상 / 정책 변경 | 낮음 | 중간 | Domain Model 추상화로 vendor 교체 비용 완화 |

리스크는 매주 sprint 회고에서 갱신 (orchestrator rollup).

---

## 7. 마일스톤별 Definition of Ready / Done

### 7.1 M2 Thin Vertical Slice (W12 종료)

**Definition of Done (게이트 통과 기준):**
- [ ] J-001 (신규 사용자 첫 학습) E2E 동작 — 시연 가능
- [ ] Starter Pack 60단어 + 음성 600 파일 캐시 hit
- [ ] First lesson < 3분 (실측)
- [ ] daily_usage SSOT 동작 (서버 검증)
- [ ] subscription_entitlements 컬럼 표 (CC2-08) + RC sandbox webhook 1회 검증
- [ ] age gate → privacy → onboarding 순서 강제 동작
- [ ] 13세 미만 차단 동작 (device lockout 24h 포함)
- [ ] context records 모든 sprint 12항목 기록
- [ ] 핵심 5 trace 작동 (lesson_started, lesson_completed, paywall_viewed, purchase_succeeded, age_gate_completed)

### 7.2 M3 Harness Hardening (W14 종료)

- [ ] Golden 87 case 100% 통과 (14일 연속)
- [ ] Adversarial 10 case 100% 거부
- [ ] CI에 evaluation runner 통합 (PR 차단)
- [ ] Baseline metrics 14일 안정

### 7.3 M4 Security + QA (W16 종료)

- [ ] Privacy Manifest 검증 (iOS upload 통과)
- [ ] RLS 매트릭스 ADR-0004 + 테스트 통과
- [ ] e2e Detox/Maestro 핵심 시나리오 5개
- [ ] 계정 삭제 30일 cron 동작 + RC alias 삭제 호출
- [ ] secret scan 통과 + dependency audit 통과

### 7.4 M5 Beta Handoff (W18 종료)

- [ ] README + demo script + seed data
- [ ] 베타 모집 30명 + TestFlight + Internal Testing
- [ ] runbook 5종 (장애/환불/콘텐츠 신고/계정 삭제/심사 대응)
- [ ] Phased Rollout 5/25/50/100% halt trigger 동작
- [ ] Owner 모바일 알림 검증

---

## 8. 변경 이력

| 일자 | 변경 | 작성자 |
|---|---|---|
| 2026-05-07 | M1-7 v1.0 — P0 15 / P1 6 / P2 non-goals + 20주 sprint 분해 + 콘텐츠 6 batch + Specialist 트리거 + Risk register 8 + 마일스톤 DoD | pm |
