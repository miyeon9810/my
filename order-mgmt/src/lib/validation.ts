import { z } from "zod";

const weekday = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);

export const createVendorSchema = z.object({
  name: z.string().min(1, "거래처명을 입력해줘"),
  isAdhoc: z.boolean().default(false),
  orderDays: z.array(weekday).default([]),
  deliveryDays: z.array(weekday).default([]),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  isAdhoc: z.boolean().optional(),
  orderDays: z.array(weekday).optional(),
  deliveryDays: z.array(weekday).optional(),
  sortOrder: z.number().int().optional(),
});

export const createItemSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(1, "품목명을 입력해줘"),
  safetyStock: z.coerce.number().int().min(0).default(0),
  currentStock: z.coerce.number().int().min(0).default(0),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  safetyStock: z.coerce.number().int().min(0).optional(),
  currentStock: z.coerce.number().int().min(0).optional(),
});

export const bulkStockSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      currentStock: z.number().int().min(0),
    }),
  )
  .min(1, "저장할 품목이 없어");

export const orderCheckSchema = z.object({
  vendorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않아"),
  completed: z.boolean(),
});
