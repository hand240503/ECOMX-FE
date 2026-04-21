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

/**
 * Theo api_home.md; backend có thể bổ sung thêm field ảnh — resolve trong getProductImageUrl.
 */
export interface ProductFullResponse {
  id: number;
  productName: string;
  description: string;
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
  /** Một số bản API có thể trả — không có trong tài liệu tối thiểu */
  thumbnailUrl?: string | null;
  mainImageUrl?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
}

/** `GET /products/{id}/detail` — docs/product_api.md */
export interface ProductDetailResponse {
  product: ProductFullResponse;
  recommendations: ProductFullResponse[];
}
