import axios from 'axios';
import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ApiResponse, PaginationMetadata, ProductSearchMetadata } from '../types/common.types';
import type { ProductDetailResponse, ProductFullResponse } from '../types/product.types';

export interface ProductsByCategoryResult {
  products: ProductFullResponse[];
  metadata: PaginationMetadata | null;
  message: string;
}

export interface ProductSearchResult extends ProductsByCategoryResult {
  spellSuggestion: string | null;
}

export class ProductNotFoundError extends Error {
  readonly code = 'PRODUCT_NOT_FOUND' as const;
  constructor(message = 'Product not found') {
    super(message);
    this.name = 'ProductNotFoundError';
  }
}

export const productService = {
  /**
   * `GET /products/{id}/detail` — product + recommendations.
   * @see docs/product_api.md
   */
  async getDetail(params: {
    id: number | string;
    userId?: number;
    sessionId?: string;
    recommendationLimit?: number;
    signal?: AbortSignal;
  }): Promise<{ product: ProductFullResponse; recommendations: ProductFullResponse[] }> {
    const { id, userId, sessionId, recommendationLimit = 10, signal } = params;

    try {
      const { data } = await axiosInstance.get<ApiResponse<ProductDetailResponse>>(
        API_ENDPOINTS.PRODUCT.DETAIL_WITH_RECOMMENDATIONS(id),
        {
          params: {
            ...(userId != null ? { userId } : {}),
            ...(sessionId ? { sessionId } : {}),
            recommendationLimit,
          },
          signal,
        }
      );

      if (data.success === false || data.data?.product == null) {
        throw new ProductNotFoundError(
          typeof data.message === 'string' && data.message.trim() !== ''
            ? data.message.trim()
            : 'Product not found'
        );
      }

      return {
        product: data.data.product,
        recommendations: Array.isArray(data.data.recommendations) ? data.data.recommendations : [],
      };
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        throw new ProductNotFoundError();
      }
      throw e;
    }
  },

  /**
   * `GET /products/category/{categoryId}?page=&limit=`
   * — Trả SP gán vào `categoryId` hoặc bất kỳ danh mục con/cháu nào (subtree), phân trang, envelope `APIResponse`.
   * @see docs/product-by-category.md
   * @see docs/home-category-product-list-flow.md (bước 4 — `categoryId` là id số sau khi FE resolve từ URL)
   */
  async getByCategory(
    categoryId: number,
    params: { page?: number; limit?: number; signal?: AbortSignal }
  ): Promise<ProductsByCategoryResult> {
    const { data } = await axiosInstance.get<ApiResponse<ProductFullResponse[]>>(
      API_ENDPOINTS.PRODUCT.BY_CATEGORY(categoryId),
      {
        params: {
          page: params.page ?? 0,
          limit: params.limit ?? 20,
        },
        signal: params.signal,
      }
    );

    return {
      products: Array.isArray(data.data) ? data.data : [],
      metadata: (data.metadata as PaginationMetadata | undefined) ?? null,
      message: typeof data.message === 'string' ? data.message : '',
    };
  },

  /**
   * `GET /products/search?q=&page=&limit=` — `APIResponse<ProductFullResponse[]>`; `metadata` phân trang + gợi ý từ khóa.
   * @see docs/api_search.md §1
   */
  async search(params: {
    q: string;
    page?: number;
    limit?: number;
    signal?: AbortSignal;
  }): Promise<ProductSearchResult> {
    const { data } = await axiosInstance.get<ApiResponse<ProductFullResponse[]>>(
      API_ENDPOINTS.PRODUCT.SEARCH,
      {
        params: {
          q: params.q,
          page: params.page ?? 0,
          limit: params.limit ?? 20,
        },
        signal: params.signal,
      }
    );

    if (data.success === false) {
      throw new Error(
        typeof data.message === 'string' && data.message.trim() !== ''
          ? data.message.trim()
          : 'Search failed'
      );
    }

    const meta = data.metadata as ProductSearchMetadata | undefined;
    const spellRaw = meta?.suggestedQuery ?? meta?.spellSuggestion;
    const spellSuggestion =
      typeof spellRaw === 'string' && spellRaw.trim() !== '' ? spellRaw.trim() : null;

    return {
      products: Array.isArray(data.data) ? data.data : [],
      metadata: meta ?? (data.metadata as PaginationMetadata | undefined) ?? null,
      message: typeof data.message === 'string' ? data.message : '',
      spellSuggestion,
    };
  },
};
