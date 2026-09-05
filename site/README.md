# 퀘스트로그 (Quest Log) — 정적 버전

`webapp/`의 Next.js/Prisma 버전과 기능은 동일하지만, GitHub Pages처럼 서버가 없는 정적 호스팅에 그대로
올릴 수 있도록 **Firebase(Google 로그인 + Firestore)** 를 백엔드로 쓰는 순수 프론트엔드(SPA)로 다시 만든
버전이다. 서버/DB를 직접 운영하지 않고도 Google 로그인, 실시간 데이터, 여러 명이 함께 쓰는 파티/클랜 기능이
전부 동작한다.

**배포 주소: https://miyeon9810.github.io/my/quest/ — 지금 바로 완전히 사용 가능하다.**
Firebase를 아직 설정하지 않았어도 랜딩 페이지의 **"게스트로 체험하기"** 로 들어가면 퀘스트·XP·레벨업·뱃지·
집중 타이머를 전부 이 브라우저에 저장해서 쓸 수 있다 (아래 "게스트 모드" 참고). Google 로그인은 Firebase
설정 후에 열리고, 파티·클랜처럼 여러 사람이 같이 쓰는 기능은 로그인이 필요하다.

## 기능

`webapp/README.md`와 동일 — 퀘스트/XP/레벨업, 뱃지 18종, 파티·클랜(초대 코드), 집중 타이머(개인/그룹 XP 반영),
Google 로그인.

## 게스트 모드 (Firebase 없이 바로 사용)

랜딩 페이지의 "게스트로 체험하기" 버튼은 Firebase 프로젝트가 없어도 퀘스트/XP/레벨업/뱃지/집중 타이머를
전부 이 브라우저의 `localStorage`에 저장해서 동작시킨다 (`src/lib/guest-store.ts`). 다른 기기·다른 사람과
공유해야 하는 파티/클랜만 실제 계정(Google 로그인)이 필요하고, 게스트가 그 화면에 들어가면 로그인을
안내한다. 게스트 데이터는 이 기기에만 남고, 나중에 Google 로그인으로 넘어가도 자동 이전되지는 않는다.

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

Firebase 값이 비어 있어도 앱은 죽지 않는다 — Google 로그인 버튼만 숨겨지고 게스트 모드로 그대로 쓸 수 있다.

## Firebase 설정 (Google 로그인 + 파티/클랜을 열려면)

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
5단계의 Firestore 규칙이 담당한다. 이건 구글 계정으로 콘솔에 직접 로그인해야 하는 작업이라, 저장소
관리자가 직접 해야 한다 (자동화로 대신할 수 없는 유일한 단계).

## GitHub Pages 배포 — 라이브 상태

`.github/workflows/deploy-pages.yml`(저장소 루트)이 루트의 개인 랜딩페이지(`index.html`/`mee.png`/`on.ttf`)와
`site/`를 함께 빌드해서 GitHub Pages로 올린다. `main`에 관련 파일이 푸시되면 자동 실행되고, Actions 탭에서
수동 실행(`workflow_dispatch`)도 된다.

- 루트(`https://miyeon9810.github.io/my/`) = 기존 랜딩페이지, 그대로 유지
- `https://miyeon9810.github.io/my/quest/` = 이 앱 (게스트 모드로 지금 바로 사용 가능)

Google 로그인·파티·클랜까지 열려면 위 "Firebase 설정" 6단계를 마치고 저장소 Settings → Secrets and
variables → Actions에 `VITE_FIREBASE_*` 6개 값을 등록한 뒤, 아무 커밋을 푸시하거나 Actions 탭에서 워크
플로우를 수동 실행하면 된다.

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
