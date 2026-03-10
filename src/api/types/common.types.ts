export interface ErrorResponse {
  field?: string;
  code?: string;
  message: string;
  rejectedValue?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ErrorResponse[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PaginationMetadata {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}
