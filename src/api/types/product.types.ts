export interface BrandSummary {
  id: number;
  code: string;
  name: string;
  status: number;
}

export interface CategorySummary {
  id: number;
  code: string;
  name: string;
  status: number;
  parentId: number | null;
}

export interface ProductPrice {
  id: number;
  currentValue: number;
  oldValue: number | null;
  unitId: number;
  unitName: string;
  unitRatio: number;
  /** BE catalog — gắn giá với SKU (admin / list giá). */
  productVariantId?: number | null;
}

/** Price Change đang hiệu lực trên SKU — khớp `effective_unit_price` (docs FE giá User/Admin). */
export interface ActivePriceChangeSnapshot {
  id: number;
  productVariantId: number | null;
  basePrice: number;
  salePrice: number;
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
}

/** Bậc giá theo SL (mix-and-match) — snapshot trên `ProductFullResponse`. */
export interface VolumePriceTierSnapshot {
  id: number;
  productId: number;
  minQuantity: number;
  unitPrice: number;
  enabled: boolean;
}

/** Purchase-with-purchase — snapshot trên `ProductFullResponse`. */
export interface PurchaseWithPurchaseProgramSnapshot {
  id: number;
  role: 'companion' | 'anchor';
  anchorProductId: number;
  companionProductId: number;
  /** Variant cụ thể của anchor — null = áp dụng cho mọi variant của anchor product. */
  anchorVariantId: number | null;
  /** Variant cụ thể của companion. */
  companionVariantId: number | null;
  promoUnitPrice: number;
  minAnchorQuantity: number;
  companionPromoUnitsPerAnchor: number | null;
  maxCompanionPromoUnits: number | null;
  enabled: boolean;
  /** Tên sản phẩm anchor. */
  anchorProductName?: string | null;
  /** Tên sản phẩm companion. */
  companionProductName?: string | null;
  /** Ảnh chính sản phẩm anchor — BE enrich từ API /products/{id}/detail */
  anchorProductMainImageUrl?: string | null;
  /** Ảnh chính sản phẩm companion — BE enrich từ API /products/{id}/detail */
  companionProductMainImageUrl?: string | null;
}

/** Một SKU trong `ProductFullResponse.variants`. */
export interface ProductVariantResponse {
  id: number;
  skuCode?: string | null;
  optionValues: Record<string, string>;
  active: boolean;
  sortOrder: number;
  prices: ProductPrice[] | null;
  /** Đơn giá áp dụng snapshot API (ưu tiên hiển thị — có PC → sale). */
  effectiveUnitPrice?: number | null;
  activePriceChange?: ActivePriceChangeSnapshot | null;
  /** Ảnh SKU (khi BE gửi) — PDP / card biến thể; alias snake_case được coerce ở `coerceProductVariant`. */
  mainImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  imageUrls?: string[] | null;
  documents?: ProductDocumentAttachment[] | null;
}

/** `docs/API_product_policies_FE.md` — phần tử trong `policies` */
export interface PolicyResponse {
  id: number;
  code: string | null;
  name: string;
  policyType: string;
  numericValue: number | null;
  textValue: string | null;
  detail: string | null;
  active: boolean | null;
}

/**
 * Loại file document — JSON `type`. Upload mới map 1|2|3; `0` là legacy (coi như ảnh gallery).
 * `isMain` chỉ là cover khi `type === 1` hoặc legacy `0`; video `2` / tài liệu `3` không làm ảnh đại diện.
 */
export type DocumentKind = 0 | 1 | 2 | 3;

export interface ProductDocumentAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize?: string | number | null;
  type: DocumentKind;
  /** JSON `isMain` — ảnh chính (cover) chỉ khi kèm `type` 1 hoặc legacy 0. */
  isMain?: boolean | null;
}

/** Alias tên gọi trong tài liệu BE / hướng dẫn FE (isMain). */
export type ProductDocument = ProductDocumentAttachment;

/**
 * Theo api_home.md; backend có thể bổ sung thêm field ảnh — resolve trong getProductImageUrl.
 */
export interface ProductFullResponse {
  id: number;
  /** Mã SKU số (legacy); ưu tiên hiển thị `variants[].skuCode` khi có. */
  sku?: number | string | null;
  productName: string;
  /** Mô tả ngắn */
  description: string;
  /** Mô tả dài / rich text (PDP chi tiết), tách với `description` — JSON có thể là `l_description` hoặc `lDescription`. */
  l_description?: string | null;
  /** Một số cấu hình serialization trả camelCase cho cùng nội dung `l_description`. */
  lDescription?: string | null;
  status: number;
  isFeatured: boolean;
  soldCount: number;
  tag: string;
  createdDate: string;
  modifiedDate: string;
  brand: BrandSummary | null;
  category: CategorySummary | null;
  /** Giá đại diện list/card — catalog biến thể đại diện; không thay `fromEffectiveUnitPrice` khi có PC (docs FE giá). */
  prices: ProductPrice[] | null;
  /** Min `effective_unit_price` trên SKU active — nhãn card “Từ … ₫”. */
  fromEffectiveUnitPrice?: number | null;
  volumePriceTiers?: VolumePriceTierSnapshot[] | null;
  purchaseWithPurchasePrograms?: PurchaseWithPurchaseProgramSnapshot[] | null;
  /** Danh sách SKU; FE nên chuẩn hoá qua `normalizedVariantsFromProduct`. */
  variants?: ProductVariantResponse[] | unknown[] | null;
  recommendationScore: number | null;
  recommendationSource: string | null;
  averageRating: number | null;
  ratingCount: number | null;
  /** Gallery ảnh (BE: main trước, sau đó theo id). Không gồm video/tài liệu. */
  imageUrls?: string[] | null;
  /** Chi tiết file đính kèm; gallery ảnh: `type` 0 hoặc 1 (xem § DocumentKind). */
  documents?: ProductDocumentAttachment[] | null;
  thumbnailUrl?: string | null;
  mainImageUrl?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  /** Chỉ có trên PDP / detail API — list/search có thể không gửi field (docs/API_product_policies_FE.md) */
  policies?: PolicyResponse[] | null;
}

/** `GET /products/{id}/detail` — docs/product_api.md */
export interface ProductDetailResponse {
  product: ProductFullResponse;
  recommendations: ProductFullResponse[];
}

/** `GET /products/active-promotions` — docs/active-promotions-api.md */
export interface ActivePromotionsResponse {
  price_change: ProductFullResponse[];
  volume_tier: ProductFullResponse[];
  purchase_with_purchase: ProductFullResponse[];
}
