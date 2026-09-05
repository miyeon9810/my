"use client";

import { useState } from "react";
import useSWR, { type KeyedMutator } from "swr";
import { fetcher, postJson } from "@/lib/fetcher";
import type { VendorDto } from "@/lib/types";

function VendorStockForm({
  vendor,
  onSaved,
}: {
  vendor: VendorDto;
  onSaved: KeyedMutator<{ vendors: VendorDto[] }>;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(vendor.items.map((item) => [item.id, String(item.currentStock)])),
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const save = async () => {
    setSaving(true);
    try {
      const rows = vendor.items.map((item) => ({
        id: item.id,
        currentStock: Math.max(0, Number.parseInt(draft[item.id] ?? "0", 10) || 0),
      }));
      await postJson("/api/items/bulk-stock", rows);
      await onSaved();
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-bold">{vendor.name} — 현재 재고 입력</h2>
      {vendor.items.length === 0 ? (
        <p className="text-sm text-slate-500">등록된 품목이 없어</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {vendor.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-400">안전재고 {item.safetyStock}</p>
              </div>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft[item.id] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-right text-lg"
              />
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={saving || vendor.items.length === 0}
        onClick={save}
        className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
      {savedAt && (
        <p className="mt-2 text-center text-xs text-slate-400">
          {savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}에 저장됨
        </p>
      )}
    </div>
  );
}

export function EmployeeBoard() {
  const { data, error, isLoading, mutate } = useSWR<{ vendors: VendorDto[] }>("/api/vendors", fetcher);
  const vendors = data?.vendors ?? [];

  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const activeVendor = vendors.find((v) => v.id === activeVendorId) ?? vendors[0] ?? null;

  if (isLoading) return <p className="p-6 text-slate-500">불러오는 중...</p>;
  if (error) return <p className="p-6 text-red-600">거래처 정보를 불러오지 못했어</p>;
  if (vendors.length === 0) return <p className="p-6 text-slate-500">등록된 거래처가 없어</p>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            type="button"
            onClick={() => setActiveVendorId(vendor.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              vendor.id === activeVendor?.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:border-slate-400"
            }`}
          >
            {vendor.name}
          </button>
        ))}
      </div>

      {activeVendor && <VendorStockForm key={activeVendor.id} vendor={activeVendor} onSaved={mutate} />}
    </div>
  );
}
