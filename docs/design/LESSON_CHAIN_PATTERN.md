# Lesson Chain UX Pattern

> 문서 상태: v1.0 (M3 W15)
> 작성: designer (senior UX/UI), 2026-05-11 23:00
> 협업: frontend (lesson chain fetch 교체 작업과 동시 인계)
> 상위 SSOT: `docs/10_design_system.md` §7.3 / §8, `docs/brand/THEME_DECISIONS.md` §7
> 하위 영향: `apps/mobile/app/lesson/[wordId].tsx`, `apps/mobile/app/lesson/complete.tsx`

---

## 0. 배경 — R-28 (lesson chain STUB → 실제)

W14 readiness §2.2: STUB_WORD 1개로만 lesson 진입 시 `lesson_complete_rate = 100%` 인공값. W15 frontend가 실제 chain fetch (N=3~10 words) 로 교체. 본 문서는 chain UX 일관성을 보장한다.

---

## 1. Chain 정의

- **Chain**: 한 학습 세션에서 사용자가 순차로 통과하는 단어 카드 배열 (N>=1).
- **Card**: chain의 한 단어 카드 (4 stage: notice / hear / meaning / retrieve).
- **Complete 화면**: chain 마지막 카드의 retrieve가 정답/오답 처리된 직후 단 한 번 진입.

---

## 2. 진행 표시 (Progress) — 카드 레벨

### 2.1 표시 위치
- 화면 상단 정중앙. SafeAreaView top + `space.6`(24).
- 기존 stage 표시 ("1 of 4") **위에** 카드 진행 표시 ("Card 2 of 5") 추가.

### 2.2 시각 사양

