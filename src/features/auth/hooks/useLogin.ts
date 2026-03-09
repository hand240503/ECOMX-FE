import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService } from '../../../shared/api/services';
import type { ApiResponse } from '../../../shared/api/types/common.types';
import { detectInputType, validateEmailOrPhone, validatePassword } from '../../../shared/utils/validate';

export const useLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { message?: string; email?: string; from?: string } | null;
  const from = locationState?.from || '/';

  const [login, setLogin] = useState(locationState?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');

  const inputType = detectInputType(login);

  useEffect(() => {
    if (locationState?.message) {
      toast.success(locationState.message);
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  const getPlaceholder = () => {
    if (!login) return 'Email/So dien thoai/Ten dang nhap';
    switch (inputType) {
      case 'email':
        return 'Dang nhap email...';
      case 'phone':
        return 'Dang nhap so dien thoai...';
      case 'username':
        return 'Dang nhap ten dang nhap...';
      default:
        return 'Email/So dien thoai/Ten dang nhap';
    }
  };

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

  const validateForm = (): boolean => {
    const emailValidationError = validateEmailOrPhone(login);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError) setEmailError(emailValidationError);
    if (passwordValidationError) setPasswordError(passwordValidationError);

    return !emailValidationError && !passwordValidationError;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setApiError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.login({
        login: login.trim(),
        password
      });

      toast.success('Dang nhap thanh cong!');
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof AxiosError) {
        const apiResponse = error.response?.data as ApiResponse;
        if (apiResponse) {
          setApiError(apiResponse.message || 'Dang nhap that bai');
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
          setApiError('Khong the ket noi den server');
        }
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Da co loi xay ra, vui long thu lai');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    password,
    showPassword,
    activeTab,
    loading,
    emailError,
    passwordError,
    apiError,
    inputType,
    getPlaceholder,
    handleEmailChange,
    handlePasswordChange,
    togglePasswordVisibility,
    handleTabChange,
    handleLogin
  };
};
