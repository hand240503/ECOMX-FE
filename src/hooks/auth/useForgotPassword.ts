import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../schemas/auth.schemas';
import { ApiRequestError, authApi } from '../../services/auth.api';
import { notify } from '../../utils/notify';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError && error.message.trim().length > 0) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Gửi mã OTP thất bại. Vui lòng thử lại.';
};

export const useForgotPassword = () => {
  const navigate = useNavigate();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { login: '' },
    mode: 'onSubmit'
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const message = await authApi.requestForgotPasswordOtp({ login: values.login.trim() });
      notify.success(message);
      navigate(`/forgot-password/verify?login=${encodeURIComponent(values.login.trim())}`);
    } catch (error) {
      notify.error(getErrorMessage(error));
      if (error instanceof ApiRequestError) {
        error.fieldErrors.forEach((fieldError) => {
          if (fieldError.field === 'login') {
            form.setError('login', { message: fieldError.message });
          }
        });
      }
    }
  });

  return {
    form,
    onSubmit
  };
};
