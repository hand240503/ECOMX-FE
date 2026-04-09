import LoadingLink from '../../components/LoadingLink';
import AuthCard from '../../components/auth/AuthCard';
import FormInput from '../../components/auth/FormInput';
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
          <LoadingLink to="/login" className="text-rose-500 hover:text-rose-600 font-semibold hover:underline">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-base py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:active:scale-100"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP'}
        </button>
      </form>
    </AuthCard>
  );
}
