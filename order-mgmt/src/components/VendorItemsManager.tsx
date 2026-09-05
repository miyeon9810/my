"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, postJson, patchJson, deleteJson } from "@/lib/fetcher";
import type { VendorDto } from "@/lib/types";
import { formatDayCodesKo, WEEKDAY_CODES, WEEKDAY_LABEL_KO, type WeekdayCode } from "@/lib/weekday";

function DayPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: WeekdayCode[];
  onChange: (next: WeekdayCode[]) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="w-10 shrink-0 text-slate-400">{label}</span>
      {WEEKDAY_CODES.map((code) => {
        const active = value.includes(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(active ? value.filter((c) => c !== code) : [...value, code])}
            className={`h-6 w-6 rounded-full text-[11px] font-semibold transition ${
              active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {WEEKDAY_LABEL_KO[code]}
          </button>
        );
      })}
    </div>
  );
}

function VendorCard({ vendor, onChanged }: { vendor: VendorDto; onChanged: () => void }) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemSafety, setNewItemSafety] = useState("0");
  const [editingDays, setEditingDays] = useState(false);
  const [orderDays, setOrderDays] = useState<WeekdayCode[]>(
    vendor.orderDays.split(",").filter(Boolean) as WeekdayCode[],
  );
  const [deliveryDays, setDeliveryDays] = useState<WeekdayCode[]>(
    vendor.deliveryDays.split(",").filter(Boolean) as WeekdayCode[],
  );

  const addItem = async () => {
    if (!newItemName.trim()) return;
    await postJson("/api/items", {
      vendorId: vendor.id,
      name: newItemName.trim(),
      safetyStock: Number.parseInt(newItemSafety, 10) || 0,
      currentStock: 0,
    });
    setNewItemName("");
    setNewItemSafety("0");
    onChanged();
  };

  const saveSafetyStock = async (itemId: string, value: string) => {
    await patchJson(`/api/items/${itemId}`, { safetyStock: Math.max(0, Number.parseInt(value, 10) || 0) });
    onChanged();
  };

  const removeItem = async (itemId: string) => {
    await deleteJson(`/api/items/${itemId}`);
    onChanged();
  };

  const saveDays = async () => {
    await patchJson(`/api/vendors/${vendor.id}`, { orderDays, deliveryDays });
    setEditingDays(false);
    onChanged();
  };

  const toggleAdhoc = async () => {
    await patchJson(`/api/vendors/${vendor.id}`, { isAdhoc: !vendor.isAdhoc });
    onChanged();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">{vendor.name}</h2>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={vendor.isAdhoc} onChange={toggleAdhoc} />
          수시 발주
        </label>
      </div>

      {!vendor.isAdhoc && (
        <div className="mb-3 space-y-1 rounded-xl bg-slate-50 p-3">
          {editingDays ? (
            <>
              <DayPicker label="발주" value={orderDays} onChange={setOrderDays} />
              <DayPicker label="입고" value={deliveryDays} onChange={setDeliveryDays} />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={saveDays} className="text-xs font-semibold text-blue-600">
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDays(false)}
                  className="text-xs text-slate-400"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                발주 {formatDayCodesKo(vendor.orderDays)} · 입고 {formatDayCodesKo(vendor.deliveryDays)}
              </span>
              <button type="button" onClick={() => setEditingDays(true)} className="font-semibold text-blue-600">
                요일 수정
              </button>
            </div>
          )}
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {vendor.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2">
            <span className="flex-1">{item.name}</span>
            <span className="text-xs text-slate-400">안전재고</span>
            <input
              type="number"
              min={0}
              defaultValue={item.safetyStock}
              onBlur={(e) => saveSafetyStock(item.id, e.target.value)}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-xs text-red-500 hover:underline"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="새 품목명"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="안전재고"
          value={newItemSafety}
          onChange={(e) => setNewItemSafety(e.target.value)}
          className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
        >
          추가
        </button>
      </div>
    </div>
  );
}

export function VendorItemsManager() {
  const { data, error, isLoading, mutate } = useSWR<{ vendors: VendorDto[] }>("/api/vendors", fetcher);
  const [newVendorName, setNewVendorName] = useState("");

  if (isLoading) return <p className="p-6 text-slate-500">불러오는 중...</p>;
  if (error) return <p className="p-6 text-red-600">거래처 정보를 불러오지 못했어</p>;

  const vendors = data?.vendors ?? [];

  const addVendor = async () => {
    if (!newVendorName.trim()) return;
    await postJson("/api/vendors", { name: newVendorName.trim(), isAdhoc: false, orderDays: [], deliveryDays: [] });
    setNewVendorName("");
    mutate();
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} onChanged={() => mutate()} />
      ))}

      <div className="flex gap-2 rounded-2xl border border-dashed border-slate-300 p-4">
        <input
          type="text"
          placeholder="새 거래처명"
          value={newVendorName}
          onChange={(e) => setNewVendorName(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addVendor}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          거래처 추가
        </button>
      </div>
    </div>
  );
}
