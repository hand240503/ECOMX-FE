import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { useAuth } from '../../../app/auth/AuthProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { Button } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import phoneIcon from '../../../assets/icon/phone.png';
import emailIcon from '../../../assets/icon/email.png';
import lockIcon from '../../../assets/icon/lock.png';
import securityIcon from '../../../assets/icon/security.jpg';
import trashIcon from '../../../assets/icon/trash.svg';
import facebookIcon from '../../../assets/icon/facebook.png';
import googleIcon from '../../../assets/icon/google.png';

const inputBase = cn(
  'h-10 w-full min-w-0 rounded-sm border border-border bg-surface px-3 text-body text-text-primary',
  'placeholder:text-text-secondary',
  'transition-all duration-200 ease-in-out',
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
);

const labelBase = cn('mb-2 block text-caption text-text-secondary tablet:mb-0');

function ProfileCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface p-4 shadow-elevation-card tablet:p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

function ContactBlock({
  icon,
  title,
  value,
  actionLabel,
  onAction
}: {
  icon: string;
  title: string;
  value?: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={icon}
          alt=""
          className="size-7 shrink-0 rounded-full bg-background object-cover"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="m-0 text-body font-medium text-text-primary">{title}</p>
          {value !== undefined ? (
            <p className="m-0 truncate text-body text-text-secondary">{value}</p>
          ) : null}
        </div>
      </div>
      <Button
        type="button"
        variant="profileOutline"
        size="sm"
        className="shrink-0 px-3"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function ContactBlockSimple({
  icon,
  label,
  actionLabel,
  onAction
}: {
  icon: string;
  label: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={icon}
          alt=""
          className="size-7 shrink-0 rounded-full bg-background object-cover"
          aria-hidden
        />
        <p className="m-0 text-body text-text-primary">{label}</p>
      </div>
      <Button
        type="button"
        variant="profileOutline"
        size="sm"
        className="shrink-0 px-3"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

const AccountInfoTab = () => {
  const { t } = useI18n();
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
      notify.error(t('profile_notify_image_invalid'));
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
        throw new Error(t('profile_error_user_id'));
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

      notify.success(t('profile_notify_profile_saved'));
      setSelectedAvatarFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile_error_save_failed');
      notify.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectClass = cn(inputBase, 'cursor-pointer');

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5',
        'desktop:grid-cols-[minmax(0,6fr)_1px_minmax(0,4fr)] desktop:items-start desktop:gap-7'
      )}
    >
      <section className="min-w-0 space-y-3">
        <h2 className="text-heading text-text-primary">{t('profile_section_personal')}</h2>

        <ProfileCard className="max-w-xl">
          <form className="space-y-4">
            <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:gap-6">
              <div className="relative mx-auto shrink-0 tablet:mx-0">
                {displayedAvatarUrl ? (
                  <img
                    src={displayedAvatarUrl}
                    alt={fullName || t('profile_avatar_alt')}
                    className="size-28 rounded-full border-[3px] border-primary-light object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      'flex size-28 items-center justify-center rounded-full border-[3px] border-primary-light',
                      'bg-primary-light text-primary'
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="size-14">
                      <path
                        d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarFileChange}
                />
                <button
                  type="button"
                  className={cn(
                    'absolute bottom-1 right-1 flex size-[30px] items-center justify-center rounded-full',
                    'border border-border bg-surface text-text-secondary shadow-sm',
                    'transition-all duration-200 hover:text-text-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
                  )}
                  aria-label={t('profile_avatar_change_aria')}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                    <path
                      d="M4 15.5V20h4.5l9.7-9.7-4.5-4.5L4 15.5Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path d="m12.8 6.2 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3.5">
                <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-4">
                  <label htmlFor="account-full-name" className={cn(labelBase, 'tablet:w-[118px] tablet:shrink-0')}>
                    {t('profile_label_full_name')}
                  </label>
                  <input
                    id="account-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('profile_placeholder_full_name')}
                    className={cn(inputBase, 'tablet:max-w-[260px]')}
                  />
                </div>

                <div className="flex flex-col gap-2 tablet:flex-row tablet:items-start tablet:gap-4">
                  <label htmlFor="account-user-name" className={cn(labelBase, 'tablet:w-[118px] tablet:shrink-0 tablet:pt-2.5')}>
                    {t('profile_label_username')}
                  </label>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 tablet:max-w-[260px]">
                    <input
                      id="account-user-name"
                      type="text"
                      value={userName}
                      readOnly
                      placeholder={t('profile_placeholder_username')}
                      className={cn(inputBase, 'bg-background text-text-secondary')}
                    />
                    <p className="m-0 text-caption text-text-secondary">{t('profile_hint_username_once')}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-4">
                  <label htmlFor="account-display-name" className={cn(labelBase, 'tablet:w-[118px] tablet:shrink-0')}>
                    {t('profile_label_display_name')}
                  </label>
                  <input
                    id="account-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('profile_placeholder_display_name')}
                    className={cn(inputBase, 'tablet:max-w-[260px]')}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-4">
              <label htmlFor="account-birth-day" className={cn(labelBase, 'tablet:w-[118px] tablet:shrink-0')}>
                {t('profile_label_birthday')}
              </label>
              <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 tablet:max-w-none">
                <select
                  id="account-birth-day"
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    {t('profile_select_day')}
                  </option>
                  {Array.from({ length: 31 }, (_, index) => (
                    <option key={`day-${index + 1}`} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={selectClass}>
                  <option value="" disabled>
                    {t('profile_select_month')}
                  </option>
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={`month-${index + 1}`} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
                <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={selectClass}>
                  <option value="" disabled>
                    {t('profile_select_year')}
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
              className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-4"
              role="group"
              aria-labelledby="account-gender-label"
            >
              <span id="account-gender-label" className={cn(labelBase, 'tablet:w-[118px] tablet:shrink-0')}>
                {t('profile_label_gender')}
              </span>
              <div className="flex flex-wrap items-center gap-4 tablet:gap-6">
                <label className="inline-flex cursor-pointer items-center gap-2 text-body text-text-primary">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={() => setGender('male')}
                    className="size-4 accent-primary"
                  />
                  {t('profile_gender_male')}
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-body text-text-primary">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={() => setGender('female')}
                    className="size-4 accent-primary"
                  />
                  {t('profile_gender_female')}
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-body text-text-primary">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={gender === 'other'}
                    onChange={() => setGender('other')}
                    className="size-4 accent-primary"
                  />
                  {t('profile_gender_other')}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-4">
              <label htmlFor="account-country" className={cn(labelBase, 'tablet:w-[118px] tablet:shrink-0')}>
                {t('profile_label_nationality')}
              </label>
              <select
                id="account-country"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className={cn(selectClass, 'tablet:max-w-[260px]')}
              >
                <option value="" disabled>
                  {t('profile_nationality_placeholder')}
                </option>
                <option value="vn">{t('profile_country_vn')}</option>
                <option value="us">{t('profile_country_us')}</option>
                <option value="jp">{t('profile_country_jp')}</option>
                <option value="kr">{t('profile_country_kr')}</option>
              </select>
            </div>

            <Button
              type="button"
              variant="profilePrimary"
              loading={isSaving}
              onClick={handleSave}
              className="mt-2 w-full tablet:ml-[calc(118px+1rem)] tablet:w-auto tablet:min-w-[180px]"
            >
              {isSaving ? null : t('profile_btn_save_changes')}
            </Button>
          </form>
        </ProfileCard>
      </section>

      <div
        className={cn(
          'h-px w-full bg-border desktop:h-auto desktop:min-h-[20rem] desktop:w-px desktop:self-stretch'
        )}
        aria-hidden
      />

      <section className="min-w-0 space-y-4">
        <h2 className="text-heading text-text-primary">{t('profile_section_phone_email')}</h2>

        <ProfileCard>
          <ContactBlock
            icon={phoneIcon}
            title={t('profile_label_phone')}
            value={phone || t('profile_value_add_phone')}
            actionLabel={t('profile_btn_update')}
            onAction={() => navigate('/account/edit/phone')}
          />
          <ContactBlock
            icon={emailIcon}
            title={t('profile_label_email')}
            value={email || t('profile_value_add_email')}
            actionLabel={t('profile_btn_update')}
            onAction={() => navigate('/account/edit/email')}
          />
        </ProfileCard>

        <ProfileCard>
          <h3 className="mb-3 mt-0 text-title text-text-secondary">{t('profile_section_security')}</h3>
          <ContactBlockSimple
            icon={lockIcon}
            label={t('profile_label_set_password')}
            actionLabel={t('profile_btn_update')}
            onAction={() => navigate('/account/edit/pass')}
          />
          <ContactBlockSimple
            icon={securityIcon}
            label={t('profile_label_forgot_password_link')}
            actionLabel={t('profile_btn_restore')}
            onAction={() => navigate('/forgot-password')}
          />
          <ContactBlockSimple
            icon={trashIcon}
            label={t('profile_label_delete_account')}
            actionLabel={t('profile_btn_request')}
          />
        </ProfileCard>

        <ProfileCard>
          <h3 className="mb-3 mt-0 text-title text-text-secondary">{t('profile_section_social')}</h3>
          <ContactBlockSimple icon={facebookIcon} label={t('profile_link_facebook')} actionLabel={t('profile_link_connect')} />
          <ContactBlockSimple icon={googleIcon} label={t('profile_link_google')} actionLabel={t('profile_link_connect')} />
        </ProfileCard>
      </section>
    </div>
  );
};

export default AccountInfoTab;