| 요소 | 토큰 / 값 |
|---|---|
| 표시 텍스트 | `Card {n} of {N}` (영문 1차 언어 결정 시) |
| 폰트 | `text.caption` (13/18, regular, Inter) |
| 색 | `text.muted` (#A1A1AA light / #71717A dark) |
| 정렬 | center |
| 마진 bottom | `space.2` (8) |
| 진행 바 | **금지** — 텍스트만. 게임화 회피 (Honest 톤) |

### 2.3 N=1인 경우
- chain이 단 1개 카드인 경우 `Card 1 of 1` **표시**. 측정 신뢰성을 위해 일관 표시. ("hide single" 트릭 금지)

### 2.4 Stage 표시 (기존 유지)
- 카드 진행 표시 바로 아래. `space.4` (16) 간격.
- 텍스트: `{stageIdx+1} of 4`.

ASCII (SE 320pt 기준):

```
+------------------------------------+
| (top safe area)                    |
|                                    |
|             Card 2 of 5            | <- 13/18 muted
|              1 of 4                | <- 13/18 muted
|                                    |
|              사 과                  | <- text.word 44
|                                    |
|             [▶ audio]              |
+------------------------------------+
```

---

## 3. Card Transition Motion

### 3.1 일관 토큰
- 카드 → 다음 카드 전환: `motion.fast` (80ms) **opacity fade** + `motion.medium` (200ms) **content slide-in 8px from right**.
- easing: `easing.out` (cubic-bezier(0.16, 1, 0.3, 1)).
- **bounce/spring 금지** (DESIGN_DIRECTION §9 재확인).

### 3.2 RN 매핑

```ts
// 카드 unmount fade
Animated.timing(opacity, { toValue: 0, duration: 80, easing: Easing.out(Easing.cubic) })
// 새 카드 mount slide+fade
Animated.parallel([
  Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic) }),
  Animated.timing(translateX, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic) }),
])
```

### 3.3 Submit → Next 지연
- 현재 `setTimeout(next, 800)` 정답/오답 색만 노출. 유지.
- chain 안에서 다음 카드는 800ms 지연 + 위 80/200 transition 적용.
- **마지막 카드만** 800ms 지연 후 complete 화면으로 router.replace.

### 3.4 모션 감소 (Reduce Motion)
- iOS Settings > Accessibility > Reduce Motion = ON 시 transition을 **opacity 80ms만**으로 단축. translate 제거.
- RN: `AccessibilityInfo.isReduceMotionEnabled()` 체크.

---

## 4. Complete 화면 진입 조건

### 4.1 진입 조건 (frontend 정합)
- `currentCardIdx === chain.length - 1` **AND**
- 마지막 카드 `submitted === true` **AND**
- submit 후 800ms 경과
- 이때만 `router.replace('/lesson/complete')`.

### 4.2 금지 조건
- 사용자가 chain 중간에 back 버튼 → complete 진입 **금지**. home으로 직접 replace.
- 카드 fetch 실패 → complete 진입 **금지**. error 상태 표시 (STATE_PATTERNS.md 참조).

### 4.3 chain 빈 경우 (N=0)
- frontend는 chain이 비면 lesson 진입 자체를 막아야 함. designer는 home의 disabled 상태 ("All caught up") 로 안내.
- 이미 lesson에 진입한 후 N=0 fetch 결과를 받은 경우: error 상태가 아닌 **empty 상태 화면** 표시 (STATE_PATTERNS.md `lesson.empty`).

---

## 5. paywall_signin_required 안내 컴포넌트

### 5.1 문제 (R-28과 별개, paywall_view→purchase 측정 위협 중간 단계)
- guest가 `Subscribe` tap → `ensureSignedIn()` → `/auth/sign-in` redirect.
- 사용자는 **왜** sign-in이 필요한지 모름. 이탈 가능.

### 5.2 컴포넌트: `PaywallSignInNotice`

**위치**: paywall.tsx 내, Subscribe 버튼 tap 직후 sign-in redirect **전에** 1줄 inline notice. 별도 modal/sheet 아님.

**시각 사양**:

| 요소 | 값 |
|---|---|
| 위치 | Subscribe 버튼 **위** (margin-bottom `space.3` = 12) |
| 텍스트 | `Sign in required to subscribe.` (영문 1차 가정) |
| 한국어 (i18n 후) | `구매 전 가입이 필요해요.` |
| 폰트 | `text.caption` (13/18, regular, Inter) |
| 색 | `text.secondary` (#52525B) |
| 정렬 | center |
| 아이콘 | **없음** (Honest 톤 — 경고 색/감정 회피) |
| 표시 시점 | guest 사용자 mount 후 즉시 표시 (idempotent) |

### 5.3 마이크로카피 (Honest 톤, designer 자율)

| 시점 | 영문 | 한글 |
|---|---|---|
| 사전 안내 (paywall mount, guest) | `Sign in required to subscribe.` | `구매 전 가입이 필요해요.` |
| Restore 사전 안내 (guest) | `Sign in to restore your purchase.` | `복원하려면 가입이 필요해요.` |
| sign-in 화면 진입 시 (return_to=paywall) | `Sign in to continue to Premium.` | `Premium 결제를 위해 로그인해 주세요.` |

원칙:
- "free trial", "save", "limited" 같은 충동 유발 문구 금지.
- 1줄, 마침표로 끝남, 명령형 회피 (정중한 진술).
- 느낌표 금지.

### 5.4 frontend emit 정합
- frontend가 `paywall_signin_required` event를 emit하는 시점 = 본 컴포넌트가 **표시**되는 시점이 아닌, 사용자가 **Subscribe/Restore tap 직후 redirect 직전**.
- 즉 mount 시 본 컴포넌트는 표시되지만 event는 tap 시 1회 emit (analytics 합의).

---

## 6. 검증 체크리스트 (frontend handoff)

- [ ] `Card N of M` 표시 위치 = stage indicator 위, `space.2` 간격
- [ ] N=1일 때도 표시
- [ ] transition 80ms fade + 200ms slide opacity
- [ ] reduce motion 시 translate 제거
- [ ] complete 진입은 마지막 카드 submit 후 800ms만
- [ ] chain N=0 fetch 결과 시 empty 상태 표시
- [ ] PaywallSignInNotice는 guest mount 시 항상 표시
- [ ] notice 색은 `text.secondary` (caution 색 금지)

---

## 7. 변경 이력

| 일자 | 버전 | 변경 |
|---|---|---|
| 2026-05-11 | v1.0 | 초안 (designer agent, M3 W15) |
