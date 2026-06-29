# Legal · M3 W15 — Privacy fixtures 확장 5건 + 정책 문서 갱신

> 작성: payments-legal-specialist
> 작성일: 2026-05-11 23:00 KST
> 사이클: M3 W15 실작업
> 모드: 자율 결정 (사용자 지시: "운영 blocker 무시, 제품 개발 몰두")
> 선행: `context/agents/legal/20260511-2200-chore-m3-w15-readiness.md`
> 사용자: mju.jykim@gmail.com

---

## 0. 작업 요약

| 작업 | 산출물 | 상태 |
|---|---|---|
| Privacy fixtures +5 | PRV-012 ~ PRV-016 | DONE |
| README.md 분포표 정정 (drift 잠금) | `fixtures/golden/privacy/README.md` (11→16) | DONE |
| Paywall 4-variant disclosure lock | `docs/13_payment_policy.md §5.1` 신설 | DONE |
| 정책 변경 동의 vs 통지 절차 | `docs/16_privacy_policy.md §16` 재작성 (RED → GREEN) | DONE |
| Family Share 운영 매뉴얼 (Q-PL-NEW-005) | `docs/legal/FAMILY_SHARE_OPS.md` 신규 | DONE |

---

## 1. Privacy fixtures 5건 결정 근거

### PRV-012 — family_share entitlement_inherited=false (P0)

- **카테고리 신설**: family_share. 회귀 catch 핵심.
- **단언 형태**: family_share_enabled=false AND holder!=requester → entitlement_inherited=false / requester_is_premium=false.
- **자율 결정**: positive 케이스(family_share=true)는 의도적 미작성. 정책상 금지이므로 기본값 회귀만 catch. 향후 활성화 시 PRV-012-pos 분리 (FAMILY_SHARE_OPS §4 참조).
- **evaluator union 확장 필요** — backend가 `scripts/eval/privacy.ts` 분기 추가 시 W15 1일차 응답 필요.

### PRV-013 — KR 14~18세 미성년 환불 30d SLA (P1)

- **카테고리 신설**: minor_refund.
- **법적 근거**: 한국 민법 §5 (미성년자 법률행위 취소권) + 전자상거래법 §17 (청약철회 7일).
- **자율 결정**: 14세 미만은 PRV-001(age_gate) 차단으로 분리. 14~18세는 가입 가능하지만 결제 시 부모 동의 의무를 IAP 한계로 사후 환불로 대응. response_sla_days=3 / resolution_sla_days=30 (docs/13 §9 정합).
- **검증 시점**: now=2026-05-11, refund_request_at=2026-04-20 → 21d 경과 → resolved_within_sla=true.

### PRV-014 — GDPR Art.7(3) 동의 철회 forward-only (P1)

- **카테고리**: 기존 privacy_choices 재사용 (분기 추가 불필요).
- **결정 근거**: GDPR Art.7(3) "withdrawal shall not affect lawfulness of processing based on consent before its withdrawal" — retroactive purge 의무 없음. PRV-005가 초기 상태이고 PRV-014는 sequence (동의 후 철회) 케이스로 의미 분리.
- **dark pattern 회피**: 사용자가 retroactive purge를 명시 요청하면 DSR delete(PRV-008) 또는 export(PRV-010) 경로 라우팅. 본 케이스는 "철회만으로는 과거 데이터 자동 삭제되지 않는다"를 정책상 lock.

### PRV-015 — CCPA opt-out no-op confirm (P2)

- **카테고리 신설**: ccpa_no_sale.
- **법적 근거**: CCPA §1798.135(a)(2)(A) — sell/share 없음 명시 시 "Do Not Sell" 링크 면제. 단 §1798.135(c)(3) — 직접 요청 시 15 business days 응답 의무. §1798.135(a)(4)(C) — 12개월 재요청 허용.
- **자율 결정**: 본 케이스는 미국 출시 의존. M4 미국 시장 진입 결정 전까지는 P2 유지. 진입 시 docs/16에 §"Your California Privacy Rights" 섹션 추가 필요(블록 미발생 — 정책 분류만).

### PRV-016 — DSR cancel-window 재로그인 시 soft_deleted_at 보존 (P1)

- **카테고리**: 기존 dsr_delete 재사용.
- **결정 근거**: 일부 SaaS가 "재로그인=삭제 자동 취소"로 처리하는 dark pattern 회피. 명시적 cancel API 호출 시에만 복구. CCPA §1798.185(a)(20) "symmetry in choice" + GDPR Art.7 동의 dark pattern 가이드 준용.
- **backend 의존**: soft_deleted_at write timing이 delete_request_at과 동일 시각이어야 evaluator 단언 정합. apps/api/edge-functions/_shared/ (현재 billing.ts / srs.ts만 존재, dsr 모듈 부재) — backend가 DSR 모듈 작성 시 본 contract 보장 필요.
- **자율 결정**: cancel_requires_explicit_api는 documentation field로 둠 (강한 단언은 evaluator 분기 추가 시점 결정). 현 strict mode는 기존 dsr_delete 분기로 통과.

---

## 2. 정책 문서 갱신 자율 결정

### docs/13 §5.1 — Paywall 4-variant lock

- **자율 결정 톤**: Honest (designer 가이드 일관). "Limited offer" / "Most popular" 등 유도 문구 배제.
- **9개 항목 × 4 variant 매트릭스 lock**: A=default / B=annual emphasis / C=monthly emphasis / D=compact. 9개 모두 시각 노출 의무.
- **Apple §3.1.2(a) reject 위험 차단**: M3 W15 paywall_view baseline 14d 시작 전 lock 완료. variant 추가/문구 변경은 본 표 갱신 후에만 가능 (drift 방지).

