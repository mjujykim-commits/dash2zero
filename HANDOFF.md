# 인수인계서 (Session Handoff)

> **다음 오케스트레이터는 이 문서를 먼저 읽으세요.**
> 최종 업데이트: 2026-07-09 · 브랜치: `master` (푸시 완료) · 타입체크 baseline: **22 errors (기존값, 신규 0)**

프로젝트: **dash2zero** — 한국어 어휘 학습 앱 (Expo/React Native 모노레포 + Supabase).
개발 환경: Windows 11(주 개발기, 로컬 스크립트/Ollama 실행), 빌드는 빌린 **Mac + Xcode**.

---

## 1. 이번 세션에 한 일 (모두 커밋·푸시 완료)

| 커밋 | 내용 |
|---|---|
| `2df854f` | 시험 레벨에 **TOPIK 급수 대응 칩**(예: TOPIK 1–2급) 표시 |
| `784f489` | **틱톡식 부드러운 스와이프 + 다음 콘텐츠 미리보기** — 새 `SwipeCard` 컴포넌트, Sentence Cloze에 적용 |
| `4d8d92c` | 4개 퀴즈(exam/photo/picture/vocab)에 부드러운 손가락 추종 스와이프 |
| `d05db66` | Study/Exam-Study(브라우즈)에 **양방향(위=다음/아래=이전) 미리보기 스와이프** |
| `5299e01` | **게이미피케이션 홈 대시보드 + 하단 탭바** (Home/Quiz/Exam/Growth) |
| `e1b5218` | **애니메이션 브랜드 스플래시** (Dash2Zero, 빛 좌→우 스윕 ×2) |
| `c1c4dc1` | 다크 투명 `splash.png` (1284×2778) |
| `6c11825` | **expo-splash-screen**으로 네이티브→JS 스플래시 무결점 핸드오프(코드) |
| `d3b61cd` | Exam 흐름(트랙/레벨/모드) 전체에 하단 탭바 통일 |
| `99bc35d` | **gloss 교정 6,695단어 병합** + 앱용 예문 파일 생성 (`merge-gloss.mjs`, `upload-tracks.mjs`) |
| `64b28ed` | **D2 브랜드 앱 아이콘** (iOS + Android 적응형) |

### 결과물 요약
- **브랜딩 통일**: 스플래시(Dash2Zero) · 홈 · 앱 아이콘(D2) 모두 다크 `#0A0A0F` + 시그니처(퍼플 `#9333EA`·핑크 `#EC4899`·시안 `#06B6D4`).
- **스와이프**: 전 화면이 `SwipeCard`로 통일(구 `useVerticalSwipe` 제거). 임계값 `DIST_THRESHOLD=화면20%`, `VEL_THRESHOLD=0.6` (숫자만 조정 가능).
- **홈 대시보드**: 레벨/실력등급/XP(ProficiencyCard) + 성장 타일(아는 단어/복습/연속) + 금주 학습 막대그래프(WeekChart).
- **콘텐츠**: gloss 6,695단어 교정본 + 예시어·예문을 Storage에 업로드·검증 완료(앱 재빌드 불필요).

---

## 2. 지금 상태 (Live / 검증됨)

- **코드**: `master`에 전부 푸시됨. 타입체크 22 = 기존 baseline(신규 오류 0).
- **콘텐츠(Storage, 공개 버킷 `images/`)**: 아래 3개 최신본 업로드·fetch 검증 완료
  - `track-topik.json` (5,708단어), `track-kiip.json` (5,768단어) — 교정 gloss 반영
  - `track-examples.json` (6,695단어) — 예시어 2개 + 예문 1개
  - 검증 예: 감사→"gratitude; thanks", 차→"order, next; the -th time/round" (+예문 차기/차년도), 육→"six (6) (六)"
- **아이콘/스플래시**: 코드·에셋 반영 완료. **단, 네이티브 리소스라 Mac 재빌드해야 실기기/시뮬에 보임**(아래 3번).

---

## 3. 다음 오케스트레이터가 이어서 할 일

### 🔴 즉시: 사용자가 Mac에서 네이티브 빌드로 최종 확인 (진행 중)
사용자가 세션 종료 후 Mac에서 아래를 실행해 아이콘·스플래시를 확인할 예정:
```bash
cd ~/경로/dash2zero && git pull origin master
pnpm install                     # expo-splash-screen 추가됨 — 필수
cd apps/mobile
npx expo prebuild -p ios --clean # 아이콘/스플래시/splash-screen 네이티브 링크
open ios/*.xcworkspace           # Xcode ▶ Run
```
- 아이콘 안 바뀌면: 앱 삭제 → ⇧⌘K(Clean) → 재빌드 (네이티브 캐시).
- Metro 없이 껐다 켜려면 스킴을 **Release**로. (Debug는 Metro 필요 — "No bundle URL" 정상)
- **확인 결과 피드백을 받으면**: 스플래시 스윕 속도(현재 900ms×2), 로고 크기, 탭바 색 등 미세 조정.

