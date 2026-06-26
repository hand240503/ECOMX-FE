/** Kho / cửa hàng (public) — @see StoreController */
export type StoreResponse = {
  id: number;
  code: string;
  name: string;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
  isDefault: boolean;
  note?: string | null;
  createdDate?: string | null;
  modifiedDate?: string | null;
};
