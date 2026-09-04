export function FirebaseSetupBanner() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
      🔧 Firebase가 아직 설정되지 않았어서 Google 로그인은 쓸 수 없어. 지금은 <b>게스트 모드</b>로 모든 기능을
      체험할 수 있고, 관리자가 Firebase를 설정하면 Google 로그인도 열려. (
      <a href="https://github.com/miyeon9810/my/blob/main/site/README.md" className="underline" target="_blank" rel="noreferrer">
        설정 방법
      </a>
      )
    </div>
  );
}
