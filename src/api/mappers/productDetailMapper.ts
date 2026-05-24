import type {
  ActivePriceChangeSnapshot,
  ProductFullResponse,
  ProductPrice,
  PurchaseWithPurchaseProgramSnapshot,
  VolumePriceTierSnapshot,
} from '../types/product.types';
import { formatPrice, formatShortCount } from '../../lib/formatPrice';
import { getProductImageUrl, getVariantImageUrl, getVariantImageUrls } from '../../lib/productImage';
import {
  extractFromEffectiveUnitPrice,
  extractPurchaseWithPurchasePrograms,
  extractVolumePriceTiers,
} from '../../lib/productPricingDisplay';
import { normalizedVariantsFromProduct, pickDefaultVariant } from '../../lib/productVariantNormalize';

export interface ProductDetailPriceRow {
  id: number;
  unitId: number;
  unitName: string;
  currentValue: number;
  oldValue: number | null;
  /** Chỉ khi `oldValue > currentValue > 0` — tính trong mapper (PAGE_product_detail.md §7). */
  discountPercent: number | null;
  formattedCurrent: string;
  formattedOld: string | null;
}

export interface ProductDetailOptionGroup {
  key: string;
  values: string[];
}

export interface ProductDetailVariantRow {
  id: number;
  skuCode: string | null;
  optionValues: Record<string, string>;
  active: boolean;
  sortOrder: number;
  /** Giá catalog theo đơn vị — snapshot `prices[]` của SKU. */
  prices: ProductDetailPriceRow[];
  effectiveUnitPrice: number | null;
  activePriceChange: ActivePriceChangeSnapshot | null;
  /** Đã resolve URL — SKU có ảnh thì ưu tiên SKU, không thì fallback SPU (đúng GUIDE_USER §4.2). */
  displayThumbnailUrl?: string;
  /** Gallery ảnh đầy đủ của SKU — dùng để cập nhật gallery khi chọn biến thể trên PDP. */
  displayImageUrls?: string[];
}

export interface ProductDetailModel {
  id: number;
  productName: string;
  /** PDP — nội dung chi tiết: ưu tiên `l_description` / `lDescription`, không thì `description`. */
  descriptionHtml: string | null;
  /** Mô tả ngắn (chỉ khi có mô tả dài và nội dung khác mô tả dài). */
  shortDescriptionHtml: string | null;
  /** `true` khi khối chi tiết đang hiển thị từ trường mô tả dài. */
  detailFromLongDescription: boolean;
  inStock: boolean;
  isFeatured: boolean;
  soldCountLabel: string;
  tag: string | null;
  brand: ProductFullResponse['brand'];
  category: ProductFullResponse['category'];
  /** Giá cấp SPU (legacy / không có `variants`). */
  prices: ProductDetailPriceRow[];
  /** SKU đã chuẩn hoá — rỗng nếu SP đơn cấu hình legacy. */
  variants: ProductDetailVariantRow[];
  optionKeysOrdered: string[];
  optionGroups: ProductDetailOptionGroup[];
  /** SKU mặc định (active, sortOrder nhỏ nhất). */
  defaultVariantId: number | null;
  averageRating: number | null;
  ratingCount: number;
  /** Mix-and-match — snapshot để PDP / marketing copy. */
  volumePriceTiers: VolumePriceTierSnapshot[];
  purchaseWithPurchasePrograms: PurchaseWithPurchaseProgramSnapshot[];
}

function mapPriceRow(p: ProductPrice): ProductDetailPriceRow {
  const current = Math.round(Number.isFinite(p.currentValue) ? p.currentValue : 0);
  const oldRaw = p.oldValue;
  const old =
    oldRaw != null && Number.isFinite(oldRaw) && oldRaw > 0 ? Math.round(oldRaw) : null;
  const discountPercent =
    old != null && current > 0 && old > current
      ? Math.round((1 - current / old) * 100)
      : null;

  return {
    id: p.id,
    unitId: p.unitId,
    unitName: p.unitName,
    currentValue: current,
    oldValue: old,
    discountPercent,
    formattedCurrent: formatPrice(current),
    formattedOld: old != null && old > current ? formatPrice(old) : null,
  };
}

function trimmedNonEmpty(s: string | null | undefined): string | null {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  return t !== '' ? t : null;
}

/** `l_description` (snake) hoặc `lDescription` (camelCase) khi có. */
function pickLongDescriptionHtml(product: ProductFullResponse): string | null {
  return trimmedNonEmpty(product.l_description) ?? trimmedNonEmpty(product.lDescription);
}

