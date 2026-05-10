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
  prices: ProductPrice[] | null;
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
