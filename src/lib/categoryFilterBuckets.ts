import type { CategoryResponse } from '../api/types/category.types';
import type { ProductFullResponse } from '../api/types/product.types';

export type BrandOption = { id: number; name: string };

export type SubcategoryBrandGroup = {
  subcategory: CategoryResponse;
  brands: BrandOption[];
};

/** Nhóm theo chữ cái đầu (tiếng Việt), `#` = số hoặc ký tự đặc biệt */
export type LetterBlockGroups = {
  key: string;
  groups: SubcategoryBrandGroup[];
};

export type LetterBlockBrands = {
  key: string;
  brands: BrandOption[];
};

function getAlphaBucketKey(name: string): string {
  const t = name.trim();
  if (!t) return '#';
  const ch = t[0];
  if (/[0-9]/.test(ch)) return '#';
  return ch.toLocaleUpperCase('vi-VN');
}

function sortBucketKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b, 'vi', { sensitivity: 'base' });
  });
}

export function groupBrandGroupsBySubcategoryLetter(
  brandGroups: SubcategoryBrandGroup[]
): LetterBlockGroups[] {
  const map = new Map<string, SubcategoryBrandGroup[]>();
  for (const g of brandGroups) {
    const key = getAlphaBucketKey(g.subcategory.name);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(g);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) =>
      a.subcategory.name.localeCompare(b.subcategory.name, 'vi', { sensitivity: 'base' })
    );
  }
  return sortBucketKeys([...map.keys()]).map((key) => ({ key, groups: map.get(key)! }));
}

export function groupFlatBrandsByLetter(brands: BrandOption[]): LetterBlockBrands[] {
  const map = new Map<string, BrandOption[]>();
  for (const b of brands) {
    const key = getAlphaBucketKey(b.name);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));
  }
  return sortBucketKeys([...map.keys()]).map((key) => ({ key, brands: map.get(key)! }));
}

export function sortCategoriesByName(categories: CategoryResponse[]): CategoryResponse[] {
  return [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
  );
}

export function sortBrandsByName(brands: BrandOption[]): BrandOption[] {
  return [...brands].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
  );
}

/**
 * Gom thương hiệu theo danh mục con (theo `product.category.id` trên trang hiện tại).
 * Sản phẩm không gắn con nào trong danh sách con → nhóm `otherBrands`.
 */
export function buildBrandGroupsBySubcategory(
  products: ProductFullResponse[],
  subcategories: CategoryResponse[]
): { groups: SubcategoryBrandGroup[]; otherBrands: BrandOption[] } {
  const sortedSubs = sortCategoriesByName(subcategories);
  const childIds = new Set(sortedSubs.map((s) => s.id));

  const byChild = new Map<number, Map<number, BrandOption>>();
  const otherMap = new Map<number, BrandOption>();

  for (const p of products) {
    if (!p.brand) continue;
    const entry: BrandOption = { id: p.brand.id, name: p.brand.name };
    const cid = p.category?.id;

    if (cid != null && childIds.has(cid)) {
      if (!byChild.has(cid)) byChild.set(cid, new Map());
      byChild.get(cid)!.set(entry.id, entry);
    } else {
      otherMap.set(entry.id, entry);
    }
  }

  const groups: SubcategoryBrandGroup[] = sortedSubs.map((sub) => ({
    subcategory: sub,
    brands: sortBrandsByName([...(byChild.get(sub.id)?.values() ?? [])]),
  }));

  const otherBrands = sortBrandsByName([...otherMap.values()]);

  return { groups, otherBrands };
}
