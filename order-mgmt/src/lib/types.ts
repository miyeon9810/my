export type InputType = "NUMERIC" | "STATUS";
export type StatusValue = "OK" | "LOW";
export type Zone = "HALL" | "KITCHEN";

export const ZONE_LABEL_KO: Record<Zone, string> = {
  HALL: "홀",
  KITCHEN: "주방",
};

export type ItemDto = {
  id: string;
  vendorId: string;
  name: string;
  zone: Zone | null;
  inputType: InputType;
  safetyStock: number;
  currentStock: number;
  statusHint: string;
  statusValue: StatusValue;
  stockUpdatedAt: string | null;
  sortOrder: number;
};

export type VendorDto = {
  id: string;
  name: string;
  isAdhoc: boolean;
  orderDays: string;
  deliveryDays: string;
  note: string;
  cardImage: string | null;
  sortOrder: number;
  items: ItemDto[];
};
