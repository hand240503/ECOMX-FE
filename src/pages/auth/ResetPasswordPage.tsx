import LoadingLink from '../../components/LoadingLink';
import AuthCard from '../../components/auth/AuthCard';
import PasswordInput from '../../components/auth/PasswordInput';
import { Button } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useResetPassword } from '../../hooks/auth/useResetPassword';

export default function ResetPasswordPage() {
  const { form, isTokenMissing, onSubmit } = useResetPassword();
  const {
    register,
    formState: { errors, isSubmitting }
  } = form;

  const isDisabled = isSubmitting || isTokenMissing;

  return (
    <AuthCard
      title="Đặt lại mật khẩu"
      description="Nhập mật khẩu mới cho tài khoản của bạn."
      footer={
        <>
          <span>Quay về </span>
          <LoadingLink
            to="/login"
            className={cn(
              'font-semibold text-primary hover:text-primary-dark hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
            )}
          >
            trang đăng nhập
          </LoadingLink>
        </>
      }
    >
      {isTokenMissing ? (
        <div
          className={cn(
            'mb-4 rounded-md border border-warning/40 bg-warning/10 p-3 text-body text-warning'
          )}
        >
          Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token. Vui lòng yêu cầu lại từ màn Quên mật khẩu.
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <PasswordInput
          id="reset-password"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          autoComplete="new-password"
          disabled={isDisabled}
          error={errors.password}
          {...register('password')}
        />

        <PasswordInput
          id="reset-confirm-password"
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          disabled={isDisabled}
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="profilePrimary"
          fullWidth
          className="rounded-sm"
          disabled={isDisabled}
          loading={isSubmitting}
        >
          {isSubmitting ? null : 'Đổi mật khẩu'}
        </Button>
      </form>
    </AuthCard>
  );
}