### 🟡 선택: 퀴즈 화면 "다음 문제 미리보기(peek)"
- 현재 4개 퀴즈는 **부드러운 스와이프만** 적용됨(peek 없음). Sentences/Study에는 peek 있음.
- 원하면 퀴즈 타입별 next-preview 노드를 `SwipeCard`의 `next` prop으로 추가.

### 🟢 참고: 콘텐츠 파이프라인 (완료됐지만 재실행 시)
- `sources/examples_out.json` = gen-examples 산출물 (6,695/6,701, 6개만 스킵).
- 재병합: `node scripts/llm/merge-gloss.mjs` → `sources/track-{topik,kiip}.json` + `track-examples.json` 갱신.
- 업로드: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`(레거시 JWT, `eyJ...`) 세팅 후 `node scripts/llm/upload-tracks.mjs`.

---

## 4. 핵심 기술 컨텍스트 (막히면 여기)

- **콘텐츠 호스팅 = Supabase Storage** (공개 버킷 `images/`). 앱은 `?t=timestamp`로 매번 최신 fetch → **JSON만 업로드하면 앱 재빌드 없이 반영**. URL: `https://majgmaoetjjajhdmdcgc.supabase.co/storage/v1/object/public/images/...`
- **업로드 자격증명은 사용자만 보유**(service_role JWT, `eyJ`로 시작). 오케스트레이터 환경엔 없음 → 업로드는 사용자 터미널에서. `sb_secret_...` 새 형식 키는 Storage에서 "Invalid Compact JWS" 나므로 **레거시 JWT** 사용.
- **로컬 LLM**: Ollama `gemma4:latest` @ localhost:11434 (무료). `scripts/llm/*.mjs`.
- **스와이프**: `src/components/SwipeCard.tsx` (core Animated + PanResponder, 추가 의존성 없음). gesture-handler **미설치**.
- **진척 데이터(로컬 SecureStore)**: `src/lib/progress.ts` (xp/level/band/streak/**history=일자별 정답수**/getWeeklyStudy), `knownStore.ts`(아는단어), `reviewStore`·`examReviewStore`(오답풀). 집계는 `src/lib/homeStats.ts`.
- **탭바**: `src/components/TabBar.tsx` — Stack 라우터 유지 + `router.replace`. 허브 화면(menu=home, quizzes, exam, achievements=growth)에 부착. **정식 expo-router Tabs 전환은 안 함**(첫 실행 흐름/딥링크 리스크 때문에 커스텀 푸터 채택).
- **스플래시**: `src/components/BrandSplash.tsx`(JS 애니메이션) + `_layout.tsx`에서 `preventAutoHideAsync`/`hideAsync` 핸드오프. `app.json` splash·adaptiveIcon 배경 모두 `#0A0A0F`.
- **`.gitignore`**: `sources/track-{topik,kiip}.json`은 ignore(용량). 로컬 디스크엔 최신본 있음. `track-examples.json`은 커밋됨.

---

## 5. 주의사항 / 알아둘 것

- **타입체크 baseline = 22 errors**. 작업 후 `cd apps/mobile && npx tsc --noEmit`로 22 유지 확인(신규 오류 0이어야 함).
- **Windows 셸에서 curl -d에 한글 인라인 금지** → 파일로 저장 후 `--data-binary @file` (또는 node fetch로 바이트 그대로).
- 커밋 메시지 말미: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- 사용자는 **한국어**로 소통. 개발기는 Windows(PowerShell), 빌드는 Mac.
- 미커밋 잡파일들(`sources/agent_results/`, `emoji_map.csv` 등)과 `.gitignore` 수정은 이전 작업 잔재 — 이번 세션과 무관.

---

## 6. 더 이전 맥락 (필요 시)
전체 대화 로그: `C:\Users\JY\.claude\projects\C--Users-JY-Desktop-dash2zero\e8b6c897-09d7-406d-a946-6fd74e9b4cb9.jsonl`
이전 대규모 작업: Sentence Cloze 대량생성(12,854 pass), 사진 재소싱+비전QA, TOPIK/KIIP 트랙(초/중/고급 3-tier + 급수 대응), 게이미피케이션, known/unknown SRS.
