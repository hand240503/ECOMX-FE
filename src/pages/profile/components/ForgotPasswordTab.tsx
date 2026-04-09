import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';


export default function ForgotPasswordTab() {

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmStep, setIsConfirmStep] = useState(false);

  const isValidEmail = (value: string): boolean => /\S+@\S+\.\S+/.test(value);
  const isValidPassword = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed.length < 8 || trimmed.length > 32) return false;
    return /[A-Za-z]/.test(trimmed) && /\d/.test(trimmed);
  };

  const canSubmit = useMemo(() => {
    if (isSaving) return false;
    if (!isConfirmStep) return Boolean(email.trim()) && isValidEmail(email);
    return Boolean(code.trim())
      && isValidPassword(newPassword);
  }, [isConfirmStep, isSaving, email, code, newPassword]);

  const handleSubmit = async () => {
    if (!isConfirmStep) {
      const nextEmail = email.trim();
      if (!nextEmail) return notify.error('Vui lòng nhập email.');
      if (!isValidEmail(nextEmail)) return notify.error('Email không hợp lệ.');

      setIsSaving(true);
      try {
        const message = await authService.forgotPassword({ email: nextEmail });
        notify.success(message || 'Đã gửi yêu cầu khôi phục mật khẩu.');
        setIsConfirmStep(true);
      } catch (error) {
        notify.error(error instanceof Error ? error.message : 'Gửi yêu cầu thất bại.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const token = code.trim();
    const password = newPassword.trim();

    if (!token) return notify.error('Vui lòng nhập mã xác nhận.');
    if (!isValidPassword(password)) {
      return notify.error('Mật khẩu mới phải 8-32 ký tự, gồm chữ và số.');
    }

    setIsSaving(true);
    try {
      const message = await authService.resetPassword({
        token,
        newPassword: password,
        confirmPassword: password
      });
      notify.success(message || 'Đặt lại mật khẩu thành công.');
      navigate('/login');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="mx-auto w-full max-w-xl p-4">
      <div className="rounded-xl bg-white p-6 border-2">
        <h2 className="text-xl font-semibold text-gray-900">{isConfirmStep ? 'Xác nhận đặt lại mật khẩu' : 'Quên mật khẩu'}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {isConfirmStep ?
            'Vui lòng nhập mã xác nhận đã được gửi đến email hoặc số điện thoại của bạn.'
            : 'Vui lòng nhập Email hoặc số điện thoại bạn đã đăng ký để tiền hành đổi mật khẩu.'}
        </p>

        <div className="mt-2 space-y-4">
          {!isConfirmStep ? (
            <div>
              <label htmlFor="forgot-email" className='block text-sm font-medium text-gray-700'>Địa chỉ email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : (
            <>

              <div>
                <label htmlFor="forgot-code" className="block text-sm font-medium text-gray-700">
                  Mã xác nhận
                </label>
                <input
                  id="forgot-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Nhập mã xác nhận"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="forgot-password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu mới
                </label>
                <input
                  id="forgot-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

            </>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          {isConfirmStep && (
            <button
              type="button"
              onClick={() => {
                if (isSaving) return;
                setIsConfirmStep(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Quay lại
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${canSubmit ? 'bg-primary hover:bg-primary-dark' : 'cursor-not-allowed bg-gray-400'
              }`}
          >
            {isSaving ? 'Đang xử lý...' : isConfirmStep ? 'Xác nhận' : 'Gửi mã'}
          </button>
        </div>
      </div>
    </div>
  );
}