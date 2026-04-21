import LoadingLink from '../../components/LoadingLink';
import AuthCard from '../../components/auth/AuthCard';
import OtpInput from '../../components/auth/OtpInput';
import { Button } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useVerifyForgotOtp } from '../../hooks/auth/useVerifyForgotOtp';

export default function VerifyForgotOtpPage() {
  const { form, login, maskedLogin, countdown, isVerified, isVerifyingOtp, onSubmit, resendOtp } = useVerifyForgotOtp();
  const {
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = form;
  const isLoading = isSubmitting || isVerifyingOtp;
  const otp = watch('otp') ?? '';

  return (
    <AuthCard
      title="Xác thực OTP"
      description="Nhập mã OTP gồm 6 chữ số vừa nhận để xác minh yêu cầu quên mật khẩu."
      footer={
        <LoadingLink
          to="/forgot-password"
          className={cn(
            'font-semibold text-primary hover:text-primary-dark hover:underline',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
          )}
        >
          Quay lại bước nhập tài khoản
        </LoadingLink>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="rounded-md border border-border bg-background p-3 text-body text-text-secondary">
          Mã OTP đã được gửi đến:{' '}
          <span className="font-semibold text-text-primary">{maskedLogin || 'N/A'}</span>
        </div>

        <OtpInput
          value={otp}
          onChange={(value) =>
            setValue('otp', value, {
              shouldValidate: true
            })
          }
          disabled={isLoading || isVerified}
          error={errors.otp?.message}
        />

        <div className="flex items-center justify-between text-body">
          <button
            type="button"
            onClick={resendOtp}
            disabled={countdown > 0 || isLoading || isVerified || !login}
            className={cn(
              'font-semibold text-primary transition-colors hover:text-primary-dark',
              'disabled:cursor-not-allowed disabled:text-text-disabled',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
            )}
          >
            {countdown > 0 ? `Gửi lại OTP sau ${countdown}s` : 'Gửi lại OTP'}
          </button>
        </div>

        <Button
          type="submit"
          variant="profilePrimary"
          fullWidth
          className="rounded-sm"
          disabled={isLoading || isVerified || !login}
          loading={isLoading}
        >
          {isLoading ? null : 'Xác thực OTP'}
        </Button>
      </form>

      {isVerified ? (
        <div
          className={cn(
            'mt-4 rounded-md border border-success/30 bg-success/10 p-3 text-body text-success'
          )}
        >
          Đã gửi link reset mật khẩu qua email. Vui lòng kiểm tra hộp thư và mở liên kết để đặt lại mật khẩu.
        </div>
      ) : null}
    </AuthCard>
  );
}
