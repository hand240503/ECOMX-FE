import type { UserAddress } from '../api/types/auth.types';

/** Đọc field ship từ `UserAddress` (camelCase hoặc snake_case từ BE). */
export function getAddressShippingSnapshot(a: UserAddress): {
  shippingFeeVnd: number | null | undefined;
  distanceToWarehouseMeters: number | null | undefined;
} {
  const r = a as UserAddress & {
    shipping_fee_vnd?: number | null;
    distance_to_warehouse_meters?: number | null;
  };
  return {
    shippingFeeVnd: a.shippingFeeVnd ?? r.shipping_fee_vnd,
    distanceToWarehouseMeters: a.distanceToWarehouseMeters ?? r.distance_to_warehouse_meters,
  };
}
