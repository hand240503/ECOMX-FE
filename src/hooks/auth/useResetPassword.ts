import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../schemas/auth.schemas';
import { ApiRequestError, authApi } from '../../services/auth.api';
import { notify } from '../../utils/notify';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError && error.message.trim().length > 0) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
};

export const useResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') ?? '').trim();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    },
    mode: 'onSubmit'
  });

  const isTokenMissing = useMemo(() => token.length === 0, [token]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isTokenMissing) return;

    try {
      const message = await authApi.resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword
      });

      notify.success(message);
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      notify.error(getErrorMessage(error));
      if (error instanceof ApiRequestError) {
        error.fieldErrors.forEach((fieldError) => {
          if (fieldError.field === 'password') {
            form.setError('password', { message: fieldError.message });
          }
          if (fieldError.field === 'confirmPassword') {
            form.setError('confirmPassword', { message: fieldError.message });
          }
        });
      }
    }
  });

  return {
    form,
    isTokenMissing,
    onSubmit
  };
};
