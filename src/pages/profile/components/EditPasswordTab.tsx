import { useMemo, useState } from 'react';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { Button } from '../../../components/ui';
import { authInputClass } from '../../../lib/authFormClasses';
import { cn } from '../../../lib/cn';

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  show,
  onToggle,
  hideLabel,
  showLabel
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  show: boolean;
  onToggle: () => void;
  hideLabel: string;
  showLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:gap-4">
      <label htmlFor={id} className="mb-0 block text-caption font-semibold text-text-primary tablet:w-[160px] tablet:shrink-0">
        {label}
      </label>
      <div className="relative min-w-0 flex-1 tablet:max-w-[320px]">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(authInputClass(), 'pr-12')}
        />
        <button
          type="button"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
          )}
          aria-label={show ? hideLabel : showLabel}
          onClick={onToggle}
        >
          <span className="relative inline-flex">
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
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
            {!show ? (
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-[-35deg] rounded-full bg-current"
                aria-hidden
              />
            ) : null}
          </span>
        </button>
      </div>
    </div>
  );
}

function TipsCard() {
  const { t } = useI18n();
  const tips = ['profile_password_tip_1', 'profile_password_tip_2', 'profile_password_tip_3'] as const;

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface p-4 shadow-elevation-card',
        'tablet:p-5'
      )}
    >
      <h2 className="text-heading text-text-primary">{t('profile_password_security_notes')}</h2>
      <ul className="mt-3 list-none space-y-3 p-0">
        {tips.map((key) => (
          <li key={key} className="flex gap-2.5 text-body text-text-primary">
            <span
              className={cn(
                'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                'bg-primary-light text-caption font-bold text-primary'
              )}
              aria-hidden
            >
              !
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EditPasswordTab() {
  const { t } = useI18n();
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
      notify.error(t('profile_error_fill_all_password'));
      return;
    }

    if (!isNewPasswordValid) {
      notify.error(t('profile_error_new_password_rules'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      notify.error(t('profile_error_password_mismatch'));
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmNewPassword.trim()
      });
      notify.success(t('profile_notify_password_changed'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      navigate('/account');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('profile_error_password_change_failed');
      notify.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5',
        'desktop:grid-cols-[minmax(0,6fr)_1px_minmax(0,4fr)] desktop:items-start desktop:gap-7'
      )}
    >
      <section className="min-w-0">
        <div
          className={cn(
            'rounded-md border border-border bg-surface p-4 shadow-elevation-card',
            'tablet:p-5'
          )}
        >
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <PasswordField
              id="current-password"
              label={t('profile_label_current_password')}
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder={t('profile_placeholder_current_password')}
              autoComplete="current-password"
              show={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((p) => !p)}
              hideLabel={t('profile_aria_hide_current_password')}
              showLabel={t('profile_aria_show_current_password')}
            />
            <PasswordField
              id="new-password"
              label={t('profile_label_new_password')}
              value={newPassword}
              onChange={setNewPassword}
              placeholder={t('profile_placeholder_new_password')}
              autoComplete="new-password"
              show={showNewPassword}
              onToggle={() => setShowNewPassword((p) => !p)}
              hideLabel={t('profile_aria_hide_new_password')}
              showLabel={t('profile_aria_show_new_password')}
            />
            <PasswordField
              id="confirm-new-password"
              label={t('profile_label_confirm_new_password')}
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder={t('profile_placeholder_confirm_new_password')}
              autoComplete="new-password"
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((p) => !p)}
              hideLabel={t('profile_aria_hide_confirm_password')}
              showLabel={t('profile_aria_show_confirm_password')}
            />

            <Button
              type="button"
              variant="profilePrimary"
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={isSaving}
              className={cn('mt-2 rounded-sm', 'w-full tablet:ml-[calc(160px+1rem)] tablet:w-auto tablet:min-w-[180px]')}
            >
              {isSaving ? null : t('profile_btn_save_changes')}
            </Button>
          </form>
        </div>
      </section>

      <div
        className={cn('h-px w-full bg-border desktop:h-auto desktop:min-h-[16rem] desktop:w-px desktop:self-stretch')}
        aria-hidden
      />

      <section className="min-w-0">
        <TipsCard />
      </section>
    </div>
  );
}
