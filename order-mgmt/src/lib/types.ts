export type ItemDto = {
  id: string;
  vendorId: string;
  name: string;
  safetyStock: number;
  currentStock: number;
  stockUpdatedAt: string | null;
  sortOrder: number;
};

export type VendorDto = {
  id: string;
  name: string;
  isAdhoc: boolean;
  orderDays: string;
  deliveryDays: string;
  sortOrder: number;
  items: ItemDto[];
};
