import type {
  ActivePriceChangeSnapshot,
  ProductFullResponse,
  PurchaseWithPurchaseProgramSnapshot,
  VolumePriceTierSnapshot,
} from '../api/types/product.types';

function numFromUnknown(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number.parseFloat(v.replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n);
  }
  return undefined;
}

function readProp(o: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (k in o) return o[k];
  }
  return undefined;
}

/** `from_effective_unit_price` / camelCase — card listing (docs Price FE §1.1). */
export function extractFromEffectiveUnitPrice(product: ProductFullResponse): number | undefined {
  const o = product as unknown as Record<string, unknown>;
  const v = readProp(o, ['fromEffectiveUnitPrice', 'from_effective_unit_price']);
  const n = numFromUnknown(v);
  return n != null && n > 0 ? n : undefined;
}

export function coerceActivePriceChangeSnapshot(raw: unknown): ActivePriceChangeSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.enabled === false) return null;
  const id = numFromUnknown(readProp(o, ['id'])) ?? 0;
  const basePrice = numFromUnknown(readProp(o, ['base_price', 'basePrice']));
  const salePrice = numFromUnknown(readProp(o, ['sale_price', 'salePrice']));
  if (basePrice == null || salePrice == null) return null;
  const productVariantIdRaw = readProp(o, ['productVariantId', 'product_variant_id']);
  const productVariantId =
    typeof productVariantIdRaw === 'number' && Number.isFinite(productVariantIdRaw)
      ? Math.trunc(productVariantIdRaw)
      : typeof productVariantIdRaw === 'string' && productVariantIdRaw.trim() !== ''
        ? Number.parseInt(productVariantIdRaw, 10)
        : null;

  const startAtRaw = readProp(o, ['startAt', 'start_at']);
  const endAtRaw = readProp(o, ['endAt', 'end_at']);
  const startAt = typeof startAtRaw === 'string' ? startAtRaw : null;
  const endAt = typeof endAtRaw === 'string' ? endAtRaw : null;

  const quantityLimit = numFromUnknown(readProp(o, ['quantityLimit', 'quantity_limit'])) ?? null;
  const soldQuantity = numFromUnknown(readProp(o, ['soldQuantity', 'sold_quantity'])) ?? null;
  const remainingQuantity = numFromUnknown(readProp(o, ['remainingQuantity', 'remaining_quantity'])) ?? null;
  const maxPerCustomer = numFromUnknown(readProp(o, ['maxPerCustomer', 'max_per_customer'])) ?? null;
  const pmcRaw = readProp(o, ['requiredPaymentMethodCode', 'required_payment_method_code']);
  const requiredPaymentMethodCode =
    typeof pmcRaw === 'string' && pmcRaw.trim() !== '' ? pmcRaw.trim().toUpperCase() : null;

  return {
    id,
    productVariantId: productVariantId != null && Number.isFinite(productVariantId) ? productVariantId : null,
    basePrice,
    salePrice,
    startAt,
    endAt,
    enabled: o.enabled !== false,
    quantityLimit,
    soldQuantity,
    remainingQuantity,
    maxPerCustomer,
    requiredPaymentMethodCode,
  };
}

function coerceVolumeTier(raw: unknown): VolumePriceTierSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.enabled === false) return null;
  const id = numFromUnknown(readProp(o, ['id']));
  const productId = numFromUnknown(readProp(o, ['productId', 'product_id']));
  const minQuantity = numFromUnknown(readProp(o, ['minQuantity', 'min_quantity']));
  const unitPrice = numFromUnknown(readProp(o, ['unitPrice', 'unit_price']));
  if (id == null || productId == null || minQuantity == null || unitPrice == null) return null;
  return {
    id,
    productId,
    minQuantity,
    unitPrice,
    enabled: o.enabled !== false,
  };
}

