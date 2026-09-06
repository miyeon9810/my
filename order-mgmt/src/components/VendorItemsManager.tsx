"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, postJson, patchJson, deleteJson } from "@/lib/fetcher";
import type { InputType, ItemDto, VendorDto, Zone } from "@/lib/types";
import { formatDayCodesKo, WEEKDAY_CODES, WEEKDAY_LABEL_KO, type WeekdayCode } from "@/lib/weekday";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
    <div className="flex items-center gap-1 text-sm">
      <span className="w-12 shrink-0 text-stone-500">{label}</span>
      {WEEKDAY_CODES.map((code) => {
        const active = value.includes(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(active ? value.filter((c) => c !== code) : [...value, code])}
            className={`h-8 w-8 rounded-full text-sm font-bold transition ${
              active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {WEEKDAY_LABEL_KO[code]}
          </button>
        );
      })}
    </div>
  );
}

function ItemEditor({ item, onChanged }: { item: ItemDto; onChanged: () => void }) {
  const isNumeric = item.inputType === "NUMERIC";

  const saveSafetyStock = async (value: string) => {
    await patchJson(`/api/items/${item.id}`, { safetyStock: Math.max(0, Number.parseInt(value, 10) || 0) });
    onChanged();
  };

  const saveHint = async (value: string) => {
    await patchJson(`/api/items/${item.id}`, { statusHint: value });
    onChanged();
  };

  const saveZone = async (value: string) => {
    await patchJson(`/api/items/${item.id}`, { zone: value === "" ? null : (value as Zone) });
    onChanged();
  };

  const removeItem = async () => {
    await deleteJson(`/api/items/${item.id}`);
    onChanged();
  };

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="min-w-[6rem] flex-1 font-medium">{item.name}</span>
      <span className="rounded border border-stone-300 px-2 py-0.5 text-xs font-semibold text-stone-500">
        {isNumeric ? "숫자형" : "상태형"}
      </span>
      <select
        defaultValue={item.zone ?? ""}
        onChange={(e) => saveZone(e.target.value)}
        className="rounded-md border-2 border-stone-300 px-2 py-1.5 text-sm"
      >
        <option value="">구역 없음</option>
        <option value="HALL">홀</option>
        <option value="KITCHEN">주방</option>
      </select>
      {isNumeric ? (
        <label className="flex items-center gap-1.5 text-sm text-stone-500">
          기준값
          <input
            type="number"
            min={0}
            defaultValue={item.safetyStock}
            onBlur={(e) => saveSafetyStock(e.target.value)}
            className="w-16 rounded-md border-2 border-stone-300 px-2 py-1.5 text-right"
          />
        </label>
      ) : (
        <input
          type="text"
          defaultValue={item.statusHint}
          placeholder="안내문구 (예: 마지막 1통 뜯으면)"
          onBlur={(e) => saveHint(e.target.value)}
          className="w-52 flex-1 rounded-md border-2 border-stone-300 px-2 py-1.5 text-sm"
        />
      )}
      <button type="button" onClick={removeItem} className="text-sm font-semibold text-red-700 underline">
        삭제
      </button>
    </li>
  );
}

function NewItemForm({ vendorId, onAdded }: { vendorId: string; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [inputType, setInputType] = useState<InputType>("NUMERIC");
  const [safetyStock, setSafetyStock] = useState("0");
  const [statusHint, setStatusHint] = useState("");
  const [zone, setZone] = useState<"" | Zone>("");

  const add = async () => {
    if (!name.trim()) return;
    await postJson("/api/items", {
      vendorId,
      name: name.trim(),
      inputType,
      zone: zone === "" ? null : zone,
      safetyStock: inputType === "NUMERIC" ? Number.parseInt(safetyStock, 10) || 0 : 0,
      statusHint: inputType === "STATUS" ? statusHint.trim() : "",
    });
    setName("");
    setSafetyStock("0");
    setStatusHint("");
    setZone("");
    onAdded();
  };

  return (
    <div className="mt-3 space-y-2 rounded-md border-2 border-dashed border-stone-300 p-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="새 품목명"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border-2 border-stone-300 px-3 py-2 text-sm"
        />
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value as "" | Zone)}
          className="rounded-md border-2 border-stone-300 px-2 py-2 text-sm"
        >
          <option value="">구역 없음</option>
          <option value="HALL">홀</option>
          <option value="KITCHEN">주방</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border-2 border-stone-300">
          <button
            type="button"
            onClick={() => setInputType("NUMERIC")}
            className={`px-3 py-2 text-sm font-bold ${inputType === "NUMERIC" ? "bg-stone-900 text-white" : "bg-white text-stone-500"}`}
          >
            숫자형
          </button>
          <button
            type="button"
            onClick={() => setInputType("STATUS")}
            className={`px-3 py-2 text-sm font-bold ${inputType === "STATUS" ? "bg-stone-900 text-white" : "bg-white text-stone-500"}`}
          >
            상태형
          </button>
        </div>
        {inputType === "NUMERIC" ? (
          <label className="flex items-center gap-1.5 text-sm text-stone-500">
            기준값
            <input
              type="number"
              min={0}
              value={safetyStock}
              onChange={(e) => setSafetyStock(e.target.value)}
              className="w-16 rounded-md border-2 border-stone-300 px-2 py-1.5 text-right"
            />
          </label>
        ) : (
          <input
            type="text"
            placeholder="안내문구 (예: 마지막 1통 뜯으면)"
            value={statusHint}
            onChange={(e) => setStatusHint(e.target.value)}
            className="min-w-[12rem] flex-1 rounded-md border-2 border-stone-300 px-2 py-1.5 text-sm"
          />
        )}
        <button type="button" onClick={add} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-bold text-white">
          품목 추가
        </button>
      </div>
    </div>
  );
}

function VendorCard({ vendor, onChanged }: { vendor: VendorDto; onChanged: () => void }) {
  const [editingDetails, setEditingDetails] = useState(false);
  const [orderDays, setOrderDays] = useState<WeekdayCode[]>(
    vendor.orderDays.split(",").filter(Boolean) as WeekdayCode[],
  );
  const [deliveryDays, setDeliveryDays] = useState<WeekdayCode[]>(
    vendor.deliveryDays.split(",").filter(Boolean) as WeekdayCode[],
  );
  const [note, setNote] = useState(vendor.note);
  const [cardImage, setCardImage] = useState<string | null>(vendor.cardImage);
  const [imageError, setImageError] = useState<string | null>(null);

  const toggleAdhoc = async () => {
    await patchJson(`/api/vendors/${vendor.id}`, { isAdhoc: !vendor.isAdhoc });
    onChanged();
  };

  const saveDetails = async () => {
    await patchJson(`/api/vendors/${vendor.id}`, { orderDays, deliveryDays, note, cardImage });
    setEditingDetails(false);
    onChanged();
  };

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("이미지 용량이 너무 커 (3MB 이하로 올려줘)");
      return;
    }
    setCardImage(await fileToDataUrl(file));
  };

  return (
    <div className="rounded-md border-2 border-stone-300 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{vendor.name}</h2>
        <label className="flex items-center gap-2 text-sm text-stone-500">
          <input type="checkbox" checked={vendor.isAdhoc} onChange={toggleAdhoc} className="h-4 w-4" />
          수시 발주
        </label>
      </div>

      {editingDetails ? (
        <div className="mb-3 space-y-3 rounded-md bg-stone-50 p-3">
          {!vendor.isAdhoc && (
            <>
              <DayPicker label="발주" value={orderDays} onChange={setOrderDays} />
              <DayPicker label="도착" value={deliveryDays} onChange={setDeliveryDays} />
            </>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-stone-500">주문 특이사항</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="예: 전화로만 주문 가능, 최소 주문 수량 있음"
              className="w-full rounded-md border-2 border-stone-300 p-2"
            />
          </label>
          <div className="flex items-center gap-3">
            {cardImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cardImage} alt={`${vendor.name} 명함`} className="h-16 w-24 rounded border border-stone-300 object-cover" />
            )}
            <label className="cursor-pointer rounded-md border-2 border-stone-300 px-3 py-2 text-sm font-semibold">
              디지털 명함 업로드
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
            </label>
            {cardImage && (
              <button type="button" onClick={() => setCardImage(null)} className="text-sm text-red-700 underline">
                제거
              </button>
            )}
          </div>
          {imageError && <p className="text-sm text-red-700">{imageError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={saveDetails} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-bold text-white">
              저장
            </button>
            <button type="button" onClick={() => setEditingDetails(false)} className="text-sm text-stone-500">
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-md bg-stone-50 p-3">
          <div className="space-y-1 text-sm text-stone-600">
            {!vendor.isAdhoc && (
              <p>
                발주 {formatDayCodesKo(vendor.orderDays)} · 도착 {formatDayCodesKo(vendor.deliveryDays)}
              </p>
            )}
            {vendor.note && <p className="text-stone-500">{vendor.note}</p>}
            {vendor.cardImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.cardImage} alt={`${vendor.name} 명함`} className="mt-1 h-14 w-20 rounded border border-stone-300 object-cover" />
            )}
          </div>
          <button type="button" onClick={() => setEditingDetails(true)} className="shrink-0 text-sm font-semibold text-stone-600 underline">
            정보 수정
          </button>
        </div>
      )}

      <ul className="divide-y divide-stone-100">
        {vendor.items.map((item) => (
          <ItemEditor key={item.id} item={item} onChanged={onChanged} />
        ))}
      </ul>

      <NewItemForm vendorId={vendor.id} onAdded={onChanged} />
    </div>
  );
}

function NewVendorForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [isAdhoc, setIsAdhoc] = useState(false);
  const [orderDays, setOrderDays] = useState<WeekdayCode[]>([]);
  const [deliveryDays, setDeliveryDays] = useState<WeekdayCode[]>([]);
  const [note, setNote] = useState("");
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("이미지 용량이 너무 커 (3MB 이하로 올려줘)");
      return;
    }
    setCardImage(await fileToDataUrl(file));
  };

  const add = async () => {
    if (!name.trim()) return;
    await postJson("/api/vendors", { name: name.trim(), isAdhoc, orderDays, deliveryDays, note: note.trim(), cardImage });
    setName("");
    setIsAdhoc(false);
    setOrderDays([]);
    setDeliveryDays([]);
    setNote("");
    setCardImage(null);
    onAdded();
  };

  return (
    <div className="space-y-3 rounded-md border-2 border-dashed border-stone-400 p-4">
      <h2 className="text-lg font-bold">새 거래처 등록</h2>
      <input
        type="text"
        placeholder="거래처명"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border-2 border-stone-300 px-3 py-2"
      />
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" checked={isAdhoc} onChange={(e) => setIsAdhoc(e.target.checked)} className="h-4 w-4" />
        수시 발주 (정해진 요일 없음)
      </label>
      {!isAdhoc && (
        <div className="space-y-1">
          <DayPicker label="발주" value={orderDays} onChange={setOrderDays} />
          <DayPicker label="도착" value={deliveryDays} onChange={setDeliveryDays} />
        </div>
      )}
      <label className="block text-sm">
        <span className="mb-1 block text-stone-500">주문 특이사항</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="예: 전화로만 주문 가능, 최소 주문 수량 있음"
          className="w-full rounded-md border-2 border-stone-300 p-2"
        />
      </label>
      <div className="flex items-center gap-3">
        {cardImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cardImage} alt="명함 미리보기" className="h-16 w-24 rounded border border-stone-300 object-cover" />
        )}
        <label className="cursor-pointer rounded-md border-2 border-stone-300 px-3 py-2 text-sm font-semibold">
          디지털 명함 업로드
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0])} />
        </label>
      </div>
      {imageError && <p className="text-sm text-red-700">{imageError}</p>}
      <button type="button" onClick={add} className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-bold text-white">
        거래처 등록
      </button>
    </div>
  );
}

export function VendorItemsManager() {
  const { data, error, isLoading, mutate } = useSWR<{ vendors: VendorDto[] }>("/api/vendors", fetcher);

  if (isLoading) return <p className="p-6 text-stone-500">불러오는 중...</p>;
  if (error) return <p className="p-6 text-red-700">거래처 정보를 불러오지 못했어</p>;

  const vendors = data?.vendors ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} onChanged={() => mutate()} />
      ))}
      <NewVendorForm onAdded={() => mutate()} />
    </div>
  );
}
