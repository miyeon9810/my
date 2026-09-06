import { z } from "zod";

const weekday = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
const zone = z.enum(["HALL", "KITCHEN"]);
const inputType = z.enum(["NUMERIC", "STATUS"]);
const statusValue = z.enum(["OK", "LOW"]);

// data: URL images, base64 — capped well under the request body limit.
const cardImage = z.string().max(4_000_000).nullable();

export const createVendorSchema = z.object({
  name: z.string().min(1, "거래처명을 입력해줘"),
  isAdhoc: z.boolean().default(false),
  orderDays: z.array(weekday).default([]),
  deliveryDays: z.array(weekday).default([]),
  note: z.string().max(2000).default(""),
  cardImage: cardImage.default(null),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  isAdhoc: z.boolean().optional(),
  orderDays: z.array(weekday).optional(),
  deliveryDays: z.array(weekday).optional(),
  note: z.string().max(2000).optional(),
  cardImage: cardImage.optional(),
  sortOrder: z.number().int().optional(),
});

export const createItemSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(1, "품목명을 입력해줘"),
  zone: zone.nullable().default(null),
  inputType: inputType.default("NUMERIC"),
  safetyStock: z.coerce.number().int().min(0).default(0),
  statusHint: z.string().max(200).default(""),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  zone: zone.nullable().optional(),
  safetyStock: z.coerce.number().int().min(0).optional(),
  currentStock: z.coerce.number().int().min(0).optional(),
  statusHint: z.string().max(200).optional(),
  statusValue: statusValue.optional(),
});

export const itemOrderCheckSchema = z.object({
  itemId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않아"),
  completed: z.boolean(),
});
