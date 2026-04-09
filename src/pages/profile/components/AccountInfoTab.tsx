import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth/AuthProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import phoneIcon from '../../../assets/icon/phone.png';
import emailIcon from '../../../assets/icon/email.png';
import lockIcon from '../../../assets/icon/lock.png';
import securityIcon from '../../../assets/icon/security.jpg';
import trashIcon from '../../../assets/icon/trash.svg';
import facebookIcon from '../../../assets/icon/facebook.png';
import googleIcon from '../../../assets/icon/google.png';
const AccountInfoTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const derivedFullName = useMemo(() => {
    return user?.userInfo?.fullName?.trim() || '';
  }, [user?.userInfo?.fullName]);

  const derivedUserName = useMemo(() => user?.username?.trim() ?? '', [user?.username]);
  const derivedDisplayName = useMemo(() => user?.userInfo?.info04?.trim() ?? '', [user?.userInfo?.info04]);

  const phone = user?.phoneNumber || '';
  const email = user?.email || '';
  const avatarUrl = user?.userInfo?.avatar || '';

  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [nationality, setNationality] = useState('');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(derivedFullName);
    setUserName(derivedUserName);
    setDisplayName(derivedDisplayName);
    const dobRaw = user?.userInfo?.info01?.trim() ?? '';
    if (dobRaw) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobRaw);
      if (match) {
        setBirthYear(match[1]);
        setBirthMonth(String(Number(match[2])));
        setBirthDay(String(Number(match[3])));
      }
    }

    const g = user?.userInfo?.info02?.trim() ?? '';
    if (g === 'male' || g === 'female' || g === 'other') {
      setGender(g);
    }

    setNationality(user?.userInfo?.info03?.trim() ?? '');
  }, [
    derivedDisplayName,
    derivedFullName,
    derivedUserName,
    avatarUrl,
    user?.userInfo?.info01,
    user?.userInfo?.info02,
    user?.userInfo?.info03
  ]);

  useEffect(() => {
    if (!selectedAvatarFile) {
      setAvatarPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(selectedAvatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedAvatarFile]);

  const displayedAvatarUrl = avatarPreviewUrl || avatarUrl;

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Vui lòng chọn tệp hình ảnh hợp lệ');
      event.target.value = '';
      return;
    }

    setSelectedAvatarFile(file);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const dateOfBirth =
        birthYear && birthMonth && birthDay
          ? `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
          : undefined;

      if (!user?.id) {
        throw new Error('Không tìm thấy id người dùng.');
      }

      await authService.updateProfile({
        id: user.id,
        fullName,
        info01: dateOfBirth ?? null,
        info02: (gender || null) as string | null,
        info03: nationality || null,
        info04: displayName || null,
        avatarFile: selectedAvatarFile
      });

      notify.success('Cập nhật thông tin thành công');
      setSelectedAvatarFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu thay đổi thất bại.';
      notify.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="account-info-tab">
      <section className="account-info-tab__left">
        <h2 className="account-info-tab__section-title">Thông tin cá nhân</h2>

        <form className="account-info-tab__form">
          <div className="account-info-tab__identity-row">
            <div className="account-info-tab__avatar-wrap">
              {displayedAvatarUrl ? (
                <img src={displayedAvatarUrl} alt={fullName || 'Avatar'} className="account-info-tab__avatar" />
              ) : (
                <div className="account-info-tab__avatar account-info-tab__avatar--placeholder">
                  <svg viewBox="0 0 24 24" fill="none" className="account-info-tab__avatar-icon">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <button
                type="button"
                className="account-info-tab__avatar-edit"
                aria-label="Đổi ảnh đại diện"
                onClick={() => avatarInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 15.5V20h4.5l9.7-9.7-4.5-4.5L4 15.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="m12.8 6.2 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="account-info-tab__identity-fields">
              <div className="account-info-tab__field account-info-tab__field--row">
                <label htmlFor="account-full-name">Họ và Tên</label>
                <input
                  id="account-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="account-info-tab__field account-info-tab__field--row account-info-tab__field--row-with-help">
                <label htmlFor="account-user-name">Tên đăng nhập</label>
                <div className="account-info-tab__field-control">
                  <input
                    id="account-user-name"
                    type="text"
                    value={userName}
                    readOnly
                    placeholder="Nhập tên đăng nhập"
                  />
                  <p className="account-info-tab__field-help">Username chỉ có thể thay đổi một lần.</p>
                </div>
              </div>
              <div className="account-info-tab__field account-info-tab__field--row">
                <label htmlFor="account-display-name">Tên hiển thị</label>
                <div className="account-info-tab__field-control">
                  <input
                    id="account-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="account-info-tab__field account-info-tab__field--inline">
            <label htmlFor="account-birth-day">Ngày sinh</label>
            <div className="account-info-tab__birth-grid">
              <select
                id="account-birth-day"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
              >
                <option value="" disabled>
                  Ngày
                </option>
                {Array.from({ length: 31 }, (_, index) => (
                  <option key={`day-${index + 1}`} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
              <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                <option value="" disabled>
                  Tháng
                </option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={`month-${index + 1}`} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
              <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                <option value="" disabled>
                  Năm
                </option>
                {Array.from({ length: 101 }, (_, index) => {
                  const year = new Date().getFullYear() - index;
                  return (
                    <option key={`year-${year}`} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div
            className="account-info-tab__field account-info-tab__field--inline"
            role="group"
            aria-labelledby="account-gender-label"
          >
            <span id="account-gender-label" className="account-info-tab__inline-heading">
              Giới tính
            </span>
            <div className="account-info-tab__gender-group">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                />{' '}
                Nam
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                />{' '}
                Nữ
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={gender === 'other'}
                  onChange={() => setGender('other')}
                />{' '}
                Khác
              </label>
            </div>
          </div>

          <div className="account-info-tab__field account-info-tab__field--inline">
            <label htmlFor="account-country">Quốc tịch</label>
            <select
              id="account-country"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            >
              <option value="" disabled>
                Chọn quốc tịch
              </option>
              <option value="vn">Việt Nam</option>
              <option value="us">United States</option>
              <option value="jp">Japan</option>
              <option value="kr">Korea</option>
            </select>
          </div>

          <button
            type="button"
            className="account-info-tab__save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </section>

      <div className="account-info-tab__divider" />

      <section className="account-info-tab__right">
        <h2 className="account-info-tab__section-title">Số điện thoại và Email</h2>

        <div className="account-info-tab__contact-group">
          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <img
                className="account-info-tab__contact-icon"
                src={phoneIcon}
                alt="phone icon"
                aria-hidden="true"
              />
              <div>
                <p className="account-info-tab__contact-label">Số điện thoại</p>
                <p className="account-info-tab__contact-value">{phone || 'Thêm số điện thoại'}</p>
              </div>
            </div>
            <button
              type="button"
              className="account-info-tab__outline-btn"
              onClick={() => navigate('/account/edit/phone')}
            >
              Cập nhật
            </button>
          </div>

          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <img
                className="account-info-tab__contact-icon"
                src={emailIcon}
                alt="email icon"
                aria-hidden="true"
              />
              <div>
                <p className="account-info-tab__contact-label">Địa chỉ email</p>
                <p className="account-info-tab__contact-value">{email || 'Thêm địa chỉ email'}</p>
              </div>
            </div>
            <button
              type="button"
              className="account-info-tab__outline-btn"
              onClick={() => navigate('/account/edit/email')}
            >
              Cập nhật
            </button>
          </div>
        </div>

        <div className="account-info-tab__contact-group">
          <h3 className="account-info-tab__group-title">Bảo mật</h3>
          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <img
                className="account-info-tab__contact-icon"
                src={lockIcon}
                alt="email icon"
                aria-hidden="true"
              />
              <p className="account-info-tab__contact-label">Thiết lập mật khẩu</p>
            </div>
            <button
              type="button"
              className="account-info-tab__outline-btn"
              onClick={() => navigate('/account/edit/pass')}
            >
              Cập nhật
            </button>
          </div>
          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <img
                className="account-info-tab__contact-icon"
                src={securityIcon}
                alt="security icon"
                aria-hidden="true"
              />
              <p className="account-info-tab__contact-label">Quên mật khẩu</p>
            </div>
            <button
              type="button"
              className="account-info-tab__outline-btn"
              onClick={() => navigate('/forgot-password')}
            >
              Khôi phục
            </button>
          </div>
          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <img
                className="account-info-tab__contact-icon"
                src={trashIcon}
                alt="trash icon"
                aria-hidden="true"
              />
              <p className="account-info-tab__contact-label">Yêu cầu xóa tài khoản</p>
            </div>
            <button type="button" className="account-info-tab__outline-btn">
              Yêu cầu
            </button>
          </div>
        </div>

        <div className="account-info-tab__contact-group">
          <h3 className="account-info-tab__group-title">Liên kết mạng xã hội</h3>
          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <img
                className="account-info-tab__contact-icon"
                src={facebookIcon}
                alt="facebook icon"
                aria-hidden="true"
              />
              <p className="account-info-tab__contact-label">Facebook</p>
            </div>
            <button type="button" className="account-info-tab__outline-btn">
              Liên kết
            </button>
          </div>
          <div className="account-info-tab__contact-row">
            <div className="account-info-tab__contact-info">
              <img
                className="account-info-tab__contact-icon"
                src={googleIcon}
                alt="google icon"
                aria-hidden="true"
              />
              <p className="account-info-tab__contact-label">Google</p>
            </div>
            <button type="button" className="account-info-tab__outline-btn">
              Liên kết
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
export default AccountInfoTab;
