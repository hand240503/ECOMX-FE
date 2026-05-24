export interface BrandSummary {
  id: number;
  code: string;
  name: string;
  status: number;
  logoUrl: string | null;
}

/** Khớp `CategoryResponse` trong docs/category.md */
export interface CategoryResponse {
  id: number;
  code: string;
  name: string;
  status: number;
  parentId: number | null;
  parentName: string | null;
  children: CategoryResponse[] | null;
  childrenCount: number;
  /** URL ảnh đại diện danh mục (Cloudinary). {@code null} nếu chưa upload. */
  thumbnailUrl: string | null;
  /** Danh sách brand có sản phẩm thuộc danh mục (chỉ có trong /roots). */
  brands: BrandSummary[] | null;
}
