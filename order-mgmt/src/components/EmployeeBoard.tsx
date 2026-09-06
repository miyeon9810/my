"use client";

import { useState } from "react";
import useSWR, { type KeyedMutator } from "swr";
import { fetcher, patchJson } from "@/lib/fetcher";
import { ZONE_LABEL_KO, type ItemDto, type StatusValue, type VendorDto } from "@/lib/types";
import { isVendorDueToday } from "@/lib/weekday";

function ZoneTag({ zone }: { zone: ItemDto["zone"] }) {
  if (!zone) return null;
  return <span className="rounded border border-stone-300 px-1.5 py-0.5 text-xs text-stone-500">{ZONE_LABEL_KO[zone]}</span>;
}

function NumericRow({ item }: { item: ItemDto }) {
  const [saved, setSaved] = useState(false);

  const save = async (raw: string) => {
    const value = Math.max(0, Number.parseInt(raw, 10) || 0);
    if (value === item.currentStock) return;
    await patchJson(`/api/items/${item.id}`, { currentStock: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <li className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex items-center gap-2">
        <span className="text-lg">{item.name}</span>
        <ZoneTag zone={item.zone} />
      </div>
      <div className="flex items-center gap-2">
        {saved && <span className="text-sm font-semibold text-emerald-700">저장됨</span>}
        <input
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={item.currentStock}
          onBlur={(e) => save(e.target.value)}
          className="w-20 rounded-md border-2 border-stone-300 px-3 py-2 text-right text-lg font-semibold"
        />
      </div>
    </li>
  );
}

function StatusRow({ item, onChanged }: { item: ItemDto; onChanged: () => Promise<unknown> }) {
  const [pending, setPending] = useState(false);

  const setStatus = async (value: StatusValue) => {
    if (value === item.statusValue || pending) return;
    setPending(true);
    await patchJson(`/api/items/${item.id}`, { statusValue: value });
    await onChanged();
    setPending(false);
  };

  return (
    <li className="flex items-center justify-between gap-3 py-3.5">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{item.name}</span>
          <ZoneTag zone={item.zone} />
        </div>
        {item.statusHint && <p className="mt-0.5 text-sm text-stone-500">{item.statusHint}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("OK")}
          className={`rounded-md border-2 px-3.5 py-2 text-sm font-bold transition disabled:opacity-60 ${
            item.statusValue === "OK"
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-stone-300 bg-white text-stone-500"
          }`}
        >
          남음
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setStatus("LOW")}
          className={`rounded-md border-2 px-3.5 py-2 text-sm font-bold transition disabled:opacity-60 ${
            item.statusValue === "LOW"
              ? "border-red-700 bg-red-700 text-white"
              : "border-stone-300 bg-white text-stone-500"
          }`}
        >
          부족
        </button>
      </div>
    </li>
  );
}

function VendorSection({ vendor, onChanged }: { vendor: VendorDto; onChanged: KeyedMutator<{ vendors: VendorDto[] }> }) {
  const dueToday = isVendorDueToday(vendor);

  return (
    <section className="border-b border-stone-200 py-4">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-xl font-bold">{vendor.name}</h2>
        {dueToday && (
          <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-bold text-white">오늘 발주일</span>
        )}
      </div>
      {vendor.items.length === 0 ? (
        <p className="py-2 text-sm text-stone-400">등록된 품목이 없어</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {vendor.items.map((item) =>
            item.inputType === "STATUS" ? (
              <StatusRow key={item.id} item={item} onChanged={() => onChanged()} />
            ) : (
              <NumericRow key={item.id} item={item} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

export function EmployeeBoard() {
  const { data, error, isLoading, mutate } = useSWR<{ vendors: VendorDto[] }>("/api/vendors", fetcher);
  const vendors = data?.vendors ?? [];

  if (isLoading) return <p className="p-6 text-stone-500">불러오는 중...</p>;
  if (error) return <p className="p-6 text-red-700">거래처 정보를 불러오지 못했어</p>;
  if (vendors.length === 0) return <p className="p-6 text-stone-500">등록된 거래처가 없어</p>;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      {vendors.map((vendor) => (
        <VendorSection key={vendor.id} vendor={vendor} onChanged={mutate} />
      ))}
    </div>
  );
}
