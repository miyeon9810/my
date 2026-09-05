import { prisma } from "../src/lib/prisma";

// 오산점 기준 거래처 발주/입고 요일.
const VENDORS = [
  { name: "본사", isAdhoc: false, orderDays: "TUE,THU", deliveryDays: "WED,FRI" },
  { name: "천운", isAdhoc: false, orderDays: "MON,WED", deliveryDays: "TUE,THU" },
  { name: "철은", isAdhoc: false, orderDays: "MON,WED", deliveryDays: "TUE,THU" },
  { name: "쿠팡", isAdhoc: true, orderDays: "", deliveryDays: "" },
  { name: "성공", isAdhoc: true, orderDays: "", deliveryDays: "" },
] as const;

// 예시 품목 — 실제 재고 기준은 사장님 화면(발주 품목 관리)에서 채워 넣으면 돼.
const SAMPLE_ITEMS: Record<string, { name: string; safetyStock: number }[]> = {
  본사: [
    { name: "강력분", safetyStock: 5 },
    { name: "박력분", safetyStock: 5 },
    { name: "설탕", safetyStock: 3 },
  ],
  천운: [
    { name: "버터", safetyStock: 4 },
    { name: "생크림", safetyStock: 3 },
  ],
  철은: [
    { name: "우유", safetyStock: 6 },
    { name: "계란", safetyStock: 4 },
  ],
  쿠팡: [
    { name: "포장 박스", safetyStock: 10 },
    { name: "포장지", safetyStock: 10 },
  ],
  성공: [{ name: "위생장갑", safetyStock: 5 }],
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
        sortOrder: index,
      },
      update: {
        isAdhoc: vendor.isAdhoc,
        orderDays: vendor.orderDays,
        deliveryDays: vendor.deliveryDays,
        sortOrder: index,
      },
    });

    const items = SAMPLE_ITEMS[vendor.name] ?? [];
    for (const [itemIndex, item] of items.entries()) {
      const id = `seed-${vendor.name}-${itemIndex}`;
      await prisma.item.upsert({
        where: { id },
        create: {
          id,
          vendorId: created.id,
          name: item.name,
          safetyStock: item.safetyStock,
          currentStock: item.safetyStock,
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
