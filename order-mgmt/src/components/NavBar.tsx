"use client";

import { useRouter } from "next/navigation";
import { deleteJson } from "@/lib/fetcher";

export function NavBar({ title }: { title: string }) {
  const router = useRouter();

  const switchRole = async () => {
    await deleteJson("/api/role");
    router.replace("/role");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between border-b-2 border-stone-300 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold tracking-wide text-stone-400">오늘의매장</span>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <button
        type="button"
        onClick={switchRole}
        className="rounded-md border-2 border-stone-300 px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100"
      >
        역할 전환
      </button>
    </header>
  );
}