function coercePwpProgram(raw: unknown): PurchaseWithPurchaseProgramSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.enabled === false) return null;
  const roleRaw = readProp(o, ['role']);
  const role =
    roleRaw === 'companion' || roleRaw === 'anchor'
      ? roleRaw
      : typeof roleRaw === 'string'
        ? roleRaw.toLowerCase() === 'companion'
          ? 'companion'
          : roleRaw.toLowerCase() === 'anchor'
            ? 'anchor'
            : null
        : null;
  if (role == null) return null;

  const id = numFromUnknown(readProp(o, ['id']));
  const anchorProductId = numFromUnknown(readProp(o, ['anchorProductId', 'anchor_product_id']));
  const companionProductId = numFromUnknown(
    readProp(o, ['companionProductId', 'companion_product_id']),
  );
  const promoUnitPrice = numFromUnknown(readProp(o, ['promoUnitPrice', 'promo_unit_price']));
  const minAnchorQuantity = numFromUnknown(readProp(o, ['minAnchorQuantity', 'min_anchor_quantity']));
  if (
    id == null ||
    anchorProductId == null ||
    companionProductId == null ||
    promoUnitPrice == null ||
    minAnchorQuantity == null
  ) {
    return null;
  }

  const companionPromoUnitsPerAnchor = numFromUnknown(
    readProp(o, ['companionPromoUnitsPerAnchor', 'companion_promo_units_per_anchor']),
  );
  const maxCompanionPromoUnits = numFromUnknown(
    readProp(o, ['maxCompanionPromoUnits', 'max_companion_promo_units']),
  );

  const anchorVariantIdRaw = numFromUnknown(
    readProp(o, ['anchorVariantId', 'anchor_variant_id']),
  );
  const companionVariantIdRaw = numFromUnknown(
    readProp(o, ['companionVariantId', 'companion_variant_id']),
  );

  const optStr = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    return s !== '' ? s : null;
  };
  const anchorProductMainImageUrl = optStr(
    readProp(o, ['anchorProductMainImageUrl', 'anchor_product_main_image_url']),
  );
  const companionProductMainImageUrl = optStr(
    readProp(o, ['companionProductMainImageUrl', 'companion_product_main_image_url']),
  );

  return {
    id,
    role,
    anchorProductId,
    companionProductId,
    anchorVariantId: anchorVariantIdRaw ?? null,
    companionVariantId: companionVariantIdRaw ?? null,
    promoUnitPrice,
    minAnchorQuantity,
    companionPromoUnitsPerAnchor: companionPromoUnitsPerAnchor ?? null,
    maxCompanionPromoUnits: maxCompanionPromoUnits ?? null,
    enabled: o.enabled !== false,
    ...(anchorProductMainImageUrl != null ? { anchorProductMainImageUrl } : {}),
    ...(companionProductMainImageUrl != null ? { companionProductMainImageUrl } : {}),
  };
}

export function extractVolumePriceTiers(product: ProductFullResponse): VolumePriceTierSnapshot[] {
  const o = product as unknown as Record<string, unknown>;
  const raw = readProp(o, ['volumePriceTiers', 'volume_price_tiers']);
  if (!Array.isArray(raw)) return [];
  return raw.map(coerceVolumeTier).filter((t): t is VolumePriceTierSnapshot => t != null);
}

export function extractPurchaseWithPurchasePrograms(
  product: ProductFullResponse,
): PurchaseWithPurchaseProgramSnapshot[] {
  const o = product as unknown as Record<string, unknown>;
  const raw = readProp(o, ['purchaseWithPurchasePrograms', 'purchase_with_purchase_programs']);
  if (!Array.isArray(raw)) return [];
  return raw.map(coercePwpProgram).filter((p): p is PurchaseWithPurchaseProgramSnapshot => p != null);
}

export function productHasAnyVariantPcSale(product: ProductFullResponse): boolean {
  const raw = product.variants;
  if (!Array.isArray(raw)) return false;
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const pcRaw = readProp(o, ['active_price_change', 'activePriceChange']);
    const pc = coerceActivePriceChangeSnapshot(pcRaw);
    if (pc != null && pc.basePrice > pc.salePrice) return true;
  }
  return false;
}
