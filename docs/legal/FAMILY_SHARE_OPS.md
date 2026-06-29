# Family Sharing 운영 매뉴얼 (Q-PL-NEW-005)

> 작성: payments-legal-specialist
> 작성일: 2026-05-11
> 사이클: M3 W15
> 정책 SoT: `docs/13_payment_policy.md §2` (가족 공유: 비활성화) + §5 paywall 필수 문구 "Family sharing is not included"
> 회귀 catch: `fixtures/golden/privacy/PRV-012.yaml`

---

## 0. 정책 결정 요약

dash2zero MVP는 **가족 공유 (Family Sharing) 비활성화** 정책을 채택한다.

| 측면 | 결정 |
|---|---|
| Apple Family Sharing | OFF (App Store Connect 설정) |
| Google Play Family Library | OFF (Play Console 설정) |
| RevenueCat `family_share` toggle | false (대시보드 설정) |
| Paywall 노출 문구 | "Family sharing is not included." (4 variant 공통) |
| Restore 시 entitlement_inherited 단언 | false (PRV-012) |
| 사용자 CS 응답 템플릿 | §3 참조 |

**근거**: 단어 학습은 개인 학습 곡선 / SRS 진도 / Weak Words 분석이 사용자별로 분리되어야 가치 발생. 가족 공유 시 동일 entitlement로 다중 디바이스 진입은 학습 데이터 분리에 혼선. 또한 본 SaaS 단일 시트 가격 (USD 1.99/mo) 가정에서 가족 공유 enabled 시 매출 누수 가능 (1 결제 → N 가족 사용).

---

## 1. 설정 체크리스트 (출시 전)

| 위치 | 항목 | 기대값 | 검증 방법 |
|---|---|---|---|
| App Store Connect → My Apps → dash2zero → 구독 → Family Sharing | 토글 | OFF | 스크린샷 캡처 + D-42 게이트 |
| Google Play Console → Subscriptions → product → Family Library | 토글 | OFF | 스크린샷 캡처 + D-42 게이트 |
| RevenueCat Dashboard → Project → Entitlements → premium → Settings | `family_share` | false | API: `GET /v1/projects/{id}/entitlements` |
| Paywall A / B / C / D | 필수 문구 9개 중 "Family sharing is not included." | 노출 | E2E 스냅샷 (analytics responsibility) |

**D-42 게이트**: 위 4 항목 모두 OFF/false 확인 + 스크린샷 보관. 1건이라도 ON/true → paid release 보류.

---

## 2. 운영 모니터링

### 2.1 회귀 catch

- **PRV-012 골든 케이스**: `pnpm eval --category=privacy` 시 family_share=false → entitlement_inherited=false 단언. CI에서 PR마다 실행.
- **RC webhook 이벤트 모니터링**: `entitlement.granted` 이벤트의 `app_user_id`가 결제자 본인과 다를 시 alert (가족 공유 의도치 않게 켜진 신호). #payments 채널 라우팅.
- **월간 점검 (1일)**: App Store Connect / Play Console / RC dashboard 3종 토글 OFF 재확인 — 자동 검증 불가, 운영 수동 체크 (M4부터 alert checklist 자동화 검토).

### 2.2 alert 트리거

| 신호 | 채널 | 1차 대응 |
|---|---|---|
| RC dashboard family_share=true 변경 audit | #payments + legal | 즉시 false 복원, audit_log 검토, 변경자 확인 |
| App Store Connect Family Sharing ON으로 변경 | (외부 — 수동 점검) | 즉시 OFF, 노출된 사용자 entitlement 재계산 |
| 동일 entitlement 다중 app_user_id transfer 패턴 | #payments | RC TRANSFER 이벤트 정상인지 검토, 가족 공유 회귀와 분리 진단 |

---

## 3. 사용자 CS 응답 템플릿

### 3.1 EN — "가족 구성원에게 구독 공유 가능?" 문의

> Hi [name],
>
> Thanks for reaching out. dash2zero subscriptions are linked to a single account and do **not** include Family Sharing. Each learner needs their own subscription so that progress, weak words, and review schedules stay personal.
>
> If a family member would like Premium, they can subscribe with their own Apple ID or Google account through the in-app paywall.
>
> Best,
> dash2zero support

### 3.2 KR — 동일 문의

> 안녕하세요,
>
> 문의 주셔서 감사합니다. dash2zero 구독은 개인 계정 단위로만 적용되며 **가족 공유는 지원하지 않습니다**. 학습 진도와 약점 단어 분석이 사용자별로 분리되어야 정확한 학습이 가능하기 때문입니다.
>
> 가족 구성원이 Premium을 사용하시려면 각자의 Apple 계정 또는 Google 계정으로 앱 내 결제 화면에서 별도 구독해 주시면 됩니다.
>
> 감사합니다.
> dash2zero 고객지원

### 3.3 환불 요청 (가족 공유 오해로 결제 후)

> Apple/Google 스토어 환불 절차를 1차 안내. 1차 응답은 영업일 3일 이내 (`docs/13_payment_policy.md §9`). 한국 사용자는 7일 청약철회 (CC3-06).

---

## 4. 정책 변경 시 (가족 공유 enable 의사결정)

향후 가족 공유 활성화 검토 시 다음 사전조건 모두 충족 필요:

1. **가격 모델 재설계**: 단일 시트 → 가족 시트 가격 분리 (USD 1.99 → USD 2.99/family 등).
2. **PRV-012 분기**: family_share=true 시나리오용 PRV-012-pos 신규 케이스 작성, evaluator 분기 추가.
3. **데이터 분리 보장**: 동일 entitlement 하 다중 사용자라도 학습 데이터(srs_progress / daily_usage / weak_words)는 user_id 기준 격리 — RLS 재검토.
4. **Paywall 문구 갱신**: 4 variant 모두 "Family sharing included" 또는 "Up to N family members" 명시.
5. **App Store Connect / Play Console / RC 토글 동시 ON** (drift 방지).
6. **재제출 + 검토**: Apple / Google 모두 가족 공유 변경은 약관/메타데이터 업데이트 대상 — 스토어 검토 통과 필요.

---

## 5. 후속 질문

- Q-PL-FS-01 (P2): RC dashboard family_share toggle 변경에 대한 audit alert 자동화 — RC API event log polling 주기 (현 수동).
- Q-PL-FS-02 (P2): App Store Connect Family Sharing 토글 변경 감지 자동화 가능 여부 — Apple은 webhook 미제공, 운영 수동 점검.
- Q-PL-FS-03 (P3): 가족 공유 활성화 비즈니스 모델 ROI 시뮬레이션 — M4 GA 후 retention 데이터 6개월 누적 후 재검토.

---

서명: payments-legal-specialist · 2026-05-11 23:00 KST
