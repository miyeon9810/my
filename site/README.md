# 퀘스트로그 (Quest Log) — 정적 버전

`webapp/`의 Next.js/Prisma 버전과 기능은 동일하지만, GitHub Pages처럼 서버가 없는 정적 호스팅에 그대로
올릴 수 있도록 **Firebase(Google 로그인 + Firestore)** 를 백엔드로 쓰는 순수 프론트엔드(SPA)로 다시 만든
버전이다. 서버/DB를 직접 운영하지 않고도 Google 로그인, 실시간 데이터, 여러 명이 함께 쓰는 파티/클랜 기능이
전부 동작한다.

**배포 주소: https://miyeon9810.github.io/my/quest/** (Firebase 시크릿을 등록하기 전까지는 "설정이 필요해"
화면만 뜬다 — 아래 "Firebase 설정" 참고)

## 기능

`webapp/README.md`와 동일 — 퀘스트/XP/레벨업, 뱃지 18종, 파티·클랜(초대 코드), 집중 타이머(개인/그룹 XP 반영),
Google 로그인.

## 스택

Vite + React 19 + TypeScript · Tailwind CSS v4 · React Router (HashRouter) · Firebase (Auth + Firestore)

라우팅에 `HashRouter`(`/#/dashboard` 형태)를 쓰는 이유: GitHub Pages는 SPA용 서버 리라이트를 지원하지
않아서, 새로고침하거나 딥링크로 들어오면 404가 난다. 해시 라우팅은 서버 설정이 전혀 필요 없어서 어떤
경로/서브폴더에 배포하든 그대로 동작한다. `vite.config.ts`의 `base: './'`도 같은 이유로 상대 경로를 쓴다.

## 로컬 실행

```bash
cd site
npm install
cp .env.example .env.local
```

`.env.local`에 Firebase 설정값 채우기 (아래 "Firebase 설정" 참고), 그다음:

```bash
npm run dev
```

Firebase 값이 비어 있어도 앱은 죽지 않고 "Firebase 설정이 필요해" 화면을 보여준다.

## Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. **Authentication** → Sign-in method → **Google** 제공업체 사용 설정
3. **Firestore Database** → 데이터베이스 만들기 (프로덕션 모드로 시작해도 됨, 아래 규칙을 곧 붙여넣을 것)
4. Firestore Database → Rules 탭에 이 저장소의 `site/firestore.rules` 내용을 그대로 붙여넣고 게시
5. 프로젝트 설정(⚙️) → "내 앱" → 웹 앱 추가 (`</>` 아이콘) → 이름만 입력하고 등록 → `firebaseConfig` 값 복사
6. 그 값들을 `.env.local`(로컬 개발) 또는 GitHub 저장소 Secrets(배포용, 아래 참고)에 채우기:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
7. Authentication → Settings → **승인된 도메인**에 `miyeon9810.github.io` 추가

이 Firebase 값들은 브라우저에 그대로 노출돼도 되는 "공개 설정값"이다 (비밀키가 아님). 실제 접근 제어는
5단계의 Firestore 규칙이 담당한다.

## GitHub Pages 배포 — 이미 라이브 상태

`.github/workflows/deploy-pages.yml`(저장소 루트)이 루트의 개인 랜딩페이지(`index.html`/`mee.png`/`on.ttf`)와
`site/`를 함께 빌드해서 GitHub Pages로 올린다. `main`에 관련 파일이 푸시되면 자동 실행되고, Actions 탭에서
수동 실행(`workflow_dispatch`)도 된다. 이미 `main`에 병합되어 배포까지 확인됐다:

- 루트(`https://miyeon9810.github.io/my/`) = 기존 랜딩페이지, 그대로 유지
- `https://miyeon9810.github.io/my/quest/` = 이 앱

**남은 건 하나뿐 — Firebase 시크릿 등록** (구글 계정으로 Firebase 콘솔에 직접 들어가야 하는 작업이라
Claude가 대신 할 수 없다):

1. 위 "Firebase 설정" 순서대로 프로젝트 생성 + `site/firestore.rules` 게시
2. 저장소 Settings → Secrets and variables → Actions → New repository secret 로 6개 `VITE_FIREBASE_*` 값 등록
3. Actions 탭 → "Deploy quest app to GitHub Pages" → Run workflow 로 한 번 수동 실행 (또는 아무 커밋이나 푸시)

이 3단계가 끝나면 `/quest/`가 실제로 로그인 가능한 상태로 다시 배포된다.

## 데이터 모델 (Firestore)

```
users/{uid}                    xp, level, streak, badgeCodes[], partyIds[], clanIds[] ...
quests/{questId}                userId, title, difficulty, status, partyId?, clanId?
parties/{inviteCode}            name, goal, xp   (문서 ID = 초대 코드)
parties/{inviteCode}/members/{uid}
clans/{inviteCode}              parties와 동일 구조
clans/{inviteCode}/members/{uid}
focusSessions/{sessionId}       userId, startedAt, endedAt, durationSeconds, xpEarned, partyId?, clanId?
```

뱃지 카탈로그는 DB가 아니라 `src/lib/badges.ts`에 상수로 번들되어 있다 (정적이라 시드 불필요).

## 빌드/린트

```bash
npm run lint
npm run build   # tsc -b && vite build → dist/
npm run preview # 빌드 결과 로컬 확인
```
