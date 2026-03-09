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

    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user_info));

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

    const { access_token, refresh_token, user_info } = response.data.data;

    if (!access_token || !refresh_token) {
      throw new Error('Khong nhan duoc token tu server');
    }

    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user_info));

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
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
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
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('Khong tim thay refresh token');
    }

    const response = await axiosInstance.post<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken } as RefreshTokenRequest
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Refresh token that bai');
    }

    const { access_token, refresh_token, user_info } = response.data.data;

    if (!access_token || !refresh_token) {
      throw new Error('Khong nhan duoc token moi tu server');
    }

    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user_info));

    return {
      user_info,
      access_token,
      refresh_token,
      token_type: response.data.data.token_type,
      expires_in: response.data.data.expires_in
    };
  },

  getCurrentUser: (): AuthResponse['user_info'] | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return !!(accessToken && refreshToken);
  },

  getAccessToken: (): string | null => localStorage.getItem('accessToken'),

  getRefreshToken: (): string | null => localStorage.getItem('refreshToken'),

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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};
