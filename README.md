# my

- `index.html`, `mee.png`, `on.ttf` — 개인 랜딩페이지. **https://miyeon9810.github.io/my/** 에 배포됨
- `webapp/` — 퀘스트로그: 게임화 투두 앱, Next.js + Prisma 풀스택 버전 (자체 서버/DB 필요)
- `site/` — 퀘스트로그 정적 버전, Vite + Firebase (Auth + Firestore). **https://miyeon9810.github.io/my/quest/**
  에 배포됨. Firebase 설정 없이도 "게스트로 체험하기"로 지금 바로 완전히 쓸 수 있고, Google 로그인·파티·클랜은
  Firebase 설정 후 열린다 (`site/README.md` 참고)
- `.github/workflows/deploy-pages.yml` — 위 두 사이트를 함께 빌드해서 GitHub Pages 하나로 배포하는 워크플로우.
  랜딩페이지는 루트에, 퀘스트 앱은 `/quest/` 서브경로에 배치한다.

각 디렉토리의 README에 설정/실행 방법이 있다.
