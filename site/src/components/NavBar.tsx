import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userLevelProgress } from "@/lib/leveling";

const NAV_ITEMS = [
  { to: "/dashboard", label: "퀘스트", icon: "📜" },
  { to: "/parties", label: "파티", icon: "🤝" },
  { to: "/clans", label: "클랜", icon: "🏰" },
  { to: "/focus", label: "집중 타이머", icon: "⏱️" },
  { to: "/achievements", label: "업적", icon: "🏆" },
];

export function NavBar() {
  const { effectiveUser, isGuest, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <NavLink to="/dashboard" className="font-bold text-violet-300 shrink-0">
          퀘스트로그
        </NavLink>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
                  isActive ? "bg-violet-500/15 text-violet-300" : "text-slate-400 hover:text-slate-200"
                }`
              }
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          {isGuest && (
            <span className="hidden rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30 sm:inline">
              게스트 모드
            </span>
          )}
          {profile && (
            <span className="hidden sm:flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-violet-300 ring-1 ring-white/10">
              Lv.{userLevelProgress(profile.xp).level}
            </span>
          )}
          {effectiveUser?.photoURL && (
            <img src={effectiveUser.photoURL} alt="" className="h-7 w-7 rounded-full ring-1 ring-white/10" />
          )}
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            {isGuest ? "게스트 종료" : "로그아웃"}
          </button>
        </div>
      </div>
    </header>
  );
}
