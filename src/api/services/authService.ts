import axios from 'axios';
import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  SendOTPRequest,
  VerifyOTPRequest
} from '../types/auth.types';
import type { ApiResponse } from '../types/common.types';
import { tokenStorage } from '../../utils/tokenStorage';

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;

    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isLikelyJwt = (token: string): boolean => token.split('.').length === 3;

const isJwtExpired = (token: string): boolean => {
  if (!isLikelyJwt(token)) return false;

  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return true;
  return Date.now() >= exp * 1000;
};

type ProfileApiData = AuthResponse['user_info'] | { user_info: AuthResponse['user_info'] };

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Dang nhap that bai');
    }

    if (!response.data.data) {
      throw new Error('Khong nhan duoc du lieu tu server');
    }

    const { access_token, refresh_token, user_info } = response.data.data;

    if (!access_token || !refresh_token) {
      throw new Error('Khong nhan duoc token tu server');
    }

    tokenStorage.setTokens(access_token, refresh_token);
    tokenStorage.setUser(user_info);
    tokenStorage.getOrCreateDeviceId();

    return {
      user_info,
      access_token,
      refresh_token,
      token_type: response.data.data.token_type,
      expires_in: response.data.data.expires_in
    };
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Dang ky that bai');
    }

    // Backend current register flow only guarantees user_info.
    // Keep optional fields mapped when backend starts returning tokens.
    const { access_token, refresh_token, user_info } = response.data.data;
    return {
      user_info,
      access_token,
      refresh_token,
      token_type: response.data.data.token_type,
      expires_in: response.data.data.expires_in
    };
  },

  sendOTP: async (data: SendOTPRequest): Promise<boolean> => {
    const response = await axiosInstance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.SEND_OTP, data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Gui OTP that bai');
    }

    return true;
  },

  verifyEmail: async (data: VerifyOTPRequest): Promise<boolean> => {
    const response = await axiosInstance.post<ApiResponse<boolean>>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Xac thuc that bai');
    }

    return response.data.data || false;
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      const is401 = axios.isAxiosError(error) && error.response?.status === 401;

      // Access token het han -> refresh roi goi logout lai de BE revoke refresh token
      if (is401) {
        try {
          await authService.refreshToken();
          await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (retryError) {
          console.error('Logout retry failed:', retryError);
        }
      } else {
        console.error('Logout API failed:', error);
      }
    } finally {
      tokenStorage.clear();
    }
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<string> => {
    const response = await axiosInstance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Yeu cau that bai');
    }

    return response.data.message;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const response = await axiosInstance.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Reset mat khau that bai');
    }

    return response.data.message;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('Khong tim thay refresh token');
    }

    const response = await axiosInstance.post<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      {
        refreshToken,
        deviceId: tokenStorage.getOrCreateDeviceId()
      } as RefreshTokenRequest
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Refresh token that bai');
    }

    const { access_token, refresh_token, user_info } = response.data.data;

    if (!access_token || !refresh_token) {
      throw new Error('Khong nhan duoc token moi tu server');
    }

    tokenStorage.setTokens(access_token, refresh_token);
    tokenStorage.setUser(user_info);

    return {
      user_info,
      access_token,
      refresh_token,
      token_type: response.data.data.token_type,
      expires_in: response.data.data.expires_in
    };
  },

  fetchCurrentUser: async (): Promise<AuthResponse['user_info']> => {
    const response = await axiosInstance.get<ApiResponse<ProfileApiData>>(API_ENDPOINTS.USER.PROFILE);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Khong the tai thong tin nguoi dung');
    }

    const payload = response.data.data;
    const user = 'user_info' in payload ? payload.user_info : payload;
    tokenStorage.setUser(user);
    return user;
  },

  getCurrentUser: (): AuthResponse['user_info'] | null => {
    return tokenStorage.getUser<AuthResponse['user_info']>();
  },

  isAuthenticated: (): boolean => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) return false;
    if (isJwtExpired(refreshToken)) return false;
    if (!accessToken) return true;

    // Access token het han van coi con session, interceptor se tu refresh khi goi API
    if (isJwtExpired(accessToken)) return true;

    return true;
  },

  getAccessToken: (): string | null => tokenStorage.getAccessToken(),

  getRefreshToken: (): string | null => tokenStorage.getRefreshToken(),

  hasRole: (role: string): boolean => {
    const user = authService.getCurrentUser();
    return user?.roles?.includes(role) || false;
  },

  hasPermission: (permission: string): boolean => {
    const user = authService.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  },

  getFullName: (): string => {
    const user = authService.getCurrentUser();
    if (!user?.userInfo) return '';

    if (user.userInfo.fullName) {
      return user.userInfo.fullName;
    }

    const firstName = user.userInfo.firstName || '';
    const lastName = user.userInfo.lastName || '';
    return `${lastName} ${firstName}`.trim();
  },

  getEmail: (): string => {
    const user = authService.getCurrentUser();
    return user?.email || '';
  },

  getAvatar: (): string | null => {
    const user = authService.getCurrentUser();
    return user?.userInfo?.avatar || null;
  },

  hasAnyRole: (roles: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  },

  hasAllRoles: (roles: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.roles) return false;
    return roles.every(role => user.roles.includes(role));
  },

  hasAnyPermission: (permissions: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  },

  hasAllPermissions: (permissions: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.permissions) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  },

  clearAuth: (): void => {
    tokenStorage.clear();
  }
};