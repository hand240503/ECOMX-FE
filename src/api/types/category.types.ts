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
}
