# 학습 방법론 및 커리큘럼 설계서

> 프로젝트명: dash2zero  
> 문서 상태: v0.3 초안 — CC3 답변 반영 / 개발 인계 기준  
> 작성일: 2026-05-07  
> 기준 문서: 01_business_plan.md, REVIEW_QA.md, SERVICE_REVIEW_QA.md  
> 공통 전제: 모바일 앱 중심, React Native + Expo + TypeScript, Supabase, RevenueCat, Firebase Analytics/Crashlytics, 영어권 초보 학습자, MVP 음성 녹음/발화/사용자용 AI 제외


---

## 0. v0.2 반영 요약

| 반영 항목 | 결정 |
|---|---|
| CC2-09 | Mastered 후 60/120일 재노출은 MVP 제외, Phase 3 실험 후보 |
| CC2-10 | 오답은 기본 stage -1, 동일 due cycle 2회 연속 오답 시 stage 1 + weak |
| CC2-25 | 학습 카드 흐름은 Notice -> Hear -> Meaning -> Retrieve 4단계 |
| CC2-15 | 콘텐츠는 Starter 60단어 + 50단어 batch x 6으로 제작/검수 |

## 1. 학습 철학

dash2zero의 학습 철학은 “짧게 보고, 듣고, 기억에서 꺼내고, 다시 만나는 것”이다. 초보자에게 긴 문법 설명을 먼저 제공하지 않고, 단어를 실제 상황과 짧은 문장 안에서 반복적으로 만나게 한다.

## 2. 핵심 원칙

1. Meaning First: 영어 번역은 제공하되 상황과 예문을 함께 제시한다.
2. Active Recall: 보기만 하는 카드보다 기억에서 고르는 퀴즈를 우선한다.
3. Spaced Repetition: 잊기 전에 다시 만나는 복습 큐를 제공한다.
4. Korean-specific Awareness: 한글, 소리, 로마자, 조사/패턴을 초보 친화적으로 노출한다.
5. Tiny Habit: 기본 학습 루프는 하루 3분, 3단어로 끝난다.

## 3. 레벨 체계

| 내부 레벨 | 설명 | 사용자 노출 |
|---|---|---|
| A0 | 완전 초보, 한글과 기본 단어 모두 낯섦 | New to Korean |
| A1 | 쉬운 단어와 표현 일부 이해 | Beginner |
| A1+ | 단어를 조금 알고 짧은 예문 이해 가능 | Returning learner |

TOPIK 직접 매핑은 하지 않는다. 앱스토어/마케팅에서도 TOPIK 점수 보장을 말하지 않는다.

## 4. 4단계 학습 루프

| 단계 | 학습 목적 | 화면 요소 | 완료 조건 |
|---|---|---|---|
| Notice | 한글 형태 인지 | 한글 대형 표시, romanization 보조 | 사용자가 Continue |
| Hear | 소리 노출 | 수동 오디오 버튼, 재생/실패 상태 | 재생 또는 Skip |
| Meaning | 뜻 연결 | 영어 뜻, 짧은 예문, pattern note 선택 | 사용자가 Continue |
| Retrieve | 회상 | 4지선다 객관식, 즉시 피드백 | attempt 저장 |

오디오는 자동재생하지 않는다. Hear 단계에서 사용자가 직접 재생한다.

## 5. SRS 모델

MVP는 자체 Leitner 5단계를 사용한다.

| Stage | Label | 다음 복습 | 상태 의미 |
|---:|---|---:|---|
| 1 | New | 1일 후 | 처음 배웠거나 약한 기억 |
| 2 | Learning | 3일 후 | 초급 기억 형성 |
| 3 | Familiar | 7일 후 | 단기 기억 안정 |
| 4 | Strong | 14일 후 | 장기 기억 전환 |
| 5 | Mastered | 30일 후 | 유지 복습 대상 |

### 5.1 전이 규칙

- 정답: next_stage = min(5, current_stage + 1)
- 오답 1회: next_stage = max(1, current_stage - 1)
- 동일 due cycle에서 같은 word_id 2회 연속 오답: next_stage = 1, weak = true
- Mastered(stage 5) 1회 오답: stage 4
- 60/120일 장기 재노출: MVP 제외, Phase 3 실험 후보

