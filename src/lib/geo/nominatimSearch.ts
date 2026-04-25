function nominatimBaseUrl() {
  return import.meta.env.DEV ? '/nominatim' : 'https://nominatim.openstreetmap.org';
}

export type NominatimResult = { lat: number; lng: number; displayName: string };

/**
 * Geocoding qua Nominatim (OSM). Chỉ dùng tần suất thấp (policy ~1 req/s);
 * production nên tự host Nominatim hoặc gọi từ backend.
 */
export async function nominatimSearch(
  q: string,
  signal?: AbortSignal
): Promise<NominatimResult | { error: string }> {
  const qTrim = q.trim();
  if (!qTrim) {
    return { error: 'Nhập địa chỉ.' };
  }
  const params = new URLSearchParams({
    q: qTrim,
    format: 'json',
    limit: '1',
    'accept-language': 'vi,en'
  });
  const url = `${nominatimBaseUrl()}/search?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    return { error: `Nominatim: HTTP ${res.status}` };
  }
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const first = data[0];
  if (!first) {
    return { error: 'Không tìm thấy địa chỉ. Thử thêm tỉnh/thành hoặc gõ rõ hơn.' };
  }
  const lat = Number.parseFloat(first.lat);
  const lng = Number.parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: 'Dữ liệu tọa độ không hợp lệ.' };
  }
  return { lat, lng, displayName: first.display_name };
}
