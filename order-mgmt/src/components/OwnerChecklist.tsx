"use client";

import useSWR from "swr";
import { fetcher, postJson } from "@/lib/fetcher";
import type { VendorDto } from "@/lib/types";
import { formatDayCodesKo, parseDayCodes, todayDateKey, todayWeekdayCode, WEEKDAY_LABEL_KO } from "@/lib/weekday";

export function OwnerChecklist() {
  const date = todayDateKey();
  const weekday = todayWeekdayCode();

  const vendorsQuery = useSWR<{ vendors: VendorDto[] }>("/api/vendors", fetcher);
  const checksQuery = useSWR<{ completed: Record<string, boolean> }>(
    `/api/order-checks?date=${date}`,
    fetcher,
  );

  const vendors = vendorsQuery.data?.vendors ?? [];
  const completed = checksQuery.data?.completed ?? {};

  if (vendorsQuery.isLoading) return <p className="p-6 text-slate-500">불러오는 중...</p>;
  if (vendorsQuery.error) return <p className="p-6 text-red-600">거래처 정보를 불러오지 못했어</p>;

  const dueVendors = vendors
    .map((vendor) => {
      const lowItems = vendor.items.filter((item) => item.currentStock <= item.safetyStock);
      if (vendor.isAdhoc) {
        return lowItems.length > 0 ? { vendor, items: lowItems, scheduled: false } : null;
      }
      const isOrderDay = parseDayCodes(vendor.orderDays).includes(weekday);
      return isOrderDay ? { vendor, items: vendor.items, scheduled: true } : null;
    })
    .filter((v): v is { vendor: VendorDto; items: VendorDto["items"]; scheduled: boolean } => v !== null);

  const toggleComplete = async (vendorId: string, next: boolean) => {
    await postJson("/api/order-checks", { vendorId, date, completed: next });
    checksQuery.mutate();
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <p className="text-sm text-slate-500">
        오늘 ({WEEKDAY_LABEL_KO[weekday]}요일) 발주 체크리스트
      </p>

      {dueVendors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          오늘은 확인할 거래처가 없어
        </div>
      ) : (
        dueVendors.map(({ vendor, items, scheduled }) => {
          const isDone = completed[vendor.id] ?? false;
          return (
            <div
              key={vendor.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${
                isDone ? "border-slate-200 opacity-60" : "border-slate-200"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">{vendor.name}</h2>
                  <p className="text-xs text-slate-400">
                    {scheduled ? `발주 ${formatDayCodesKo(vendor.orderDays)}` : "수시 발주"}
                    {vendor.deliveryDays ? ` · 입고 ${formatDayCodesKo(vendor.deliveryDays)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleComplete(vendor.id, !isDone)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isDone
                      ? "bg-slate-200 text-slate-600"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {isDone ? "발주 완료됨" : "발주 완료"}
                </button>
              </div>
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isLow = item.currentStock <= item.safetyStock;
                  return (
                    <li key={item.id} className="flex items-center justify-between py-2">
                      <span className={isLow ? "font-semibold text-red-600" : ""}>{item.name}</span>
                      <span className={isLow ? "font-semibold text-red-600" : "text-slate-500"}>
                        {item.currentStock} / {item.safetyStock}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}
