"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/fetcher";

export default function RolePage() {
  const router = useRouter();
  const [pending, setPending] = useState<"employee" | "owner" | null>(null);

  const choose = async (role: "employee" | "owner") => {
    setPending(role);
    await postJson("/api/role", { role });
    router.replace(role === "owner" ? "/owner" : "/employee");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="text-sm font-semibold tracking-wide text-stone-500">오늘의매장</p>
        <h1 className="mt-2 text-2xl font-bold">역할을 선택해줘</h1>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => choose("employee")}
          className="rounded-lg border-2 border-stone-300 bg-white px-6 py-6 text-xl font-bold text-stone-900 transition hover:border-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
        >
          직원 — 재고 입력
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => choose("owner")}
          className="rounded-lg border-2 border-stone-300 bg-white px-6 py-6 text-xl font-bold text-stone-900 transition hover:border-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          사장님 — 발주 확인
        </button>
      </div>
    </main>
  );
}