function normalizeDetailFields(product: ProductFullResponse): {
  descriptionHtml: string | null;
  shortDescriptionHtml: string | null;
  detailFromLongDescription: boolean;
} {
  const longHtml = pickLongDescriptionHtml(product);
  const shortHtml = trimmedNonEmpty(product.description);

  if (longHtml != null) {
    const shortDistinct =
      shortHtml != null && shortHtml.trim() !== longHtml.trim() ? shortHtml : null;
    return {
      descriptionHtml: longHtml,
      shortDescriptionHtml: shortDistinct,
      detailFromLongDescription: true,
    };
  }
  if (shortHtml != null) {
    return {
      descriptionHtml: shortHtml,
      shortDescriptionHtml: null,
      detailFromLongDescription: false,
    };
  }
  return {
    descriptionHtml: null,
    shortDescriptionHtml: null,
    detailFromLongDescription: false,
  };
}

function buildOptionGroupsFromVariants(
  variants: ProductDetailVariantRow[]
): { optionKeysOrdered: string[]; optionGroups: ProductDetailOptionGroup[] } {
  const keyOrder: string[] = [];
  const valueMap = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const k of Object.keys(v.optionValues)) {
      if (!valueMap.has(k)) {
        valueMap.set(k, new Set());
        keyOrder.push(k);
      }
      const val = v.optionValues[k];
      if (val != null && val !== '') valueMap.get(k)!.add(val);
    }
  }
  const optionGroups: ProductDetailOptionGroup[] = keyOrder.map((key) => ({
    key,
    values: [...(valueMap.get(key) ?? new Set())].sort((a, b) => a.localeCompare(b, 'vi')),
  }));
  return { optionKeysOrdered: keyOrder, optionGroups };
}

/** Khớp đủ tổ hợp tùy chọn với một dòng SKU (theo thứ tự khóa đã gom). */
export function matchDetailVariantByOptions(
  variants: ProductDetailVariantRow[],
  optionKeysOrdered: string[],
  selected: Record<string, string>
): ProductDetailVariantRow | null {
  if (!variants.length || optionKeysOrdered.length === 0) return null;
  for (const k of optionKeysOrdered) {
    const s = selected[k];
    if (s == null || String(s).trim() === '') return null;
  }
  for (const v of variants) {
    let ok = true;
    for (const k of optionKeysOrdered) {
      if ((v.optionValues[k] ?? '') !== (selected[k] ?? '')) {
        ok = false;
        break;
      }
    }
    if (ok) return v;
  }
  return null;
}

/**
 * SKU đại diện cho một giá trị tùy chọn (ảnh/giá trên card) — khớp các chiều đã chọn, còn lại coi là “any”.
 */
export function resolveVariantPreviewForOptionValue(
  variants: ProductDetailVariantRow[],
  optionKeysOrdered: string[],
  selectedOptions: Record<string, string>,
  groupKey: string,
  value: string,
): ProductDetailVariantRow | null {
  const matchValue = variants.filter((v) => (v.optionValues[groupKey] ?? '') === value);
  if (!matchValue.length) return null;

  const narrowed = matchValue.filter((v) => {
    for (const k of optionKeysOrdered) {
      if (k === groupKey) continue;
      const sel = selectedOptions[k];
      if (sel == null || String(sel).trim() === '') continue;
      if ((v.optionValues[k] ?? '') !== sel) return false;
    }
    return true;
  });

  const pool = narrowed.length > 0 ? narrowed : matchValue;
  const active = pool.filter((v) => v.active);
  const finalPool = active.length > 0 ? active : pool;
  return [...finalPool].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}

/**
 * Dòng giá hiển thị PDP: overlay `effective_unit_price` + PC lên catalog `prices[]` (docs FE giá §1.1).
 */
export function resolveVariantDisplayPrices(
  variant: ProductDetailVariantRow,
  catalogFallbackUnit: Pick<ProductDetailPriceRow, 'unitId' | 'unitName'> | null,
): ProductDetailPriceRow[] {
  const catalog = variant.prices;
  const eff = variant.effectiveUnitPrice;
  const pc = variant.activePriceChange;

  const overlayOld = (
    sale: number,
    catalogRow: ProductDetailPriceRow | null,
  ): Pick<ProductDetailPriceRow, 'oldValue' | 'discountPercent' | 'formattedOld'> => {
    let oldValue: number | null = null;
    if (pc != null && pc.basePrice > sale) oldValue = pc.basePrice;
    else if (catalogRow?.oldValue != null && catalogRow.oldValue > sale) oldValue = catalogRow.oldValue;

    const discountPercent =
      oldValue != null && sale > 0 && oldValue > sale
        ? Math.round((1 - sale / oldValue) * 100)
        : null;
    const formattedOld =
      oldValue != null && oldValue > sale ? formatPrice(oldValue) : null;
    return { oldValue, discountPercent, formattedOld };
  };

  if ((!catalog || catalog.length === 0) && eff != null && eff > 0) {
    const uid = catalogFallbackUnit?.unitId ?? -1;
    const uname = catalogFallbackUnit?.unitName ?? '';
    const { oldValue, discountPercent, formattedOld } = overlayOld(eff, null);
    return [
      {
        id: -Math.max(1, variant.id),
        unitId: uid,
        unitName: uname,
        currentValue: eff,
        oldValue,
        discountPercent,
        formattedCurrent: formatPrice(eff),
        formattedOld,
      },
    ];
  }

  if (catalog?.length && eff != null && eff > 0) {
    return catalog.map((row, i) => {
      if (i !== 0) return row;
      const { oldValue, discountPercent, formattedOld } = overlayOld(eff, row);
      return {
        ...row,
        currentValue: eff,
        oldValue,
        discountPercent,
        formattedCurrent: formatPrice(eff),
        formattedOld,
      };
    });
  }

  return catalog?.length ? catalog.map((r) => ({ ...r })) : [];
}

