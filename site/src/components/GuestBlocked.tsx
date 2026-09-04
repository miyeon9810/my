import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function GuestBlocked({ feature }: { feature: string }) {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center">
      <p className="text-3xl">🔒</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-100">{feature} 로그인 후 이용 가능해</h2>
      <p className="mt-2 text-sm text-slate-500">
        게스트 모드는 이 기기에만 저장돼서 다른 사람과 같이 쓸 수 없어. Google로 로그인하면 지금까지의 게스트
        기록은 그대로 두고 같은 계정으로 어디서든 접속할 수 있어.
      </p>
      <button
        type="button"
        onClick={async () => {
          await signInWithGoogle();
          navigate(0);
        }}
        className="mt-4 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
      >
        Google로 로그인
      </button>
    </div>
  );
}
