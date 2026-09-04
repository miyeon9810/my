"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Me } from "@/types/game";

const NAV_ITEMS = [
  { href: "/dashboard", label: "퀘스트", icon: "📜" },
  { href: "/parties", label: "파티", icon: "🤝" },
  { href: "/clans", label: "클랜", icon: "🏰" },
  { href: "/focus", label: "집중 타이머", icon: "⏱️" },
  { href: "/achievements", label: "업적", icon: "🏆" },
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data } = useSWR<{ user: Me }>("/api/me", fetcher);
  const me = data?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="font-bold text-violet-300 shrink-0">
          퀘스트로그
        </Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
                  isActive ? "bg-violet-500/15 text-violet-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          {me && (
            <span className="hidden sm:flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-violet-300 ring-1 ring-white/10">
              Lv.{me.progress.level}
            </span>
          )}
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-7 w-7 rounded-full ring-1 ring-white/10" />
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
