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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <h1 className="text-lg font-bold">{title}</h1>
      <button
        type="button"
        onClick={switchRole}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
      >
        역할 전환
      </button>
    </header>
  );
}
