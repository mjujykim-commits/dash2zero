# dash2zero 기획 검토 Sub Agent 팀 — 세션 종료 아카이브

> 보존 일자: 2026-05-07
> 보존 사유: 기획서 v0.3 봉인 + 개발 인계 단계 진입에 따른 세션 종료
> 원래 위치: `.claude/agents/`
> 현재 위치: `docs/archive/agents/` (이 디렉토리)

---

## 1. 보존 사유

dash2zero의 기획 단계(사업계획서 + 23개 서비스 기획서)가 **v0.3로 봉인**되고 swarm coding 개발 인계(`docs/00_development_handoff.md`)로 단계가 전환되어, 기획서 검토에 사용된 12명 페르소나의 **세션을 의미적으로 종료**한다.

페르소나 파일은 삭제하지 않고 보존한다. 이유:

- **출시 직전 최종 검토**(베타 → GA 전) 시 동일 페르소나 활용 가능
- **C-13(사업자) 확정 후** 약관/결제 정책 재검토 시 활용 가능
- **베타 피드백 반영 후** 영역별 수정 검토 시 활용 가능
- **새로운 사업/제품 라운드** 시 검증된 페르소나로 재구성 가능

## 2. 활동 이력 (2026-05-07)

| 라운드 | 활동 | 산출물 |
|---|---|---|
| 1차 사업계획서 리뷰 | 12 agent × 평균 15Q | 181 질문, Cross-cutting C 20개 |
| 2차 답변 검증 | 답변 충분성 평가 + 파생 질문 | 111 신규 질문, C2 20개, 답변 충돌 10건 |
| 23개 서비스 기획서 통합 리뷰 | 영역별 분배 검토 | 177 신규 질문, CC2 25개, 출시 차단급 B-12개 |
| **합계** | **3 라운드** | **약 470 질문, 67 Cross-cutting 결정** |

## 3. 최종 결정 로그 위치

기획 검토 결과는 다음 두 파일에 봉인되어 있다.

- `docs/REVIEW_QA.md` (사업계획서 리뷰)
- `docs/SERVICE_REVIEW_QA.md` (23개 서비스 기획서 리뷰)

두 문서의 **§5 / §8 결정 사항 로그**가 SSOT다.

## 4. 12명 페르소나 명단

| 역할 | Agent ID | 책임 영역 |
|---|---|---|
| 시니어 서비스 기획자 | `product-planner-senior` | PRD, 기능 명세서, 화면설계서, 운영 어드민, ASO |
| 시니어 PM | `pm-senior` | 일정, 태스크 분해, 배포 체크리스트, 운영 매뉴얼 |
| 시니어 UX/UI 디자이너 | `ux-ui-designer-senior` | 화면설계서, 디자인 시스템, UX Writing |
| 시니어 시스템 아키텍트 | `system-architect-senior` | 기술 아키텍처, 스택 선택, 비기능 요구사항 |
| 시니어 모바일 프론트엔드 | `mobile-frontend-senior` | iOS/Android 구현 가능성, OS 통합 |
| 시니어 백엔드 엔지니어 | `backend-engineer-senior` | ERD, API 명세, 인증, 결제 검증 |
| 시니어 보안/개인정보 전문가 | `security-privacy-senior` | 개인정보 처리방침, 권한 정책, 보안 |
| 시니어 QA 엔지니어 | `qa-engineer-senior` | 테스트 케이스, 배포 체크리스트, 엣지 케이스 |
| 시니어 학습 설계자 | `learning-design-expert` | 커리큘럼, 학습 방법론, 콘텐츠 가이드 |
| 시니어 데이터/분석 엔지니어 | `data-analytics-senior` | 이벤트 택소노미, KPI 측정 가능성 |
| 시니어 결제/법무 전문가 | `payments-legal-specialist` | 결제 정책, 약관, 환불, 컴플라이언스 |
| 시니어 DevOps/릴리스 | `devops-release-senior` | CI/CD, 앱스토어 배포, ASO 메타데이터 |

## 5. 재활성화 방법

향후 재검토가 필요한 경우 다음 절차로 재활성화한다.

```bash
# 전체 12명 재활성화
mv docs/archive/agents/*.md .claude/agents/

# 또는 특정 페르소나만 재활성화 (예: 결제/법무만)
mv docs/archive/agents/payments-legal-specialist.md .claude/agents/
```

재활성화 후 Claude Code 세션을 재시작하면 sub-agent 시스템에 다시 등록된다.

## 6. 다음 단계 (개발 인계)

이 archive는 기획 검토용이며, swarm coding 단계의 agent는 별도 페르소나로 구성한다. 개발 인계 패키지(`docs/00_development_handoff.md`)의 §6 권장 분배는 다음 6개 트랙이다.

| Agent 트랙 | 담당 |
|---|---|
| Mobile UI | navigation, screens, word flow, settings |
| Learning Core | local SQLite, SRS, daily usage |
| Backend/Data | Supabase schema, RLS, Edge Functions |
| Monetization | RevenueCat, paywall, entitlement, restore |
| Content Pipeline | CSV validation, TTS assets, content manifest |
| Analytics/QA/Release | Firebase, QA cases, deployment checklist |

이 6개 트랙의 페르소나가 필요한 시점에 `.claude/agents/`에 새로 작성한다.

## 7. 종료 확인

- 2026-05-07: 12명 페르소나 파일 `.claude/agents/`에서 `docs/archive/agents/`로 이동 완료
- `.claude/agents/` 디렉토리: 비어 있음 (sub-agent 시스템에 등록되지 않음)
- 본 README.md로 종료 사유 및 재활성화 방법 보존
