import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChangeEvent } from 'react';
import {
  validateEmailOrPhone,
  validateVerificationCode,
  validatePassword,
  validateConfirmPassword,
  detectInputType
} from '../../utils/validate';
import { authService } from '../../api/services';
import { toast } from 'react-hot-toast';

export type RegisterStep = 'email' | 'otp' | 'password';

export const useRegister = () => {
  const navigate = useNavigate();

  // Step control
  const [currentStep, setCurrentStep] = useState<RegisterStep>('email');

  // Form data
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI states
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Error states
  const [emailOrPhoneError, setEmailOrPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');

  // Detect input type for dynamic placeholder
  const inputType = detectInputType(emailOrPhone);

  /* ==================== STEP 1: Email/Phone ==================== */

  const handleEmailOrPhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailOrPhone(value);

    if (value) {
      const error = validateEmailOrPhone(value);
      setEmailOrPhoneError(error);
    } else {
      setEmailOrPhoneError('');
    }
  };

  const handleSendOTP = async () => {
    // Validate
    const error = validateEmailOrPhone(emailOrPhone);
    if (error) {
      setEmailOrPhoneError(error);
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API gửi OTP
      await authService.sendOTP({ login: emailOrPhone.trim() });

      toast.success('Mã xác thực đã được gửi!');

      // Chuyển sang step 2
      setCurrentStep('otp');

      // Start countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      toast.error(error.message || 'Gửi mã xác thực thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailOrPhoneValid = emailOrPhone && !validateEmailOrPhone(emailOrPhone);

  /* ==================== STEP 2: OTP Verification ==================== */

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Chỉ cho phép số
    if (value.length <= 6) {
      setVerificationCode(value);

      if (value) {
        const error = validateVerificationCode(value);
        setOtpError(error);
      } else {
        setOtpError('');
      }
    }
  };

  const handleVerifyOTP = async () => {
    // Validate OTP
    const error = validateVerificationCode(verificationCode);
    if (error) {
      setOtpError(error);
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await authService.verifyEmail({
        login: emailOrPhone.trim(),
        otp: String(verificationCode)
      });

      if (!isValid) {
        toast.error('Mã xác thực không đúng');
        return;
      }

      toast.success('Xác thực thành công!');

      setCurrentStep('password');

    } catch (error: any) {
      toast.error(error.message || 'Mã xác thực không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);

    try {
      await authService.sendOTP({ login: emailOrPhone.trim() });

      toast.success('Mã xác thực mới đã được gửi!');

      // Reset countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      toast.error(error.message || 'Gửi lại mã thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpValid = verificationCode.length === 6 && !validateVerificationCode(verificationCode);

  /* ==================== STEP 3: Password ==================== */

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value) {
      const error = validatePassword(value);
      setPasswordError(error);
    } else {
      setPasswordError('');
    }

    // Re-validate confirm password if it exists
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(value, confirmPassword);
      setConfirmPasswordError(confirmError);
    }
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value) {
      const error = validateConfirmPassword(password, value);
      setConfirmPasswordError(error);
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleAgreedToTermsChange = (checked: boolean) => {
    setAgreedToTerms(checked);
    if (checked) setTermsError('');
  };

  const handleRegister = async () => {
    // Validate all fields
    const passError = validatePassword(password);
    const confirmPassError = validateConfirmPassword(password, confirmPassword);

    setPasswordError(passError);
    setConfirmPasswordError(confirmPassError);

    if (!agreedToTerms) {
      setTermsError('Bạn phải đồng ý với điều khoản dịch vụ');
      return;
    } else {
      setTermsError('');
    }

    if (passError || confirmPassError) return;

    setIsLoading(true);

    try {
      // ✅ Gọi API đăng ký
      const response = await authService.register({
        email: emailOrPhone.trim(),
        password: password,
        confirmPassword: confirmPassword,
        verificationCode: verificationCode,
      });

      console.log('=== REGISTER SUCCESS ===');
      console.log('User Info:', response.user_info);
      console.log('Email:', response.user_info.email);
      console.log('Roles:', response.user_info.roles);
      console.log('Permissions:', response.user_info.permissions);
      console.log('=======================');

      // ✅ Hiển thị thông báo thành công
      toast.success('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', {
        duration: 3000,
      });

      // ✅ Đợi 1.5 giây để user đọc thông báo, sau đó chuyển đến trang login
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Đăng ký thành công! Vui lòng đăng nhập.',
            email: emailOrPhone.trim(), // ✅ Truyền email để tự động điền vào form login
          }
        });
      }, 1500);

    } catch (error: any) {
      console.error('Register error:', error);
      toast.error(error.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = password && confirmPassword &&
    !validatePassword(password) &&
    !validateConfirmPassword(password, confirmPassword) &&
    agreedToTerms;

  /* ==================== UI HELPERS ==================== */

  const getPlaceholder = () => {
    if (!emailOrPhone) return 'Email hoặc số điện thoại';

    switch (inputType) {
      case 'email':
        return 'Email của bạn';
      case 'phone':
        return 'Số điện thoại của bạn';
      case 'username':
        return 'Email hoặc số điện thoại';
      default:
        return 'Email hoặc số điện thoại';
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'otp') {
      setCurrentStep('email');
      setVerificationCode('');
      setOtpError('');
    } else if (currentStep === 'password') {
      setCurrentStep('otp');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setConfirmPasswordError('');
    }
  };

  /* ==================== RETURN ==================== */

  return {
    // States
    currentStep,
    emailOrPhone,
    verificationCode,
    password,
    confirmPassword,
    agreedToTerms,
    countdown,
    isLoading,
    emailOrPhoneError,
    otpError,
    passwordError,
    confirmPasswordError,
    termsError,
    inputType,

    // Computed
    isEmailOrPhoneValid,
    isOtpValid,
    isPasswordValid,
    getPlaceholder,

    // Handlers
    handleEmailOrPhoneChange,
    handleSendOTP,
    handleOtpChange,
    handleVerifyOTP,
    handleResendOTP,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleAgreedToTermsChange,
    handleRegister,
    handleBackStep,
  };
};
