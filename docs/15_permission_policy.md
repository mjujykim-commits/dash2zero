# 권한 정책서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-03 | Supabase 역할 x CRUD RLS 매트릭스 기준 반영 |
| CC2-05 | 13세 미만 차단과 13~17세 high privacy default 반영 |
| CC2-18 | 분석/진단 동의 기본 off, 설정에서 철회 가능 |
| Q-SEC-DOC-008 | 운영자/관리자/CS RBAC와 audit_log 기준 보강 |
| B-07 | 광고 ID/IDFA 및 개인정보 판매/공유 미사용 |

## 1. 권한 원칙

- 최소 권한: MVP에 필요하지 않은 OS 권한은 요청하지 않는다.
- 지연 요청: 기능 맥락이 생긴 뒤 권한을 요청한다.
- 기본 거부 가능: 사용자가 권한을 거부해도 핵심 학습 기능은 가능한 범위에서 유지한다.
- 분석 opt-in: 비필수 분석과 진단 수집은 기본 off다.
- 아동 보호: 13세 미만은 학습/계정/결제/분석을 모두 차단한다.
- 서버 최종 판단: 결제, 학습 한도, 계정 삭제, 데이터 접근은 서버 정책을 최종 기준으로 한다.

## 2. OS 권한 정책

| 권한 | MVP 사용 | 요청 시점 | 거부 시 대체 | 비고 |
|---|---:|---|---|---|
| 알림 | 선택 | 첫 lesson 완료 후 또는 Settings에서 사용자가 켬 | 홈/복습 화면 내 reminder 표시 | 로컬 알림 우선 |
| 마이크 | 미사용 | 요청 없음 | 해당 없음 | 음성 녹음/발화 제외 |
| 카메라 | 미사용 | 요청 없음 | 해당 없음 | 기능 없음 |
| 위치 | 미사용 | 요청 없음 | 해당 없음 | timezone은 OS locale/timezone 값만 사용 |
| 연락처 | 미사용 | 요청 없음 | 해당 없음 | 기능 없음 |
| 사진/파일 | 미사용 | 요청 없음 | 해당 없음 | 기능 없음 |
| Bluetooth | 미사용 | 요청 없음 | 해당 없음 | 기능 없음 |
| 광고 ID/IDFA | 미사용 | 요청 없음 | 해당 없음 | 광고 SDK 없음 |
| App Tracking Transparency | 미사용 | 요청 없음 | 해당 없음 | tracking 없음 |

## 3. 앱 사용자 권한

| 역할 | 조건 | 허용 기능 | 제한 |
|---|---|---|---|
| blocked_under_13 | age gate 13세 미만 | 차단 안내만 표시 | 학습, 계정, 결제, 분석 전부 금지 |
| Guest | age gate 통과, 미로그인 | Starter Pack 로컬 학습, 로컬 복습, 콘텐츠 신고 제한적 제출 | 구매, Restore, 동기화, 삭제 요청, 데이터 내보내기 불가 |
| Free User | 로그인, entitlement inactive | Starter Pack, 일일 3 신규 단어, 복습 20문항, 계정 삭제/내보내기 요청 | premium pack, 일일 한도 초과 |
| Premium User | entitlement active 또는 grace_period | 전체 콘텐츠, 일일 15 신규 단어, 복습 무제한 | 결제 실패 확정/만료 시 Free 강등 |
| Pending Delete User | deletion request active | 삭제 상태 확인, 지원 문의 | 신규 학습/결제 차단 |

## 4. 결제 권한

- 구매와 Restore Purchases는 authenticated user만 가능하다.
- RevenueCat appUserID는 Supabase auth.users.id 기준이다.
- 게스트가 구매/Restore 버튼을 누르면 로그인/가입 화면으로 보낸다.
- 가족 공유는 MVP에서 비활성화한다.
- entitlement 변경은 클라이언트가 직접 쓰지 않는다. RevenueCat webhook과 서버 동기화를 기준으로 한다.

## 5. 데이터 접근 권한

| 데이터 | Guest | Free/Premium Owner | Support | Admin | service_role |
|---|---|---|---|---|---|
| local guest data | 로컬 접근 | 가입 병합 후 서버 접근 | 없음 | 없음 | 없음 |
| profile | 없음 | 본인 R/U | 지원 케이스 범위 R | 제한 R | C/R/U/D |
| learning states | 로컬만 | 본인 C/R/U | 지원 케이스 범위 R | 제한 R | C/R/U/D |
| daily_usage | 로컬만 | 본인 R, RPC 경유 U | 지원 케이스 범위 R | 제한 R | C/R/U/D |
| subscription_entitlements | 없음 | 본인 R | 지원 케이스 범위 R | 제한 R | webhook C/R/U/D |
| content | free published | 권한에 따른 published R | R | C/R/U | C/R/U/D |
| content_reports | 제한 C | C/R own | R/U assigned | R/U | C/R/U/D |
| audit_log | 없음 | 없음 | 본인 action R | R | C/R |

