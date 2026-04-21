import LoadingLink from '../../components/LoadingLink';
import AuthCard from '../../components/auth/AuthCard';
import FormInput from '../../components/auth/FormInput';
import { Button } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useForgotPassword } from '../../hooks/auth/useForgotPassword';

export default function ForgotPasswordPage() {
  const { form, onSubmit } = useForgotPassword();
  const {
    register,
    formState: { errors, isSubmitting }
  } = form;

  return (
    <AuthCard
      title="Quên mật khẩu"
      description="Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP."
      footer={
        <>
          <span>Đã nhớ mật khẩu? </span>
          <LoadingLink
            to="/login"
            className={cn(
              'font-semibold text-primary hover:text-primary-dark hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
            )}
          >
            Đăng nhập
          </LoadingLink>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormInput
          id="forgot-login"
          label="Email hoặc số điện thoại"
          placeholder="Nhập email hoặc số điện thoại"
          autoComplete="username"
          disabled={isSubmitting}
          error={errors.login}
          {...register('login')}
        />

        <Button
          type="submit"
          variant="profilePrimary"
          fullWidth
          className="rounded-sm"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? null : 'Gửi mã OTP'}
        </Button>
      </form>
    </AuthCard>
  );
}
