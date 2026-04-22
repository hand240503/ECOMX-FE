import raw from './vietnam_addresses.json';

export type VietnamWard = {
  code: number;
  name: string;
  type: string;
  slug: string;
};

export type VietnamProvince = {
  code: number;
  name: string;
  type: string;
  slug: string;
  phone_code: number;
  wards: VietnamWard[];
};

export const VIETNAM_ADDRESS_TREE: VietnamProvince[] = raw as VietnamProvince[];

const stripProvincePrefix = (name: string): string =>
  name.replace(/^(Thành phố|Tỉnh)\s+/u, '').trim();

/** Danh sách tên tỉnh/TP (đúng chuỗi trong JSON), kèm «Khác». */
export const PROVINCE_NAMES: string[] = [
  ...[...VIETNAM_ADDRESS_TREE.map((p) => p.name)].sort((a, b) => a.localeCompare(b, 'vi')),
  'Khác'
];

export function getWardNamesByProvinceName(provinceName: string): string[] {
  if (provinceName === 'Khác') return [];
  const p = VIETNAM_ADDRESS_TREE.find((x) => x.name === provinceName);
  if (!p) return [];
  return [...p.wards.map((w) => w.name)].sort((a, b) => a.localeCompare(b, 'vi'));
}

/**
 * Khớp tên `city` từ API (có thể là tên ngắn cũ) với bản ghi trong JSON.
 */
export function resolveProvinceFromApiCity(city: string): { province: string; provinceCustom: string } {
  const c = city.trim();
  if (!c) return { province: 'Khác', provinceCustom: '' };

  const exact = VIETNAM_ADDRESS_TREE.find((p) => p.name === c);
  if (exact) return { province: exact.name, provinceCustom: '' };

  const shortC = stripProvincePrefix(c);
  const fuzzy = VIETNAM_ADDRESS_TREE.find((p) => {
    const shortP = stripProvincePrefix(p.name);
    return (
      shortP === shortC ||
      p.name.includes(c) ||
      c.includes(shortP) ||
      shortP.includes(shortC) ||
      shortC.includes(shortP)
    );
  });
  if (fuzzy) return { province: fuzzy.name, provinceCustom: '' };

  return { province: 'Khác', provinceCustom: c };
}

export const DEFAULT_PROVINCE_NAME: string =
  VIETNAM_ADDRESS_TREE.find((p) => p.name.includes('Hồ Chí Minh'))?.name ??
  VIETNAM_ADDRESS_TREE[0]?.name ??
  'Khác';
