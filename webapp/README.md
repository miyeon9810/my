# 퀘스트로그 (Quest Log)

할일을 퀘스트로 만들어 완료할 때마다 경험치를 얻고 레벨업하는 게임화 투두 앱. 같은 목표를 향한 사람들과
**파티**(사이드 목표 단위 소규모 그룹)나 **클랜**(공무원 합격, 대기업 입사 같은 인생 단위 큰 목표 그룹)을 맺고,
집중 타이머로 함께 몰입한 시간을 그룹 경험치로 쌓을 수 있다. 뱃지/업적으로 수집욕을 자극한다.

## 기능

- **퀘스트**: 난이도(쉬움/보통/어려움/에픽)별로 XP가 다른 할일. 완료하면 XP 획득 + 연속 완료 스트릭 기록
- **레벨업**: 유저/파티/클랜 각각 XP 누적에 따른 레벨 곡선
- **뱃지/업적**: 퀘스트 완료 수, 스트릭, 누적 집중 시간, 레벨, 파티·클랜 가입/개설 등 18종 자동 언락
- **파티**: 초대 코드로 소규모 그룹을 만들어 사이드 목표를 공유. 한 사람이 여러 파티에 동시에 속할 수 있음
- **클랜**: 초대 코드로 만드는 대규모·장기 목표 그룹
- **집중 타이머**: 개인/파티/클랜에 귀속시켜 시작·종료. 종료 시 분당 1XP를 얻고, 파티·클랜을 선택하면 그룹 경험치로도 합산
- **Google 로그인**: Auth.js(NextAuth v5) + Google OAuth. 웹으로 접속해서 그대로 사용

## 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 (SQLite, `better-sqlite3` 드라이버 어댑터) ·
Auth.js(NextAuth) v5 · SWR

## 로컬 실행

```bash
npm install
cp .env.example .env
```

`.env`에 값 채우기:

- `AUTH_SECRET`: `npx auth secret`로 생성
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: 아래 "Google OAuth 설정" 참고

DB 마이그레이션 + 뱃지 시드:

```bash
npx prisma migrate dev
npx prisma db seed
```

개발 서버 실행:

```bash
npm run dev
```

`http://localhost:3000` 접속.

## Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 프로젝트 생성 (또는 기존 프로젝트 사용)
2. "OAuth 동의 화면" 설정 (User Type: External, 앱 이름/이메일만 입력하면 테스트 가능)
3. "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" → 애플리케이션 유형: **웹 애플리케이션**
4. 승인된 리디렉션 URI에 추가:
   - 로컬: `http://localhost:3000/api/auth/callback/google`
   - 배포 도메인이 있다면: `https://your-domain.com/api/auth/callback/google`
5. 발급된 클라이언트 ID/시크릿을 `.env`의 `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`에 입력

## 프로젝트 구조

```
prisma/schema.prisma       DB 스키마 (User, Quest, Party, Clan, FocusSession, Badge ...)
prisma/seed.ts             뱃지 카탈로그 시드
src/lib/leveling.ts        XP/레벨 곡선, 퀘스트 난이도별 보상
src/lib/badges.ts          뱃지 카탈로그 (정적 데이터)
src/lib/achievements.ts    뱃지 언락 조건 판정 (Prisma 사용)
src/lib/quest-service.ts   퀘스트 완료 처리 (XP/레벨/스트릭/파티·클랜 XP 반영)
src/lib/focus-service.ts   집중 타이머 시작/종료 처리
src/lib/party-service.ts   파티 생성/가입/탈퇴 (초대 코드)
src/lib/clan-service.ts    클랜 생성/가입/탈퇴 (초대 코드)
src/lib/auth.ts            Auth.js 설정 (Google + Prisma 어댑터)
src/app/api/**             REST API 라우트
src/app/(app)/**           로그인 후 화면 (대시보드/파티/클랜/집중/업적)
src/components/**          공용 UI 컴포넌트
```

## 빌드/린트

```bash
npm run lint
npm run build
```
