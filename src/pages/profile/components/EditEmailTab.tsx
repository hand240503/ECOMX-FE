import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { useAuth } from '../../../app/auth/AuthProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { Button } from '../../../components/ui';
import { authInputClass } from '../../../lib/authFormClasses';
import { cn } from '../../../lib/cn';

const isValidEmail = (value: string): boolean => /\S+@\S+\.\S+/.test(value);

export default function EditEmailTab() {
  const { t } = useI18n();
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
        notify.error(t('profile_email_error_empty'));
        return;
      }
      if (!isValidEmail(nextEmail)) {
        notify.error(t('profile_email_error_invalid'));
        return;
      }
      setIsConfirmStep(true);
      return;
    }

    const nextPassword = password.trim();
    if (!nextPassword) {
      notify.error(t('profile_email_error_password'));
      return;
    }

    setIsSaving(true);
    try {
      await authService.changeContact({
        email: nextEmail,
        currentPassword: nextPassword
      });
      await authService.fetchCurrentUser();
      notify.success(t('profile_email_success'));
      setPassword('');
      setIsConfirmStep(false);
      navigate('/account');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile_email_error_failed');
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
    <div className="mx-auto w-full max-w-xl">
      <div
        className={cn(
          'rounded-md border border-border bg-surface p-5 shadow-elevation-card',
          'tablet:p-6'
        )}
      >
        <h2 className="text-heading text-text-primary">
          {isConfirmStep ? t('profile_email_title_confirm') : t('profile_email_title_update')}
        </h2>
        <p className="mt-1 text-body text-text-secondary">
          {isConfirmStep ? t('profile_email_desc_confirm') : t('profile_email_desc_enter')}
        </p>

        <div className="mt-5">
          <label
            htmlFor={isConfirmStep ? 'profile-email-password' : 'profile-email'}
            className="mb-2 block text-caption font-semibold text-text-primary"
          >
            {isConfirmStep ? t('label_password') : t('profile_label_email')}
          </label>
          <input
            id={isConfirmStep ? 'profile-email-password' : 'profile-email'}
            type={isConfirmStep ? 'password' : 'email'}
            value={isConfirmStep ? password : email}
            onChange={(event) => (isConfirmStep ? setPassword(event.target.value) : setEmail(event.target.value))}
            placeholder={isConfirmStep ? t('profile_email_placeholder_password') : t('profile_email_placeholder_email')}
            autoComplete={isConfirmStep ? 'current-password' : 'email'}
            className={authInputClass(false, isSaving)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isConfirmStep ? (
            <Button type="button" variant="profileGhost" onClick={handleBack} disabled={isSaving} className="rounded-sm sm:min-w-[120px]">
              {t('btn_back')}
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
            {isSaving ? null : isConfirmStep ? t('btn_confirm') : t('profile_btn_save_changes')}
          </Button>
        </div>
      </div>
    </div>
  );
}
