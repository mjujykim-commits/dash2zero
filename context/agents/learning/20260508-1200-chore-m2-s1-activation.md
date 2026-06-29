# M2-S1-03 — learning Specialist 활성화 (D-008)

- **Agent**: learning (Specialist, D-008로 정식 활동 시작)
- **Commit SHA**: m2-s1-c3
- **Branch / Worktree**: chore/m2-s1-learning-activation / (M2-S1 단일 트리, M2-S2부터 worktrees/learning/)
- **작업 목표**: 정식 활동 1차 — B-1 Starter Pack 60단어 검수 준비 + SRS 정확성 자문 standby
- **활동 범위 (W5 시작)**:
  1. **콘텐츠 검수표 v0.1 작성** — CC2-11 정량 기준 8 항목 (필수 필드/한글 표기/RR 일치/gloss 1-5단어/예문 신규 학습 포인트 1개/금지 표현/distractor 중복/오디오 매칭). M2-S2 진입 전 완성 예정.
  2. **외부 검수자 1명 모집 시작** — Reddit r/Korean / 한국어 교육 커뮤니티에 W4-W5 공고. R-01 리스크 완화.
  3. **B-1 Starter Pack 60단어 빈도 코퍼스 1차 정리** — 국립국어원 빈도 자료 + 영어권 K-content 검색 키워드 mix. M2-S2 W6에 candidate list 완성.
- **변경된 파일** (이번 활성화 기준): 본 context 기록만. 실제 산출물은 W5-W7
- **사용한 Skill**: content-research-writer · prompt-engineering
- **내린 결정**: B-1 batch 워크플로우 = (1) candidate list → (2) AI 보조 초안 → (3) 한국어 원어민 review → (4) TTS 생성 → (5) audio_hash 검증 → (6) Supabase Storage upload → (7) content_manifest publish (총 7 step)
- **리스크 / 후속 작업**: R-01 외부 검수자 미모집 시 fallback (PM 자체 검수 + 24h self-review). W5 종료까지 결정.
- **의존성 / blocker**: backend의 content_manifest 스키마 (M2-S2 W6 작성 예정)
- **다음 추천 액션**: W5 종료까지 검수표 v0.1 + 외부 검수자 모집 결과 보고
