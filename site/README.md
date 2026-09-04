# 퀘스트로그 (Quest Log) — 정적 버전

`webapp/`의 Next.js/Prisma 버전과 기능은 동일하지만, GitHub Pages처럼 서버가 없는 정적 호스팅에 그대로
올릴 수 있도록 **Firebase(Google 로그인 + Firestore)** 를 백엔드로 쓰는 순수 프론트엔드(SPA)로 다시 만든
버전이다. 서버/DB를 직접 운영하지 않고도 Google 로그인, 실시간 데이터, 여러 명이 함께 쓰는 파티/클랜 기능이
전부 동작한다.

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
7. Authentication → Settings → **승인된 도메인**에 `<github-username>.github.io` 추가 (배포 후 접속할 도메인)

이 Firebase 값들은 브라우저에 그대로 노출돼도 되는 "공개 설정값"이다 (비밀키가 아님). 실제 접근 제어는
5단계의 Firestore 규칙이 담당한다.

## GitHub Pages 배포

`.github/workflows/deploy-pages.yml`(저장소 루트)이 `site/` 를 빌드해서 GitHub Pages로 올리는 워크플로우다.
`main` 브랜치에 `site/` 변경이 푸시되면 자동 실행되고, Actions 탭에서 수동 실행(`workflow_dispatch`)도 된다.

**활성화하려면 (최초 1회, 저장소 관리자가 직접 해야 함):**

1. 저장소 Settings → Secrets and variables → Actions → New repository secret 로 위 6개 `VITE_FIREBASE_*`
   값을 등록
2. 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정
   - ⚠️ 이 저장소는 이미 루트의 `index.html`(개인 랜딩페이지)이 Pages로 배포돼 있을 수 있다. Source를
     "GitHub Actions"로 바꾸면 배포 방식이 바뀌는 것이지 기존 `index.html`이 삭제되는 건 아니지만, 어떤
     내용이 실제로 서빙될지는 워크플로우가 결정하게 된다. 기존 랜딩페이지를 유지하고 싶다면 별도 논의 필요
3. 이 브랜치를 `main`에 병합 (또는 워크플로우 트리거 브랜치를 원하는 브랜치로 수정)

이 세 가지(시크릿 등록/Pages 소스 전환/main 병합)는 저장소 설정과 배포 상태를 바꾸는 작업이라 Claude가
임의로 실행하지 않았다. 준비되면 알려주면 이어서 진행 가능.

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
