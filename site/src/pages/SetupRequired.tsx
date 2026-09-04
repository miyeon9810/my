export function SetupRequired() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md space-y-3">
        <p className="text-3xl">🔧</p>
        <h1 className="text-xl font-semibold text-slate-100">Firebase 설정이 필요해</h1>
        <p className="text-sm text-slate-400">
          이 앱은 Firebase(Google 로그인 + Firestore)로 동작해. 배포 환경에{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-violet-300">VITE_FIREBASE_*</code> 값이
          아직 설정되지 않았어. 저장소 README의 &ldquo;Firebase 설정&rdquo; 항목을 따라 프로젝트를 만들고, 환경
          변수를 채운 다음 다시 배포해줘.
        </p>
      </div>
    </main>
  );
}
