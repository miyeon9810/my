"use client";

import useSWR from "swr";
import { fetcher, postJson } from "@/lib/fetcher";
import { ZONE_LABEL_KO, type ItemDto, type VendorDto } from "@/lib/types";
import { isVendorDueToday, todayDateKey } from "@/lib/weekday";

function isLow(item: ItemDto): boolean {
  return item.inputType === "STATUS" ? item.statusValue === "LOW" : item.currentStock <= item.safetyStock;
}

type Group = { vendor: VendorDto; items: (ItemDto & { urgent: boolean })[] };

export function OwnerDashboard() {
  const date = todayDateKey();
  const vendorsQuery = useSWR<{ vendors: VendorDto[] }>("/api/vendors", fetcher);
  const checksQuery = useSWR<{ completed: Record<string, boolean> }>(
    `/api/item-order-checks?date=${date}`,
    fetcher,
  );

  if (vendorsQuery.isLoading) return <p className="p-6 text-stone-500">불러오는 중...</p>;
  if (vendorsQuery.error) return <p className="p-6 text-red-700">거래처 정보를 불러오지 못했어</p>;

  const completed = checksQuery.data?.completed ?? {};
  const vendors = vendorsQuery.data?.vendors ?? [];

  const groups: Group[] = vendors
    .map((vendor) => {
      const dueToday = isVendorDueToday(vendor);
      const lowItems = vendor.items
        .filter(isLow)
        .map((item) => ({ ...item, urgent: !vendor.isAdhoc && !dueToday }));
      return { vendor, items: lowItems };
    })
    .filter((g) => g.items.length > 0);

  const toggleComplete = async (itemId: string, next: boolean) => {
    await postJson("/api/item-order-checks", { itemId, date, completed: next });
    checksQuery.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <p className="mb-4 text-sm font-semibold text-stone-500">기준 이하로 떨어진 품목</p>

      {groups.length === 0 ? (
        <div className="rounded-md border-2 border-stone-200 bg-white p-8 text-center text-stone-500">
          지금은 발주가 필요한 품목이 없어
        </div>
      ) : (
        groups.map(({ vendor, items }) => (
          <section key={vendor.id} className="mb-5 rounded-md border-2 border-stone-300 bg-white">
            <header className="border-b-2 border-stone-200 px-4 py-3">
              <h2 className="text-lg font-bold">{vendor.name}</h2>
            </header>
            <ul className="divide-y divide-stone-100">
              {items.map((item) => {
                const done = completed[item.id] ?? false;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-lg ${done ? "text-stone-400 line-through" : ""}`}>{item.name}</span>
                        {item.zone && (
                          <span className="rounded border border-stone-300 px-1.5 py-0.5 text-xs text-stone-500">
                            {ZONE_LABEL_KO[item.zone]}
                          </span>
                        )}
                        {item.urgent && (
                          <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-bold text-white">긴급</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-red-700">
                        {item.inputType === "STATUS" ? "부족" : `${item.currentStock} / ${item.safetyStock}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleComplete(item.id, !done)}
                      className={`shrink-0 rounded-md border-2 px-3.5 py-2.5 text-sm font-bold transition ${
                        done
                          ? "border-stone-300 bg-stone-100 text-stone-500"
                          : "border-emerald-700 bg-emerald-700 text-white"
                      }`}
                    >
                      {done ? "발주완료 ✓" : "발주완료"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
