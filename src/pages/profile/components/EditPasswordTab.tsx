import { useMemo, useState } from 'react';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { useNavigate } from 'react-router-dom';

export default function EditPasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const isNewPasswordValid = useMemo(() => {
    const trimmed = newPassword.trim();
    if (trimmed.length < 8 || trimmed.length > 32) return false;
    const hasLetter = /[A-Za-z]/.test(trimmed);
    const hasNumber = /\d/.test(trimmed);
    return hasLetter && hasNumber;
  }, [newPassword]);

  const canSubmit = useMemo(() => {
    if (isSaving) return false;
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) return false;
    if (!isNewPasswordValid) return false;
    return newPassword === confirmNewPassword;
  }, [confirmNewPassword, currentPassword, isNewPasswordValid, isSaving, newPassword]);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      notify.error('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (!isNewPasswordValid) {
      notify.error('Mật khẩu mới phải dài 8 đến 32 ký tự, bao gồm chữ và số.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      notify.error('Mật khẩu mới không khớp.');
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmNewPassword.trim()
      });
      notify.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      navigate('/account');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Đổi mật khẩu thất bại';
      notify.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="account-info-tab">
      <section className="account-info-tab__left">

        <div className="account-info-tab__form account-info-tab__form--card">
          <div className="account-info-tab__field account-info-tab__field--row">
            <label htmlFor="current-password">Mật khẩu hiện tại</label>
            <div className="account-info-tab__password-input">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={`account-info-tab__password-toggle ${showCurrentPassword ? '' : 'account-info-tab__password-toggle--hidden'}`}
                aria-label={showCurrentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                onClick={() => setShowCurrentPassword((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2.2 12s3.6-7 9.8-7 9.8 7 9.8 7-3.6 7-9.8 7-9.8-7-9.8-7Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="account-info-tab__field account-info-tab__field--row">
            <label htmlFor="new-password">Mật khẩu mới</label>
            <div className="account-info-tab__password-input">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={`account-info-tab__password-toggle ${showNewPassword ? '' : 'account-info-tab__password-toggle--hidden'}`}
                aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2.2 12s3.6-7 9.8-7 9.8 7 9.8 7-3.6 7-9.8 7-9.8-7-9.8-7Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="account-info-tab__field account-info-tab__field--row">
            <label htmlFor="confirm-new-password">Nhập lại mật khẩu mới</label>
            <div className="account-info-tab__password-input">
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={`account-info-tab__password-toggle ${showConfirmPassword ? '' : 'account-info-tab__password-toggle--hidden'}`}
                aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2.2 12s3.6-7 9.8-7 9.8 7 9.8 7-3.6 7-9.8 7-9.8-7-9.8-7Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="button"
            className="account-info-tab__save-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </section>

      <div className="account-info-tab__divider" />

      <section className="account-info-tab__right">
        <h2 className="account-info-tab__section-title">Lưu ý bảo mật</h2>

        <div className="account-info-tab__contact-group">
          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <span className="account-info-tab__contact-icon" aria-hidden="true">
                !
              </span>
              <p className="account-info-tab__contact-label">Không dùng lại mật khẩu cũ đã từng sử dụng.</p>
            </div>
          </div>

          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <span className="account-info-tab__contact-icon" aria-hidden="true">
                !
              </span>
              <p className="account-info-tab__contact-label">Ưu tiên mật khẩu có chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            </div>
          </div>

          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <span className="account-info-tab__contact-icon" aria-hidden="true">
                !
              </span>
              <p className="account-info-tab__contact-label">Không chia sẻ mật khẩu cho bất kỳ ai để đảm bảo an toàn tài khoản.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}