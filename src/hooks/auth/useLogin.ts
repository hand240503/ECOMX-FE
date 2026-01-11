import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../api/services';
import { validateEmailOrPhone, validatePassword, detectInputType } from '../../utils/validate';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../../api/types/common.types';
import { toast } from 'react-hot-toast';

export const useLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path và auto-fill email từ register
  const locationState = location.state as { message?: string; email?: string; from?: string } | null;
  const from = locationState?.from || '/';

  // Form states
  const [login, setLogin] = useState(locationState?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [loading, setLoading] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');

  // Detect input type
  const inputType = detectInputType(login);

  // ==================== SHOW SUCCESS MESSAGE FROM REGISTER ====================

  useEffect(() => {
    if (locationState?.message) {
      toast.success(locationState.message);
      // Clear state để không hiển thị lại khi refresh
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  // ==================== PLACEHOLDER ====================

  const getPlaceholder = () => {
    if (!login) return 'Email/Số điện thoại/Tên đăng nhập';

    switch (inputType) {
      case 'email':
        return 'Đang nhập email...';
      case 'phone':
        return 'Đang nhập số điện thoại...';
      case 'username':
        return 'Đang nhập tên đăng nhập...';
      default:
        return 'Email/Số điện thoại/Tên đăng nhập';
    }
  };

  // ==================== HANDLERS ====================

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLogin(e.target.value);
    if (emailError) setEmailError('');
    if (apiError) setApiError('');
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
    if (apiError) setApiError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // ==================== VALIDATION ====================

  const validateForm = (): boolean => {
    const emailValidationError = validateEmailOrPhone(login);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError) setEmailError(emailValidationError);
    if (passwordValidationError) setPasswordError(passwordValidationError);

    return !emailValidationError && !passwordValidationError;
  };

  // ==================== SUBMIT ====================

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setApiError('');

    // Validate
    if (!validateForm()) return;

    // Call API
    setLoading(true);

    try {
      const authResponse = await authService.login({
        login: login.trim(),
        password,
      });

      console.log('=== LOGIN SUCCESS ===');
      console.log('User Info:', authResponse.user_info);
      console.log('Email:', authResponse.user_info.email);
      console.log('Roles:', authResponse.user_info.roles);
      console.log('Permissions:', authResponse.user_info.permissions);
      console.log('===================');

      toast.success('Đăng nhập thành công!');

      // Navigate to intended page or home
      navigate(from, { replace: true });

    } catch (error) {
      console.error('❌ Login error:', error);

      // Handle error from backend
      if (error instanceof AxiosError) {
        const apiResponse = error.response?.data as ApiResponse;

        if (apiResponse) {
          setApiError(apiResponse.message || 'Đăng nhập thất bại');

          if (apiResponse.errors && apiResponse.errors.length > 0) {
            apiResponse.errors.forEach((err) => {
              if (err.field === 'login' || err.field === 'email') {
                setEmailError(err.message);
              } else if (err.field === 'password') {
                setPasswordError(err.message);
              }
            });
          }
        } else {
          setApiError('Không thể kết nối đến server');
        }
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Đã có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==================== RETURN ====================

  return {
    // States
    login,
    password,
    showPassword,
    activeTab,
    loading,
    emailError,
    passwordError,
    apiError,
    inputType,

    // Computed
    getPlaceholder,

    // Handlers
    handleEmailChange,
    handlePasswordChange,
    togglePasswordVisibility,
    handleTabChange,
    handleLogin,
  };
};