import axios from 'axios';
import { axiosInstance } from '../api/config/axiosConfig';
import type { ApiResponse, ApiFieldError } from '../types/api';

type EmptyPayload = null;

export interface ForgotPasswordRequestPayload {
  login: string;
}

export interface VerifyForgotOtpRequestPayload {
  login: string;
  otp: string;
}

export interface ResetPasswordRequestPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ApiClientError {
  message: string;
  fieldErrors: ApiFieldError[];
}

export class ApiRequestError extends Error implements ApiClientError {
  fieldErrors: ApiFieldError[];

  constructor(message: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiRequestError';
    this.fieldErrors = fieldErrors;
  }
}

const FALLBACK_NETWORK_MESSAGE = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';

const normalizeFieldErrors = (errors: unknown): ApiFieldError[] => {
  if (!Array.isArray(errors)) return [];

  return errors
    .filter((item): item is ApiFieldError => {
      return (
        typeof item === 'object' &&
        item !== null &&
        'message' in item &&
        typeof (item as { message?: unknown }).message === 'string'
      );
    })
    .map((item) => ({ field: item.field, message: item.message }));
};

const mapApiError = (error: unknown): ApiRequestError => {
  if (!axios.isAxiosError(error)) {
    return new ApiRequestError(FALLBACK_NETWORK_MESSAGE, []);
  }

  const responseData = error.response?.data as
    | { message?: unknown; errors?: unknown }
    | undefined;

  const message =
    typeof responseData?.message === 'string' && responseData.message.trim().length > 0
      ? responseData.message
      : FALLBACK_NETWORK_MESSAGE;

  return new ApiRequestError(message, normalizeFieldErrors(responseData?.errors));
};

const postAuth = async <TRequest>(url: string, payload: TRequest): Promise<string> => {
  try {
    const response = await axiosInstance.post<ApiResponse<EmptyPayload>>(url, payload);
    if (!response.data.success) {
      throw new ApiRequestError(response.data.message || FALLBACK_NETWORK_MESSAGE, normalizeFieldErrors(response.data.errors));
    }
    return response.data.message;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw mapApiError(error);
  }
};

export const authApi = {
  requestForgotPasswordOtp: (payload: ForgotPasswordRequestPayload) =>
    postAuth('/auth/password/forgot/request', payload),

  verifyForgotPasswordOtp: (payload: VerifyForgotOtpRequestPayload) =>
    postAuth('/auth/password/forgot/verify-otp', payload),

  resetPassword: (payload: ResetPasswordRequestPayload) => postAuth('/auth/password/reset', payload)
};
