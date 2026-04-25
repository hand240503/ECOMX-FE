/**
 * Tạo chuỗi tìm Nominatim khi user đã nhập tỉnh, phường, dòng địa chỉ.
 * `null` nếu chưa đủ dữ liệu.
 */
export function buildAddressGeocodeQuery(v: {
  province: string;
  provinceCustom: string;
  ward: string;
  addressLine: string;
}): string | null {
  const line = v.addressLine.trim();
  const ward = v.ward.trim();
  if (!line || !ward) {
    return null;
  }
  const prov =
    v.province === 'Khác' ? (v.provinceCustom || '').trim() : v.province.trim();
  if (!prov) {
    return null;
  }
  return [line, ward, prov, 'Việt Nam'].join(', ');
}