## 6. 운영자 RBAC

MVP에서는 별도 웹 어드민을 만들지 않지만, 운영 접근 권한은 아래 역할로 구분한다.

| 역할 | 목적 | 허용 작업 | 금지 작업 |
|---|---|---|---|
| Owner | 전체 운영 책임 | 모든 운영 콘솔 접근, 키 관리, 결제/스토어 설정 | 평문 키 공유 |
| Content Editor | 콘텐츠 작성 | draft 콘텐츠 작성/수정 | published 직접 전환 |
| Content Reviewer | 콘텐츠 검수 | reviewed/published 승인, 오류 수정 승인 | 자신이 작성한 batch 단독 승인 원칙적 금지 |
| Support | 고객 문의 | 사용자 지원 코드 기준 제한 조회, content report 처리 | 학습 데이터 임의 수정, entitlement 직접 변경 |
| Analyst | 제품 분석 | Firebase/Crashlytics dashboard 조회 | 사용자 원문 데이터 조회 |
| Service Role | 서버 자동 처리 | webhook, deletion, import, migration | 사람이 직접 상시 사용 금지 |

### 6.1 검수 분리 잔여 결정

- CC3-07 결정: published 콘텐츠는 작성자와 독립 검수자를 분리하고 외부 한국어 원어민 또는 독립 검수자 pass/fail 검수를 P0로 요구한다. 임시 기준은 Content Editor와 Content Reviewer를 논리적으로 분리하고, 1인 운영 시에는 batch 작성 후 최소 24시간 경과 후 self-review + checklist + 샘플 재검수 로그를 요구한다. 외부 검수자를 P0 필수로 둘지 여부는 미니 라운드에서 확정한다.

## 7. 감사로그 정책

다음 작업은 audit_log에 기록한다.

| 작업 | 필수 기록 |
|---|---|
| 콘텐츠 published/paused/retired | actor, content id, old/new status, reason |
| subscription_entitlement 수동 보정 | actor, user id, old/new status, support case id |
| deletion request 처리 | actor/service, user id, action, timestamp |
| RLS/admin policy 변경 | actor, migration id, reason |
| support data access | actor, support case id, viewed scope |
| key rotation | actor, key name, rotated_at |

지원팀 또는 운영자가 사용자 데이터를 조회하는 경우, support case id 또는 content report id가 있어야 한다.

## 8. Privacy Choices 권한

| 설정 | 기본값 | 사용자가 변경 가능 | 효과 |
|---|---|---:|---|
| Analytics | off | 예 | Firebase Analytics 수집 on/off |
| Diagnostics | off | 예 | Crashlytics 수집 on/off |
| Marketing notifications | off | 예, MVP 원격 push 제외 | 13~17세는 금지 |
| Local reminders | off | 예 | OS 알림 권한 요청 |

사용자가 철회하면 이후 이벤트 수집을 중단한다. 이미 수집된 데이터 삭제 요청은 개인정보 처리방침의 DSAR 절차를 따른다.

## 9. 권한 변경 이벤트

| 전이 | 트리거 | 처리 |
|---|---|---|
| Guest -> Free User | 로그인/가입 | 로컬 학습 데이터 병합, 구매/Restore 가능 |
| Free -> Premium | purchase/restore success | entitlement active, premium content unlock |
| Premium -> Free | expired/refunded/revoked | premium content lock, 학습 기록 유지 |
| Premium -> Grace | billing issue | 일정 기간 Premium 유지, 사용자 안내 |
| Any -> Pending Delete | 계정 삭제 요청 | 신규 학습/결제 차단 |
| Any -> blocked_under_13 | age gate에서 under 13 | 모든 기능 차단 |

## 10. 보안 운영 권한

- production service role key는 앱, 문서, repo에 저장하지 않는다.
- Owner 외에는 production secret에 접근하지 않는다.
- 긴급 인수자는 sealed recovery 절차를 통해서만 접근한다.
- Supabase Dashboard 직접 수정은 migration/import 절차가 불가능한 경우로 제한한다.
- 권한 부여/회수는 변경 로그를 남긴다.

## 11. QA 기준

- 앱 설치 후 OS 권한 요청이 자동으로 뜨지 않는다.
- 알림 권한은 사용자가 reminder 기능을 켠 뒤에만 요청된다.
- 마이크/카메라/위치/연락처/사진 권한 요청이 없다.
- opt-out 사용자는 Firebase 제품 이벤트가 수집되지 않는다.
- 게스트는 구매/Restore 진입 시 로그인 요구 화면을 본다.
- Support 역할은 사용자의 학습 상태를 수정할 수 없다.
- service_role 없이 subscription_entitlements를 수정할 수 없다.
