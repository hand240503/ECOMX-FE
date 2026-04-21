import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth/AuthProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { Button } from '../../../components/ui';
import { authInputClass } from '../../../lib/authFormClasses';
import { cn } from '../../../lib/cn';

export default function EditPhoneTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber?.trim() ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmStep, setIsConfirmStep] = useState(false);

  const canSubmit = useMemo(() => {
    if (isSaving) return false;
    if (isConfirmStep) return Boolean(currentPassword.trim());
    return Boolean(phoneNumber.trim());
  }, [isConfirmStep, isSaving, currentPassword, phoneNumber]);

  const handleSubmit = async () => {
    const nextPhone = phoneNumber.trim();
    if (!isConfirmStep) {
      if (!nextPhone) {
        notify.error('Vui lòng nhập số điện thoại.');
        return;
      }
      setIsConfirmStep(true);
      return;
    }

    const nextPassword = currentPassword.trim();
    if (!nextPassword) {
      notify.error('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSaving(true);
    try {
      await authService.changeContact({
        phoneNumber: nextPhone,
        currentPassword: currentPassword
      });
      await authService.fetchCurrentUser();
      notify.success('Cập nhật số điện thoại thành công');
      setCurrentPassword('');
      setIsConfirmStep(false);
      navigate('/account');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cập nhật số điện thoại thất bại';
      notify.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isSaving) return;
    setIsConfirmStep(false);
    setCurrentPassword('');
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
          {isConfirmStep ? 'Xác nhận mật khẩu' : 'Cập nhật số điện thoại'}
        </h2>
        <p className="mt-1 text-body text-text-secondary">
          {isConfirmStep
            ? 'Nhập mật khẩu hiện tại để xác nhận thay đổi số điện thoại.'
            : 'Nhập số điện thoại bạn muốn sử dụng cho tài khoản.'}
        </p>

        <div className="mt-5">
          <label
            htmlFor={isConfirmStep ? 'profile-phone-password' : 'profile-phone-number'}
            className="mb-2 block text-caption font-semibold text-text-primary"
          >
            {isConfirmStep ? 'Mật khẩu' : 'Số điện thoại'}
          </label>
          <input
            id={isConfirmStep ? 'profile-phone-password' : 'profile-phone-number'}
            type={isConfirmStep ? 'password' : 'tel'}
            value={isConfirmStep ? currentPassword : phoneNumber}
            onChange={(event) =>
              isConfirmStep ? setCurrentPassword(event.target.value) : setPhoneNumber(event.target.value)
            }
            placeholder={isConfirmStep ? 'Nhập mật khẩu để xác nhận' : 'Nhập số điện thoại'}
            autoComplete={isConfirmStep ? 'current-password' : 'tel'}
            className={authInputClass(false, isSaving)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isConfirmStep ? (
            <Button type="button" variant="profileGhost" onClick={handleBack} disabled={isSaving} className="rounded-sm sm:min-w-[120px]">
              Quay lại
            </Button>
          ) : null}
          <Button
            type="button"
            variant="profilePrimary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isSaving}
            className="rounded-sm sm:min-w-[140px]"
          >
            {isSaving ? null : isConfirmStep ? 'Xác nhận' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
}
