import LoadingLink from '../../components/LoadingLink';
import AuthCard from '../../components/auth/AuthCard';
import PasswordInput from '../../components/auth/PasswordInput';
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
          <LoadingLink to="/login" className="text-rose-500 hover:text-rose-600 font-semibold hover:underline">
            trang đăng nhập
          </LoadingLink>
        </>
      }
    >
      {isTokenMissing ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
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

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-base py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:active:scale-100"
        >
          {isSubmitting ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </AuthCard>
  );
}
