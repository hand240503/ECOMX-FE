import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth/AuthProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';

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
    <div className="profile-contact-edit">
      <div className="profile-contact-edit__card">
        <h2 className="profile-contact-edit__title">
          {isConfirmStep ? 'Xác nhận mật khẩu' : 'Cập nhật số điện thoại'}
        </h2>
        <p className="profile-contact-edit__subtitle">
          {isConfirmStep
            ? 'Nhập mật khẩu hiện tại để xác nhận thay đổi số điện thoại.'
            : 'Nhập số điện thoại bạn muốn sử dụng cho tài khoản.'}
        </p>

        <div className="profile-contact-edit__field">
          <label htmlFor={isConfirmStep ? 'profile-phone-password' : 'profile-phone-number'}>
            {isConfirmStep ? 'Mật khẩu' : 'Số điện thoại'}
          </label>
          <input
            id={isConfirmStep ? 'profile-phone-password' : 'profile-phone-number'}
            type={isConfirmStep ? 'password' : 'tel'}
            value={isConfirmStep ? currentPassword : phoneNumber}
            onChange={(event) => (isConfirmStep ? setCurrentPassword(event.target.value) : setPhoneNumber(event.target.value))}
            placeholder={isConfirmStep ? 'Nhập mật khẩu để xác nhận' : 'Nhập số điện thoại'}
            autoComplete={isConfirmStep ? 'current-password' : 'tel'}
          />
        </div>

        <div className="profile-contact-edit__actions">
          {isConfirmStep ? (
            <button
              type="button"
              className="profile-contact-edit__btn profile-contact-edit__btn--ghost"
              onClick={handleBack}
              disabled={isSaving}
            >
              Quay lại
            </button>
          ) : null}
          <button
            type="button"
            className="profile-contact-edit__btn profile-contact-edit__btn--primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSaving ? 'Đang lưu...' : isConfirmStep ? 'Xác nhận' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
