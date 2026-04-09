import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyForgotOtpSchema, type VerifyForgotOtpFormValues } from '../../schemas/auth.schemas';
import { ApiRequestError, authApi } from '../../services/auth.api';
import { notify } from '../../utils/notify';

const RESEND_SECONDS = 60;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError && error.message.trim().length > 0) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Xác thực OTP thất bại. Vui lòng thử lại.';
};

const maskLogin = (value: string): string => {
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    if (!name || !domain) return value;
    const visible = name.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(0, name.length - 2))}@${domain}`;
  }

  if (value.length < 4) return value;
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
};

export const useVerifyForgotOtp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = (searchParams.get('login') ?? '').trim();
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const form = useForm<VerifyForgotOtpFormValues>({
    resolver: zodResolver(verifyForgotOtpSchema),
    defaultValues: { otp: '' },
    mode: 'onSubmit'
  });

  useEffect(() => {
    if (!login) {
      notify.error('Không tìm thấy thông tin tài khoản. Vui lòng nhập lại.');
      navigate('/forgot-password', { replace: true });
    }
  }, [login, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (!isVerified) return;
    const timer = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isVerified, navigate]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!login) return;
    setIsVerifyingOtp(true);
    try {
      const message = await authApi.verifyForgotPasswordOtp({
        login,
        otp: values.otp.trim()
      });
      notify.success(message);
      setIsVerified(true);
    } catch (error) {
      notify.error(getErrorMessage(error));
      if (error instanceof ApiRequestError) {
        error.fieldErrors.forEach((fieldError) => {
          if (fieldError.field === 'otp') {
            form.setError('otp', { message: fieldError.message });
          }
        });
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  });

  const resendOtp = useCallback(async () => {
    if (!login || countdown > 0) return;
    try {
      const message = await authApi.requestForgotPasswordOtp({ login });
      notify.success(message);
      setCountdown(RESEND_SECONDS);
    } catch (error) {
      notify.error(getErrorMessage(error));
    }
  }, [countdown, login]);

  const maskedLogin = useMemo(() => maskLogin(login), [login]);

  return {
    form,
    login,
    maskedLogin,
    countdown,
    isVerified,
    isVerifyingOtp,
    onSubmit,
    resendOtp
  };
};