export function pickDetailPriceRowForUnit(
  variant: ProductDetailVariantRow,
  preferredUnitId: number | null,
  catalogFallbackUnit: Pick<ProductDetailPriceRow, 'unitId' | 'unitName'> | null,
): ProductDetailPriceRow | null {
  const rows = resolveVariantDisplayPrices(variant, catalogFallbackUnit);
  if (!rows.length) return null;
  if (preferredUnitId != null) {
    const hit = rows.find((p) => p.unitId === preferredUnitId);
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

/** `status === 1` → còn hàng (PAGE_product_detail.md §7). */
export function mapProductFullToDetailModel(product: ProductFullResponse): ProductDetailModel {
  const rawPrices = product.prices;
  let prices = Array.isArray(rawPrices) ? rawPrices.map(mapPriceRow) : [];

  const normVariants = normalizedVariantsFromProduct(product);
  const productHeroThumb = getProductImageUrl(product);
  const variantRows: ProductDetailVariantRow[] = normVariants.map((v) => {
    const fromSku = getVariantImageUrl(v);
    const displayThumbnailUrl = fromSku ?? productHeroThumb;
    const variantImgUrls = getVariantImageUrls(v);
    return {
      id: v.id,
      skuCode: v.skuCode ?? null,
      optionValues: { ...v.optionValues },
      active: v.active,
      sortOrder: v.sortOrder,
      prices: Array.isArray(v.prices) ? v.prices.map(mapPriceRow) : [],
      effectiveUnitPrice:
        typeof v.effectiveUnitPrice === 'number' && Number.isFinite(v.effectiveUnitPrice)
          ? Math.round(v.effectiveUnitPrice)
          : null,
      activePriceChange: v.activePriceChange ?? null,
      ...(displayThumbnailUrl ? { displayThumbnailUrl } : {}),
      ...(variantImgUrls.length > 0 ? { displayImageUrls: variantImgUrls } : {}),
    };
  });

  const fromEffListing = extractFromEffectiveUnitPrice(product);
  if (!variantRows.length && prices.length === 0 && fromEffListing != null && fromEffListing > 0) {
    prices = [
      {
        id: -product.id,
        unitId: -1,
        unitName: '',
        currentValue: fromEffListing,
        oldValue: null,
        discountPercent: null,
        formattedCurrent: formatPrice(fromEffListing),
        formattedOld: null,
      },
    ];
  }

  const volumePriceTiers = extractVolumePriceTiers(product);
  const purchaseWithPurchasePrograms = extractPurchaseWithPurchasePrograms(product);

  const { optionKeysOrdered, optionGroups } = buildOptionGroupsFromVariants(variantRows);
  const def = pickDefaultVariant(normVariants);
  const defaultVariantId = def?.id ?? null;

  const sold = Number(product.soldCount ?? 0);

  const { descriptionHtml, shortDescriptionHtml, detailFromLongDescription } =
    normalizeDetailFields(product);

  return {
    id: product.id,
    productName: product.productName ?? '',
    descriptionHtml,
    shortDescriptionHtml,
    detailFromLongDescription,
    inStock: product.status === 1,
    isFeatured: Boolean(product.isFeatured),
    soldCountLabel: formatShortCount(sold),
    tag: typeof product.tag === 'string' && product.tag.trim() !== '' ? product.tag.trim() : null,
    brand: product.brand,
    category: product.category,
    prices,
    variants: variantRows,
    optionKeysOrdered,
    optionGroups,
    defaultVariantId,
    averageRating: product.averageRating ?? null,
    ratingCount: Number(product.ratingCount ?? 0),
    volumePriceTiers,
    purchaseWithPurchasePrograms,
  };
}
