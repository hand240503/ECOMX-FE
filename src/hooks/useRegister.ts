import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { authService } from '../api/services';
import { t } from '../utils/i18n';
import { notify } from '../utils/notify';
import {
  detectInputType,
  validateConfirmPassword,
  validateEmailOrPhone,
  validatePassword,
  validateVerificationCode
} from '../utils/validate';
import { useRouteLoadingNavigation } from '../app/loading/useRouteLoadingNavigation';

export type RegisterStep = 'email' | 'otp' | 'password';

export const useRegister = () => {
  const { navigateWithLoading } = useRouteLoadingNavigation();
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
      notify.success(t('register_otp_sent'));
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
      notify.error(error.message || t('register_otp_send_failed'));
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
        notify.error(t('register_otp_invalid'));
        return;
      }

      notify.success(t('register_verify_success'));
      setCurrentStep('password');
    } catch (error: any) {
      notify.error(error.message || t('register_otp_invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await authService.sendOTP({ login: emailOrPhone.trim() });
      notify.success(t('register_otp_resent'));
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
      notify.error(error.message || t('register_otp_resend_failed'));
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
      setTermsError(t('register_terms_required'));
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

      notify.success(t('register_success_with_login_prompt'), { duration: 3000 });

      setTimeout(() => {
        navigateWithLoading('/login', {
          delayMs: 300,
          state: {
            message: t('register_success_short'),
            email: emailOrPhone.trim()
          }
        });
      }, 1500);
    } catch (error: any) {
      notify.error(error.message || t('register_failed'));
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
    if (!emailOrPhone) return t('register_placeholder_default');
    switch (inputType) {
      case 'email':
        return t('register_placeholder_email');
      case 'phone':
        return t('register_placeholder_phone');
      case 'username':
        return t('register_placeholder_default');
      default:
        return t('register_placeholder_default');
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
