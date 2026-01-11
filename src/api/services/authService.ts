import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type {
  LoginRequest,
  RegisterRequest,
  SendOTPRequest,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyOTPRequest,
} from '../types/auth.types';
import type { ApiResponse } from '../types/common.types';

export const authService = {
  // ==================== ĐĂNG NHẬP ====================
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    }

    if (!response.data.data) {
      throw new Error('Không nhận được dữ liệu từ server');
    }

    const { access_token, refresh_token, user_info } = response.data.data;

    if (!access_token || !refresh_token) {
      throw new Error('Không nhận được token từ server');
    }

    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user_info));

    return {
      user_info,
      access_token,
      refresh_token,
      token_type: response.data.data.token_type,
      expires_in: response.data.data.expires_in,
    };
  },

  // ==================== ĐĂNG KÝ ====================
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Đăng ký thất bại');
    }

    const { access_token, refresh_token, user_info } = response.data.data;

    if (!access_token || !refresh_token) {
      throw new Error('Không nhận được token từ server');
    }

    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user_info));

    return {
      user_info,
      access_token,
      refresh_token,
      token_type: response.data.data.token_type,
      expires_in: response.data.data.expires_in,
    };
  },

  // ==================== GỬI OTP ====================
  sendOTP: async (data: SendOTPRequest): Promise<boolean> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      API_ENDPOINTS.AUTH.SEND_OTP,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Gửi OTP thất bại');
    }

    return true;
  },

  // ==================== XÁC THỰC EMAIL ====================
  verifyEmail: async (data: VerifyOTPRequest): Promise<boolean> => {
    const response = await axiosInstance.post<ApiResponse<boolean>>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Xác thực thất bại');
    }

    return response.data.data || false;
  },

  // ==================== ĐĂNG XUẤT ====================
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

  // ==================== QUÊN MẬT KHẨU ====================
  forgotPassword: async (data: ForgotPasswordRequest): Promise<string> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Yêu cầu thất bại');
    }

    return response.data.message;
  },

  // ==================== RESET MẬT KHẨU ====================
  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const response = await axiosInstance.post<ApiResponse<void>>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Reset mật khẩu thất bại');
    }

    return response.data.message;
  },

  // ==================== REFRESH TOKEN ====================
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('Không tìm thấy refresh token');
    }

    const response = await axiosInstance.post<RefreshTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken } as RefreshTokenRequest
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Refresh token thất bại');
    }

    const { access_token, refresh_token, user_info } = response.data.data;

    if (!access_token || !refresh_token) {
      throw new Error('Không nhận được token mới từ server');
    }

    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    localStorage.setItem('user', JSON.stringify(user_info));

    return {
      user_info,
      access_token,
      refresh_token,
      token_type: response.data.data.token_type,
      expires_in: response.data.data.expires_in,
    };
  },

  // ==================== HELPER METHODS ====================

  /**
   * Lấy thông tin user hiện tại từ localStorage
   */
  getCurrentUser: (): AuthResponse['user_info'] | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isAuthenticated: (): boolean => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return !!(accessToken && refreshToken);
  },

  /**
   * Lấy access token hiện tại
   */
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  /**
   * Lấy refresh token hiện tại
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Kiểm tra user có role cụ thể
   */
  hasRole: (role: string): boolean => {
    const user = authService.getCurrentUser();
    return user?.roles?.includes(role) || false;
  },

  /**
   * Kiểm tra user có permission cụ thể
   */
  hasPermission: (permission: string): boolean => {
    const user = authService.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  },

  /**
   * Lấy tên đầy đủ của user
   */
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

  /**
   * Lấy email của user
   */
  getEmail: (): string => {
    const user = authService.getCurrentUser();
    return user?.email || '';
  },

  /**
   * Lấy avatar của user
   */
  getAvatar: (): string | null => {
    const user = authService.getCurrentUser();
    return user?.userInfo?.avatar || null;
  },

  /**
   * Kiểm tra user có nhiều roles
   */
  hasAnyRole: (roles: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  },

  /**
   * Kiểm tra user có tất cả roles
   */
  hasAllRoles: (roles: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.roles) return false;
    return roles.every(role => user.roles.includes(role));
  },

  /**
   * Kiểm tra user có nhiều permissions
   */
  hasAnyPermission: (permissions: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  },

  /**
   * Kiểm tra user có tất cả permissions
   */
  hasAllPermissions: (permissions: string[]): boolean => {
    const user = authService.getCurrentUser();
    if (!user?.permissions) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  },

  /**
   * Clear tất cả auth data
   */
  clearAuth: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};