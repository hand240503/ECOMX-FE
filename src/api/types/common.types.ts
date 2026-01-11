// ErrorResponse từ backend
export interface ErrorResponse {
  field?: string;
  code?: string;
  message: string;
  rejectedValue?: any;
}

// Response chung từ API (khớp với backend Java)
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ErrorResponse[];
  metadata?: Record<string, any>;
  timestamp: string;
}

// Pagination metadata
export interface PaginationMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}