### docs/16 §16 — 정책 변경 동의 vs 통지 (RED → GREEN)

- **자율 결정 분기 기준**:
  - material → 신규 데이터 카테고리 / 처리 목적 신설 / 처리자 추가 / 보존 연장 / sell·share 신설 / 13~17 관련 변경 / DSAR 채널 축소.
  - notice-only → 문구 다듬기 / 처리자 이름 변경 / 주소 변경 / 오타 정정 / 권리 추가 안내.
- **통지 채널 3-tier**: in-app banner (필수) → email (보유 사용자) → Settings Changelog (영구).
- **운영 부담 vs 법적 보호 trade-off**: material change는 시행 30일 전 서명, 14일 전 banner. 1인 개발자 부담 고려해 변경 빈도 자체를 낮추도록 변경 PR에 분류 라벨 강제.

### docs/legal/FAMILY_SHARE_OPS.md — Q-PL-NEW-005 신설

- **자율 결정 정책 결정**:
  - 4 토글 (App Store Connect / Play Console / RC / paywall 문구) 모두 OFF/false D-42 게이트.
  - PRV-012 골든 케이스로 회귀 catch.
  - CS 응답 EN/KR 템플릿 2종 + 환불 요청 응답.
  - 가족 공유 활성화 시 사전조건 6항목 (가격 재설계 + RLS 재검토 + 스토어 재제출).

---

## 3. 차단 / 의존성

### 차단 없음

본 W15 작업은 다른 agent의 응답 없이 모두 완료 가능했다.

### W15 후속 의존 (다른 agent에 통보 필요)

- **backend**: `scripts/eval/privacy.ts`의 `category` union에 `family_share` / `minor_refund` / `ccpa_no_sale` 3종 추가 + 빈 분기. 추가 안 하면 strict mode에서 PRV-012/013/015 evaluator 진입 시 에러. README §"evaluator union 확장 필요" 코드 블록 그대로 사용 가능.
- **backend**: `apps/api/edge-functions/_shared/` 에 DSR 모듈 작성 시 PRV-016 contract 준수 — soft_deleted_at = delete_request_at 동일 시각, cancel은 명시적 API에서만.
- **analytics**: paywall_view 이벤트의 `variant_id` 필드 4종(A/B/C/D) baseline 14d 수집. docs/13 §5.1 표 변경 시 본 fixture 측 lock 검증 동기화.
- **designer**: PRV-016 cancel 명시적 API용 confirmation modal UI 설계 (계정 삭제 cancel 별도 confirm).

### W15 legal이 처리한 의존

- W14 rollup §2 "Privacy 6/11" drift는 본 README 정정으로 잠금 (실제 11/11 + W15 +5 = 16/16).
- Paywall variant matrix는 analytics가 baseline 시작 전 합의 가능한 형태로 표 lock 완료.

---

## 4. 후속 질문 (REVIEW_QA "결제/법무" 섹션 후보)

- **Q-LG-W15-06 (P1, 신규)**: backend가 evaluator union에 family_share/minor_refund/ccpa_no_sale 분기를 추가할 W15 일정. 추가 전까지 PRV-012/013/015는 strict mode 진입 차단 → 별도 카테고리 옵트인 환경변수 필요한가?
- **Q-LG-W15-07 (P1, 신규)**: PRV-016 cancel-window 재로그인 시 backend의 soft_deleted_at 보존 로직 contract — `apps/api/edge-functions/_shared/dsr.ts` (가칭) 신규 모듈 owner는 backend 단독인가, security 공동인가?
- **Q-LG-W15-08 (P2, 신규)**: docs/13 §5.1 paywall 4-variant lock 후 baseline 14d 진행 중 가격/문구 변경 발생 시 lock 표 갱신 책임자 — legal vs analytics?
- **Q-LG-W15-09 (P0, 잔존)**: 만 14세 미만 한국 사용자 KISA 부모 동의 흐름 — 13세 GDPR 라인과 분리 운영 결정 (W15 readiness Q-LG-W15-01에서 미해결).
- **Q-LG-W15-10 (P2, 신규)**: docs/16 §16 material change 시행 30일 전 + banner 14일 전 일정이 1인 개발자 운영 부담 vs 법적 보호 적정 균형인가?

---

## 5. 산출물 인덱스

```
fixtures/golden/privacy/PRV-012.yaml         # family_share entitlement_inherited=false (P0)
fixtures/golden/privacy/PRV-013.yaml         # KR minor refund 30d SLA (P1)
fixtures/golden/privacy/PRV-014.yaml         # GDPR Art.7(3) 동의 철회 forward-only (P1)
fixtures/golden/privacy/PRV-015.yaml         # CCPA opt-out no-op confirm (P2)
fixtures/golden/privacy/PRV-016.yaml         # DSR cancel-window 재로그인 보존 (P1)
fixtures/golden/privacy/README.md            # 분포표 정정 (11/11 → 16/16) + drift 잠금
docs/13_payment_policy.md §5.1               # Paywall 4-variant disclosure lock 신설
docs/16_privacy_policy.md §16                # 정책 변경 동의 vs 통지 (RED → GREEN)
docs/legal/FAMILY_SHARE_OPS.md               # Family Sharing 운영 매뉴얼 신규 (Q-PL-NEW-005)
```

---

서명: payments-legal-specialist · 2026-05-11 23:00 KST
