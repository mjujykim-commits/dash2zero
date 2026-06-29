# dash2zero · 백엔드 가동 런북 (개인 e2e 테스트용)

- **작성**: orchestrator · 2026-06-29
- **목표**: 앱이 실제로 동작하도록 Supabase 백엔드를 세우고 콘텐츠·발음 음원을 채운다.
- **선행**: `docs/release/TESTFLIGHT_RUNBOOK.md` (앱 빌드/업로드). 본 문서는 그 앱이 "동작"하게 만드는 부분.

순서대로 실행한다. 계정/배포 명령은 Owner 작업, 구조·스크립트는 swarm이 준비 완료.

> **중요 — 디렉터리 구조**: canonical 코드는 `infra/supabase/`(스키마·seed) + `apps/api/edge-functions/`(함수)에 있으나,
> Supabase CLI는 `supabase/`를 읽는다. 이 변환은 **이미 생성해 둠**(`supabase/` 폴더 존재).
> canonical 파일을 고치면 `node scripts/supabase/sync-cli-layout.mjs`를 다시 돌려 `supabase/`를 갱신한다.
> 생성물: `supabase/migrations/`(스키마4 + 콘텐츠seed, 순서 보존) + `supabase/functions/`(7개) + `supabase/config.toml`(anon 함수 verify_jwt=false 보정).

---

## 0. 사전 준비
```bash
npm i -g supabase            # Supabase CLI (Windows: scoop/choco 또는 npm)
supabase login               # 브라우저 인증
```
> 만약 이후 명령이 `config.toml` 형식 오류를 내면: `supabase init`로 정식 config 생성 후
> `node scripts/supabase/sync-cli-layout.mjs` 재실행(기존 config의 [functions]만 보정함).

## 1. Supabase 프로젝트 생성 (무료) + 링크
- https://supabase.com → New project. **Project URL** / **anon key** / **service_role key** 기록, DB 비밀번호 설정.
```bash
cd <repo-root>
supabase link --project-ref <your-project-ref>   # 대시보드 Settings→General의 Reference ID
```

## 2. 스키마 + 콘텐츠 한 번에 적용  ✅ 준비됨
```bash
supabase db push
```
- `supabase/migrations/` 5개를 순서대로 원격에 적용: 스키마(init/RLS/RPC/audit) → **콘텐츠 seed(590단어)**.
- seed가 마이그레이션에 포함돼 있어 **별도 단계 불필요**. 결과: 6 packs / 590 words / 949 distractors / content_manifests.
- ⚠️ `content_manifests`가 비면 content-manifest 함수가 빈 packs 반환 → seed가 이걸 채우므로 필수(자동 포함됨).
- **대안**(CLI db push가 막히면): 대시보드 SQL Editor에 `infra/supabase/migrations/0001~0004` + `infra/supabase/seed/0010_content_seed.sql`를 순서대로 붙여넣고 Run.

## 3. Edge Function 배포 (7개)  ✅ 준비됨
```bash
supabase functions deploy content-manifest
supabase functions deploy submit-attempt
supabase functions deploy audio-signed-url
supabase functions deploy merge-guest
supabase functions deploy delete-account
# 개인 e2e엔 선택 (결제 웹훅/정리 cron):
supabase functions deploy revenuecat-webhook
supabase functions deploy cron-hard-delete
```
- 개인 최소 셋: `content-manifest`(단어) + `submit-attempt`(채점/SRS) + `audio-signed-url`(발음) + `merge-guest` + `delete-account`.
- `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`는 Edge 런타임에 **자동 주입**(별도 설정 불필요).
- `content-manifest`·`audio-signed-url`은 게스트도 호출하므로 `verify_jwt=false`로 설정됨(config.toml, 자동).
- `revenuecat-webhook`만 RevenueCat 시크릿 별도 필요(개인 e2e엔 생략 가능).

## 4. 발음 음원 생성 + 업로드  ✅ 스크립트 준비됨 (선택 — 나중에 해도 됨)
선행: Google Cloud 프로젝트 + Text-to-Speech API 활성화 + 서비스계정 JSON 키.
```bash
npm i @google-cloud/text-to-speech @supabase/supabase-js
export GOOGLE_APPLICATION_CREDENTIALS=/path/gcp-key.json
export SUPABASE_URL=https://xxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...        # service_role

node scripts/tts/generate-audio.mjs --dry-run  # 대상 확인 (API 호출 없음)
node scripts/tts/generate-audio.mjs            # 590 word 음원 생성·업로드 (~$0.1~10, 멱등)
node scripts/tts/generate-audio.mjs --examples # (선택) 예문 음원도
```
- "audio" 버킷(public) 자동 생성 + `audio_assets` 행 upsert. 재실행 시 기존 건 skip(재과금 방지).
- ⚠️ 상업 출시 시 버킷 private 전환 + premium signed-URL 게이팅 재검토 (스크립트 주석 TODO).

## 5. 모바일 앱에 백엔드 연결
`apps/mobile/eas.json`의 production `env`(또는 `EXPO_PUBLIC_*`)에 넣고 재빌드:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # anon (공개 키)
```
- 이후 `eas build` 하면 앱이 이 백엔드를 바라본다.

---

## 동작 확인 체크리스트
- [ ] 앱 첫 실행 → 온보딩 → Home에 첫 단어 노출 (content-manifest 동작)
- [ ] Lesson 진입 → 뜻/예문 표시 → 퀴즈 4지선다 (distractors 동작)
- [ ] 정답/오답 제출 → 진도 반영 (submit-attempt + SRS)
- [ ] "Hear" 단계 발음 재생 (audio_assets + audio-signed-url)
- [ ] 게스트로 쓰다 로그인 → 진도 유지 (merge-guest)

## swarm 완료 항목 (참고)
- ✅ SFX 시스템 + call-site 연결 + Settings 토글 + Kenney CC0 음원 15종(mp3) 적용
- ✅ `expo-apple-authentication` 제거 → Apple 로그인 web flow 통일 (게스트 모드로 로그인 없이 학습 가능)
- ✅ 빌드 블로커 0건 (에셋/엔트리/Firebase/expo-font 정리)
