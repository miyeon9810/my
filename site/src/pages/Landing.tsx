import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { SignInButton } from "@/components/SignInButton";
import { FirebaseSetupBanner } from "@/components/FirebaseSetupBanner";

export function Landing() {
  const { user, isGuest, loading, enterGuestMode } = useAuth();
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);

  if (loading) return null;
  if (user || isGuest) return <Navigate to="/dashboard" replace />;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-lg space-y-6">
        <p className="text-sm font-medium tracking-wide text-violet-400">QUEST LOG</p>
        <h1 className="text-4xl font-bold text-slate-100 sm:text-5xl">
          할일을 <span className="text-violet-400">퀘스트</span>로,
          <br />
          목표를 <span className="text-fuchsia-400">파티</span>와 <span className="text-rose-400">클랜</span>으로
        </h1>
        <p className="text-slate-400">
          투두를 완료할 때마다 경험치를 얻고 레벨업해. 같은 목표를 향한 사람들과 파티를 맺고, 인생의 큰 목표는
          클랜으로 함께 부딪혀봐. 뱃지를 모으고, 연속 기록을 쌓고, 집중 타이머로 함께 몰입해보자.
        </p>

        {!isFirebaseConfigured && <FirebaseSetupBanner />}

        <div className="flex flex-col items-center gap-3">
          {isFirebaseConfigured && <SignInButton />}
          <button
            type="button"
            disabled={entering}
            onClick={() => {
              setEntering(true);
              enterGuestMode();
              navigate("/dashboard");
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-violet-500/40 hover:text-white disabled:opacity-50"
          >
            👤 게스트로 체험하기
          </button>
          {isFirebaseConfigured && (
            <p className="text-xs text-slate-500">
              게스트 모드는 이 기기에만 저장돼. 파티·클랜은 Google 로그인이 필요해.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-6 text-left sm:grid-cols-4">
          {[
            { icon: "📜", label: "퀘스트 & 레벨업" },
            { icon: "🏆", label: "뱃지 & 업적" },
            { icon: "🤝", label: "파티 (사이드 목표)" },
            { icon: "🏰", label: "클랜 (인생 목표)" },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <div className="text-xl">{f.icon}</div>
              <p className="mt-1 text-xs text-slate-400">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
