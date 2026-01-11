// Request types
export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface SendOTPRequest {
  login: string;
}

export interface VerifyOTPRequest {
  login: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// User Info nested types
export interface UserInfoDetails {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatar: string | null;
  managerId: number | null;
  info01: string | null;
  info02: string | null;
  info03: string | null;
  info04: string | null;
}

export interface UserAddress {
  id: number;
  addressLine: string;
  city: string;
  state: string | null;
  country: string;
  zipCode: string | null;
  isDefault: boolean;
}

// Response types - User Info (khớp với backend response)
export interface UserInfo {
  id: number;
  username: string | null;
  email: string;
  phoneNumber: string | null;
  status: number;
  type: number | null;
  userInfo: UserInfoDetails;
  roles: string[];
  permissions: string[];
  defaultAddress: UserAddress | null;
}

// ✅ Auth Response - khớp với structure từ backend
export interface AuthResponse {
  user_info: UserInfo;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds
}

// ✅ API Response wrapper từ backend
export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ✅ Type alias để dễ sử dụng
export type LoginResponse = APIResponse<AuthResponse>;
export type RegisterResponse = APIResponse<AuthResponse>;
export type RefreshTokenResponse = APIResponse<AuthResponse>;