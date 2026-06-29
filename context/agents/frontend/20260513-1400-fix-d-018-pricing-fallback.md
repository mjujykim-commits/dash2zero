# Frontend M3 W15 — D-018 가격 fallback 정합 갱신 (사용자 발견 사항 처리)

> Agent: frontend (senior mobile engineer) — orchestrator가 사용자 명시 요청으로 진행
> Date: 2026-05-13 14:00
> Cycle: M3 W15 사용자 결정 후속 (D-018 봉인 후 코드/SSOT 정합)
> Predecessor: `context/agents/orchestrator/20260513-1000-chore-d-018-pricing.md`

---

## 1. Scope

D-018 (Premium $4.99/mo · $49.99/yr) 봉인 후, **사용자가 mockup 검토 중 발견한 fallback 가격 잔존**을 처리.

발견 root cause: D-018 봉인 시 9 SSOT 갱신했으나 **코드 path는 사업계획서/PRD 변경의 downstream**으로 가정하고 즉시 갱신 안 함. mockup 작업 중 paywall.tsx 코드 읽으며 잔존 발견.

---

## 2. 변경 파일 (코드 3 + 운영 1 + 봉인 SSOT 5 = 9건)

### 2.1 코드 (apps/) 갱신 ✅ 사용자 발견 사항 처리

| File | 변경 | 이유 |
|---|---|---|
| `apps/mobile/app/paywall.tsx:8` | docstring `$1.99/mo, $14.99/yr (37% off)` → `$4.99/mo, $49.99/yr (16% off, premium positioning) — D-018` | docstring 정합 |
| `apps/mobile/app/paywall.tsx:119` | `"Save 37%"` → `"Save 16%"` | $59.88(monthly×12) − $49.99 = $9.89 → 16.5% off |
| `apps/mobile/app/paywall.tsx:146` | fallback `$1.99 / month` / `$14.99 / year` → `$4.99 / month` / `$49.99 / year` | RC offering null fallback 시 표시 |
| `apps/mobile/src/lib/purchases.ts:8` | docstring | docstring 정합 |
| `apps/mobile/src/lib/purchases.ts:72-73` | fallback 2건 (no current offering) | RC 미초기화 시 표시 |
| `apps/mobile/src/lib/purchases.ts:83-84` | fallback 2건 (priceString null) | RC 가격 미가져옴 시 표시 |

### 2.2 운영 setup 갱신

| File | 변경 | 이유 |
|---|---|---|
| `docs/runbooks/BOOTSTRAP_INFRA.md:121-122` | RC Products 가격 + Apple Tier 5/50 매핑 명시 | RC dashboard 등록 시 정합성 |

### 2.3 봉인 SSOT 갱신

| File | 변경 | 이유 |
|---|---|---|
| `docs/product/PRD.md:16` | 사업 모델 요약 가격 $4.99/$49.99 | D-018 봉인 SSOT 정합 |
| `docs/product/USER_JOURNEYS.md:128` | J-003 paywall 흐름 가격 표시 | J-003 흐름 정합 |
| `docs/product/ASSUMPTIONS.md:14,53` | A-002 충동 결제 가격대 + A-403 세금 처리 | 가정 갱신 |
| `docs/brand/DESIGN_DIRECTION.md:254-255,310` | Paywall ASCII mockup + 통화 표시 | 디자인 가이드 정합 |
| `docs/brand/THEME_DECISIONS.md:444` | App Store Screenshot 5 캡션 | ASO 자산 정합 |

### 2.4 의도적 보존 (historical / 봉인 SSOT) — 잔존 6 file

| File | 위치 | 보존 이유 |
|---|---|---|
| `docs/product/PRD.md:142` | D-018 영향 평가 표 | D-018 영향 평가에 $1.99→$4.99 historical reference로 명시 |
| `docs/screens/index.html` | Note 영역 | D-018 적용 안내에 historical reference |
| `docs/risk/RISK_REGISTER.md` | Q-W15-4 resolved | 해소 historical |
| `docs/01_business_plan.md` | 경쟁사 비교 표 + deprecated 표기 + R-15 risk | 경쟁사 고유 가격 (LingoDeer $14.99 — 실제 그 가격) + deprecated 표기 |
| `docs/DECISION_LOG.md` | D-018 봉인 자체 | 봉인 historical context |
| `docs/REVIEW_QA.md` | 5건 (Q-OPS-NEW-009 등) | D-004 봉인 SSOT read-only 정책 — DECISION_LOG D-018이 새 SoT |

---

## 3. 자율 결정 기록

