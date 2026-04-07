import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth/AuthProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';

const isValidEmail = (value: string): boolean => /\S+@\S+\.\S+/.test(value);

export default function EditEmailTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email?.trim() ?? '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmStep, setIsConfirmStep] = useState(false);

  const canSubmit = useMemo(() => {
    if (isSaving) return false;
    if (isConfirmStep) return Boolean(password.trim());

    const nextEmail = email.trim();
    return Boolean(nextEmail) && isValidEmail(nextEmail);
  }, [email, isConfirmStep, isSaving, password]);

  const handleSubmit = async () => {
    const nextEmail = email.trim();
    if (!isConfirmStep) {
      if (!nextEmail) {
        notify.error('Vui lòng nhập địa chỉ email.');
        return;
      }
      if (!isValidEmail(nextEmail)) {
        notify.error('Địa chỉ email không hợp lệ.');
        return;
      }
      setIsConfirmStep(true);
      return;
    }

    const nextPassword = password.trim();
    if (!nextPassword) {
      notify.error('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSaving(true);
    try {
      await authService.changeContact({
        email: nextEmail,
        currentPassword: nextPassword
      });
      await authService.fetchCurrentUser();
      notify.success('Cập nhật email thành công');
      setPassword('');
      setIsConfirmStep(false);
      navigate('/account');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cập nhật email thất bại';
      notify.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isSaving) return;
    setIsConfirmStep(false);
    setPassword('');
  };

  return (
    <div className="profile-contact-edit">
      <div className="profile-contact-edit__card">
        <h2 className="profile-contact-edit__title">
          {isConfirmStep ? 'Xác nhận mật khẩu' : 'Cập nhật địa chỉ email'}
        </h2>
        <p className="profile-contact-edit__subtitle">
          {isConfirmStep
            ? 'Nhập mật khẩu hiện tại để xác nhận thay đổi email.'
            : 'Nhập email bạn muốn sử dụng cho tài khoản.'}
        </p>

        <div className="profile-contact-edit__field">
          <label htmlFor={isConfirmStep ? 'profile-email-password' : 'profile-email'}>
            {isConfirmStep ? 'Mật khẩu' : 'Địa chỉ email'}
          </label>
          <input
            id={isConfirmStep ? 'profile-email-password' : 'profile-email'}
            type={isConfirmStep ? 'password' : 'email'}
            value={isConfirmStep ? password : email}
            onChange={(event) => (isConfirmStep ? setPassword(event.target.value) : setEmail(event.target.value))}
            placeholder={isConfirmStep ? 'Nhập mật khẩu để xác nhận' : 'Nhập địa chỉ email'}
            autoComplete={isConfirmStep ? 'current-password' : 'email'}
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
