import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService } from '../api/services';
import {
  detectInputType,
  validateConfirmPassword,
  validateEmailOrPhone,
  validatePassword,
  validateVerificationCode
} from '../utils/validate';

export type RegisterStep = 'email' | 'otp' | 'password';

export const useRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegisterStep>('email');

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [emailOrPhoneError, setEmailOrPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');

  const inputType = detectInputType(emailOrPhone);

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
    const error = validateEmailOrPhone(emailOrPhone);
    if (error) {
      setEmailOrPhoneError(error);
      return;
    }
    setIsLoading(true);
    try {
      await authService.sendOTP({ login: emailOrPhone.trim() });
      toast.success('Ma xac thuc da duoc gui!');
      setCurrentStep('otp');
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
      toast.error(error.message || 'Gui ma xac thuc that bai');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailOrPhoneValid = emailOrPhone && !validateEmailOrPhone(emailOrPhone);

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
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
        toast.error('Ma xac thuc khong dung');
        return;
      }

      toast.success('Xac thuc thanh cong!');
      setCurrentStep('password');
    } catch (error: any) {
      toast.error(error.message || 'Ma xac thuc khong dung');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await authService.sendOTP({ login: emailOrPhone.trim() });
      toast.success('Ma xac thuc moi da duoc gui!');
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
      toast.error(error.message || 'Gui lai ma that bai');
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpValid = verificationCode.length === 6 && !validateVerificationCode(verificationCode);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      const error = validatePassword(value);
      setPasswordError(error);
    } else {
      setPasswordError('');
    }
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
    const passError = validatePassword(password);
    const confirmPassError = validateConfirmPassword(password, confirmPassword);
    setPasswordError(passError);
    setConfirmPasswordError(confirmPassError);

    if (!agreedToTerms) {
      setTermsError('Ban phai dong y voi dieu khoan dich vu');
      return;
    } else {
      setTermsError('');
    }

    if (passError || confirmPassError) return;
    setIsLoading(true);
    try {
      await authService.register({
        email: emailOrPhone.trim(),
        password,
        confirmPassword,
        verificationCode
      });

      toast.success('Dang ky thanh cong! Vui long dang nhap de tiep tuc.', {
        duration: 3000
      });

      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Dang ky thanh cong! Vui long dang nhap.',
            email: emailOrPhone.trim()
          }
        });
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Dang ky that bai');
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid =
    password &&
    confirmPassword &&
    !validatePassword(password) &&
    !validateConfirmPassword(password, confirmPassword) &&
    agreedToTerms;

  const getPlaceholder = () => {
    if (!emailOrPhone) return 'Email hoac so dien thoai';
    switch (inputType) {
      case 'email':
        return 'Email cua ban';
      case 'phone':
        return 'So dien thoai cua ban';
      case 'username':
        return 'Email hoac so dien thoai';
      default:
        return 'Email hoac so dien thoai';
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

  return {
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
    isEmailOrPhoneValid,
    isOtpValid,
    isPasswordValid,
    getPlaceholder,
    handleEmailOrPhoneChange,
    handleSendOTP,
    handleOtpChange,
    handleVerifyOTP,
    handleResendOTP,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleAgreedToTermsChange,
    handleRegister,
    handleBackStep
  };
};
