import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { Button } from '../../../components/ui';
import { authInputClass } from '../../../lib/authFormClasses';
import { cn } from '../../../lib/cn';

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
    return Boolean(code.trim()) && isValidPassword(newPassword);
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
    <div className="mx-auto w-full max-w-xl">
      <div
        className={cn(
          'rounded-md border border-border bg-surface p-5 shadow-elevation-card',
          'tablet:p-6'
        )}
      >
        <h2 className="text-heading text-text-primary">
          {isConfirmStep ? 'Xác nhận đặt lại mật khẩu' : 'Quên mật khẩu'}
        </h2>
        <p className="mt-1 text-body text-text-secondary">
          {isConfirmStep
            ? 'Vui lòng nhập mã xác nhận đã được gửi đến email hoặc số điện thoại của bạn.'
            : 'Vui lòng nhập Email hoặc số điện thoại bạn đã đăng ký để tiến hành đổi mật khẩu.'}
        </p>

        <div className="mt-5 space-y-4">
          {!isConfirmStep ? (
            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-caption font-semibold text-text-primary">
                Địa chỉ email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email"
                className={authInputClass(false, isSaving)}
              />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="forgot-code" className="mb-2 block text-caption font-semibold text-text-primary">
                  Mã xác nhận
                </label>
                <input
                  id="forgot-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Nhập mã xác nhận"
                  className={authInputClass(false, isSaving)}
                />
              </div>

              <div>
                <label htmlFor="forgot-password" className="mb-2 block text-caption font-semibold text-text-primary">
                  Mật khẩu mới
                </label>
                <input
                  id="forgot-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className={authInputClass(false, isSaving)}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isConfirmStep ? (
            <Button
              type="button"
              variant="profileGhost"
              className="rounded-sm sm:min-w-[120px]"
              onClick={() => {
                if (isSaving) return;
                setIsConfirmStep(false);
              }}
            >
              Quay lại
            </Button>
          ) : null}
          <Button
            type="button"
            variant="profilePrimary"
            className="rounded-sm sm:min-w-[140px]"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isSaving}
          >
            {isSaving ? null : isConfirmStep ? 'Xác nhận' : 'Gửi mã'}
          </Button>
        </div>
      </div>
    </div>
  );
}
