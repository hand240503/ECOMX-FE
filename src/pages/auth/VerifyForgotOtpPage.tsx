import LoadingLink from '../../components/LoadingLink';
import AuthCard from '../../components/auth/AuthCard';
import OtpInput from '../../components/auth/OtpInput';
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
        <LoadingLink to="/forgot-password" className="text-rose-500 hover:text-rose-600 font-semibold hover:underline">
          Quay lại bước nhập tài khoản
        </LoadingLink>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Mã OTP đã được gửi đến: <span className="font-semibold text-slate-800">{maskedLogin || 'N/A'}</span>
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

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={resendOtp}
            disabled={countdown > 0 || isLoading || isVerified || !login}
            className="text-rose-500 hover:text-rose-600 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `Gửi lại OTP sau ${countdown}s` : 'Gửi lại OTP'}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || isVerified || !login}
          className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-base py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Đang xác thực...
            </>
          ) : (
            'Xác thực OTP'
          )}
        </button>
      </form>

      {isVerified ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Đã gửi link reset mật khẩu qua email. Vui lòng kiểm tra hộp thư và mở liên kết để đặt lại mật khẩu.
        </div>
      ) : null}
    </AuthCard>
  );
}
