/** @see docs/API_SHIPPING_AND_ORDERS_UPDATE.md */

export type ShippingDistanceResponse = {
  distanceMeters: number;
  distanceKilometers: number;
  durationSeconds: number;
  resolvedAddress: string | null;
  originLatitude: number;
  originLongitude: number;
  warehouseLatitude: number;
  warehouseLongitude: number;
  /** Phí ship (VND) — có thể `null` nếu BE không tính được. */
  shippingFeeVnd: number | null;
};

/** `GET /shipping/stores?address=` — một lựa chọn kho kèm phí ship tới địa chỉ. */
export type ShippingStoreOption = {
  storeId: number;
  code: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  storeLatitude: number | null;
  storeLongitude: number | null;
  routable: boolean;
  distanceMeters: number | null;
  distanceKilometers: number | null;
  durationSeconds: number | null;
  shippingFeeVnd: number | null;
};
