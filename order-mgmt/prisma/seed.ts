import { prisma } from "../src/lib/prisma";

// 오산점 기준 거래처 발주/입고 요일 + 주문 특이사항 예시.
const VENDORS = [
  { name: "본사", isAdhoc: false, orderDays: "TUE,THU", deliveryDays: "WED,FRI", note: "" },
  { name: "천운", isAdhoc: false, orderDays: "MON,WED", deliveryDays: "TUE,THU", note: "전화로만 주문 가능" },
  { name: "철은", isAdhoc: false, orderDays: "MON,WED", deliveryDays: "TUE,THU", note: "" },
  { name: "쿠팡", isAdhoc: true, orderDays: "", deliveryDays: "", note: "" },
  { name: "성공", isAdhoc: true, orderDays: "", deliveryDays: "", note: "최소 주문 수량 있음" },
] as const;

type SeedItem =
  | { name: string; inputType: "NUMERIC"; safetyStock: number; zone?: "HALL" | "KITCHEN" }
  | { name: string; inputType: "STATUS"; statusHint: string; zone?: "HALL" | "KITCHEN" };

// 예시 품목 — 실제 품목/기준값은 사장님 화면(품목·거래처 관리)에서 채워 넣으면 돼.
const SAMPLE_ITEMS: Record<string, SeedItem[]> = {
  본사: [
    { name: "요거트파우더", inputType: "NUMERIC", safetyStock: 3, zone: "KITCHEN" },
    { name: "카페시럽", inputType: "NUMERIC", safetyStock: 5, zone: "HALL" },
  ],
  천운: [
    { name: "냉동딸기", inputType: "NUMERIC", safetyStock: 4, zone: "KITCHEN" },
    { name: "레몬시럽", inputType: "NUMERIC", safetyStock: 3, zone: "HALL" },
  ],
  철은: [
    { name: "초코소스", inputType: "STATUS", statusHint: "마지막 1통 뜯으면", zone: "HALL" },
    { name: "건대추", inputType: "STATUS", statusHint: "봉지 뜯으면", zone: "KITCHEN" },
  ],
  쿠팡: [
    { name: "포장 박스", inputType: "NUMERIC", safetyStock: 10 },
    { name: "포장지", inputType: "NUMERIC", safetyStock: 10 },
  ],
  성공: [{ name: "위생장갑", inputType: "NUMERIC", safetyStock: 5, zone: "HALL" }],
};

async function main() {
  for (const [index, vendor] of VENDORS.entries()) {
    const created = await prisma.vendor.upsert({
      where: { id: `seed-${vendor.name}` },
      create: {
        id: `seed-${vendor.name}`,
        name: vendor.name,
        isAdhoc: vendor.isAdhoc,
        orderDays: vendor.orderDays,
        deliveryDays: vendor.deliveryDays,
        note: vendor.note,
        sortOrder: index,
      },
      update: {
        isAdhoc: vendor.isAdhoc,
        orderDays: vendor.orderDays,
        deliveryDays: vendor.deliveryDays,
        note: vendor.note,
        sortOrder: index,
      },
    });

    const items = SAMPLE_ITEMS[vendor.name] ?? [];
    for (const [itemIndex, item] of items.entries()) {
      const id = `seed-${vendor.name}-${itemIndex}`;
      const safetyStock = item.inputType === "NUMERIC" ? item.safetyStock : 0;
      // Seed at the safety threshold so the owner dashboard has something to show out of the box.
      const currentStock = item.inputType === "NUMERIC" ? item.safetyStock : 0;
      const statusValue = item.inputType === "STATUS" ? "LOW" : "OK";

      await prisma.item.upsert({
        where: { id },
        create: {
          id,
          vendorId: created.id,
          name: item.name,
          zone: item.zone ?? null,
          inputType: item.inputType,
          safetyStock,
          currentStock,
          statusHint: item.inputType === "STATUS" ? item.statusHint : "",
          statusValue,
          sortOrder: itemIndex,
        },
        update: {},
      });
    }
  }

  console.log(`Seeded ${VENDORS.length} vendors.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
