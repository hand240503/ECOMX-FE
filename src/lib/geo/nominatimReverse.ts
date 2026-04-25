function nominatimBaseUrl() {
  return import.meta.env.DEV ? '/nominatim' : 'https://nominatim.openstreetmap.org';
}

export type NominatimReverseOk = {
  displayName: string;
  /** Gợi ý cho ô địa chỉ đường (số nhà + đường hoặc display_name). */
  addressLine: string;
  /** Thử lần lượt với resolveProvinceFromApiCity */
  cityGuesses: string[];
  /** Tên phường/xã thô từ OSM (có thể kèm tiền tố). */
  wardRaw: string;
};

function buildStreetLine(a: Record<string, string | undefined>): string {
  const house = a.house_number?.trim();
  const road = a.road?.trim() || a.pedestrian?.trim() || a.footway?.trim();
  if (road) {
    return [house, road].filter(Boolean).join(', ');
  }
  return '';
}

/**
 * Reverse geocoding (tọa độ → địa chỉ) qua Nominatim. Gọi tần suất thấp; production nên qua BE.
 */
export async function nominatimReverse(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<NominatimReverseOk | { error: string }> {
  const q = new URLSearchParams({
    format: 'json',
    'accept-language': 'vi,en',
    addressdetails: '1',
    namedetails: '0',
    lat: String(lat),
    lon: String(lng)
  });
  const url = `${nominatimBaseUrl()}/reverse?${q.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    return { error: `Nominatim: HTTP ${res.status}` };
  }
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  if (!data.address) {
    return { error: 'Không có dữ liệu địa chỉ tại vị trí này.' };
  }
  const addr = data.address;
  const displayName = (data.display_name || '').trim();
  const street = buildStreetLine(addr as Record<string, string | undefined>);
  const addressLine = street || displayName;
  const cityGuesses: string[] = [];
  for (const k of [
    'city',
    'town',
    'municipality',
    'state_district',
    'region',
    'state',
    'province'
  ] as const) {
    const v = addr[k];
    if (v?.trim()) cityGuesses.push(v.trim());
  }
  if (!cityGuesses.length && displayName) {
    cityGuesses.push(displayName);
  }
  const wardRaw =
    [addr.suburb, addr.quarter, addr.village, addr.hamlet, addr.neighbourhood, addr.city_district]
      .map((s) => s?.trim())
      .find((s) => s && s.length > 0) || '';

  return { displayName, addressLine, cityGuesses, wardRaw };
}