## 6. Mastered / Weak 기준

| 지표 | 기준 | 앱 사용 |
|---|---|---|
| Mastered | stage 5 도달 | progress와 review prioritization |
| Weak | weak=true 또는 최근 due cycle 반복 오답 | weak words queue 우선 노출 |
| Overdue | next_review_at이 현재보다 지남 | review due count |

v0.1의 “정답률 80% 이상, 최소 4회 정답”은 MVP Mastered 판정 기준에서 제거한다. 분석용 보조 지표로는 남길 수 있다.

## 7. 초기 300단어 구성

| 팩 | 단어 수 | 접근 | 목적 | 예시 범주 |
|---|---:|---|---|---|
| Starter Pack | 60 | Free | 첫 가치 경험 | 인사, 감사, 음식, 숫자, 기본 요청 |
| Survival Korean | 80 | Premium | 여행/생존 | 장소, 이동, 결제, 카페, 식당 |
| Daily Korean | 80 | Premium | 일상 이해 | 쇼핑, 날씨, 감정, 시간, 약속 |
| K-Content Korean | 80 | Premium | K-content/관계 표현 | 드라마 감정, 팬 활동, 친구, 일상 표현 |

MVP 전체는 300단어 구조를 기준으로 하되, Starter Pack 60단어는 별도 P0 milestone으로 관리한다.

## 8. 선정 가중치

| 기준 | 비중 |
|---|---:|
| 실사용성 | 40% |
| 초보 난이도 | 25% |
| 여행/K-content 적합성 | 20% |
| 예문 확장성 | 15% |

## 9. 한글/로마자 정책

- 로마자 표기는 Revised Romanization 기준이다.
- 한글 자모 선행 코스는 필수로 분리하지 않는다.
- 첫 5개 카드에서 음절 구조를 짧게 노출한다.
- 이후 단어 카드에서 자모/받침/발음 노트를 점진적으로 제공한다.
- 한글은 항상 최상위 시각 요소로 둔다.
- 로마자는 보조 정보이며 설정에서 숨길 수 있다.

## 10. 발음/받침/연음 노트

MVP는 발음 평가를 하지 않는다. 단, 초보자의 오해를 줄이기 위해 아래 수준의 짧은 note를 허용한다.

| 유형 | 기준 | 예시 처리 |
|---|---|---|
| 받침 | 철자와 소리 차이가 큰 경우만 | “final consonant sound” 수준의 짧은 영어 note |
| 연음 | 예문 이해에 필요한 경우만 | 예문 단위 note |
| 된소리/거센소리 | 초보 혼동이 큰 경우만 | 긴 음운 설명 금지 |

RR 표기는 표준 표기를 유지하고, 실제 발음 변화는 pronunciation_note에만 짧게 둔다.

## 11. 조사/패턴 처리

조사와 표현은 단어 수에 포함하지 않는 pattern 단위로 관리한다. MVP는 아래 패턴만 다룬다.

- 주세요
- 이에요/예요
- 은/는
- 이/가
- 을/를
- 에
- 에서

패턴은 문법 강의가 아니라 예문 이해 보조로만 제공한다.

## 12. 예문 설계

- 예문은 3~6어절 이내로 한다.
- 신규 단어 외 문장 구성은 A0~A1 수준으로 제한한다.
- 한 예문에는 신규 학습 포인트를 1개만 둔다.
- 영어 번역은 자연스럽되 직역이 필요한 경우 짧은 학습 보조 메모를 둔다.
- 존댓말을 기본으로 한다.
- 비속어, 선정적 표현, 혐오/정치/종교 논쟁 표현은 제외한다.

## 13. 콘텐츠 확장 정책

MVP 이후 월 50단어 Premium pack을 실험할 수 있다. 단, MVP 시점에는 신규 월간 pack의 free sample 정책을 확정하지 않는다.

관련 잔여 결정은 PRD와 기능명세의 CC3-01 결정: 신규 Premium pack 무료 샘플 10개는 daily 3과 분리한 preview pool로 운영한다에서 추적한다.

## 14. 제외 범위

- 발음 평가
- 음성 녹음
- 실시간 회화
- AI 개인화
- TOPIK 모의고사
- 중급 문법 설명
- 60/120일 장기 retention review