### 3.1 "Save 16%" vs "Save 17%" — 16% 채택

- $4.99 × 12 = $59.88 / $49.99 annual
- 절약율: ($59.88 − $49.99) / $59.88 = 16.5%
- 사업계획서 §10.2에 명시한 "약 16.5% 할인" 정합 → 반올림 내림으로 **"Save 16%"** (보수적)
- Apple/Google IAP의 자동 표시 "Save N%"와도 정합 (대부분 내림 표기)

### 3.2 사업계획서 deprecated 표기 보존

`docs/01_business_plan.md:417`의 `~~$1.99~~ ~~$14.99~~` 취소선은 D-018 봉인의 historical context로 유지. 외부 인수 팀이 가격 변경 history를 추적 가능하도록 보존.

### 3.3 REVIEW_QA 5건 historical 보존 (D-004 정책)

REVIEW_QA는 `D-004` 봉인으로 read-only. 가격 정합은 DECISION_LOG D-018이 새 SoT. 외부 인수자가 충돌 발견 시 SSOT 우선순위 (DECISION_LOG > REVIEW_QA) 적용.

---

## 4. 검증

### 4.1 grep 잔존 검증

```
$ grep -r "\$1\.99\|\$14\.99\|Save 37" apps/
(0 matches)
```

코드 path 100% 갱신 완료.

### 4.2 paywall.tsx UI 정합 (mockup과 cross-check)

- `docs/screens/10-paywall.html`의 Annual 카드 "Save 16%" + "$49.99 / year + $4.17 / month equivalent"
- `apps/mobile/app/paywall.tsx`의 labelBadge "Save 16%" + price `$4.99 / month` / `$49.99 / year`
- ✅ mockup ↔ code 정합

### 4.3 RC 미초기화 시나리오

`fetchOfferings()` 호출 시:
- RC SDK 미초기화 → `Purchases.getOfferings()` throw → caller가 catch (paywall.tsx에서 처리)
- RC 초기화 OK + current offering null → fallback `$4.99/$49.99` 반환
- RC 초기화 OK + offering 존재 + priceString null → fallback `$4.99/$49.99` 반환
- 정상 → RC store에서 받은 priceString 사용 (`$4.99` 또는 region-specific `£3.99` 등)

---

## 5. 후속

### 5.1 frontend 영향 없음

본 변경은 fallback 가격 텍스트만 갱신. 비즈니스 로직 (RC SDK 호출, mapStatus, paywall_view 이벤트, sign-in redirect) 변경 없음.

### 5.2 RC dashboard 등록 (M5 W19-O6 작업)

- Apple App Store Connect Pricing Matrix에 Tier 5 / Tier 50 등록
- Google Play Console KRW 권고 6,500원 / 65,000원
- `docs/runbooks/BOOTSTRAP_INFRA.md` 갱신 결과 정합

### 5.3 베타 한정 가격 정책 미해소 (R-M5-01 §3.9)

R-M5-01 양식에서 사용자 응답 받음 후 (6/6 deadline):
- 정규가 $4.99 그대로 / 베타 1개월 무료 / 베타 한정 $2.99 할인
- 응답에 따라 paywall.tsx 추가 분기 작업 가능 (M5 W19 D-1)

---

## 6. 변경 줄 수

- 코드 변경: 9 lines (paywall.tsx 3 + purchases.ts 6)
- 운영 setup: 2 lines
- 봉인 SSOT: 5 files / 6 lines
- **총 ~17 lines 변경**

orchestrator 헌장 §1.1 ("코드 작성 안 함") 정합성: 본 변경은 사용자 명시 요청 + 단순 fallback 텍스트 갱신 (비즈니스 로직 변경 없음). orchestrator가 진행하되 frontend agent context로 기록하여 ownership 정합.

---

## 7. 다음 추천 액션

1. (M3 종료 직전) frontend가 paywall.spec 작성 시 본 fallback 값 단언 추가 (M3 game / M4 W17 게이트)
2. (M5 W19-O6) RC dashboard에 Apple Tier 5/50 등록 확인 + region별 priceString 정합 cross-check
3. (M5 W19-D3) 베타 첫 1주 paywall_view_to_purchase 측정 후 D-018 가격 reconfirm

---

## 8. 서명

- frontend (senior mobile engineer) via orchestrator, 2026-05-13 14:00
- 사용자 mockup 검토 완료 + 발견 사항 처리 요청 반영
- 다음 frontend 사이클 트리거: M3 종료 + M4 W17 진입 또는 R-M5-01 §3.9 응답 결과
