import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { useAuth } from '../../../app/auth/AuthProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { Button } from '../../../components/ui';
import { authInputClass } from '../../../lib/authFormClasses';
import { cn } from '../../../lib/cn';

export default function EditPhoneTab() {
  const { t } = useI18n();
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
        notify.error(t('profile_phone_error_empty'));
        return;
      }
      setIsConfirmStep(true);
      return;
    }

    const nextPassword = currentPassword.trim();
    if (!nextPassword) {
      notify.error(t('profile_phone_error_password'));
      return;
    }

    setIsSaving(true);
    try {
      await authService.changeContact({
        phoneNumber: nextPhone,
        currentPassword: currentPassword
      });
      await authService.fetchCurrentUser();
      notify.success(t('profile_phone_success'));
      setCurrentPassword('');
      setIsConfirmStep(false);
      navigate('/account');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile_phone_error_failed');
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
          {isConfirmStep ? t('profile_phone_title_confirm') : t('profile_phone_title_update')}
        </h2>
        <p className="mt-1 text-body text-text-secondary">
          {isConfirmStep ? t('profile_phone_desc_confirm') : t('profile_phone_desc_enter')}
        </p>

        <div className="mt-5">
          <label
            htmlFor={isConfirmStep ? 'profile-phone-password' : 'profile-phone-number'}
            className="mb-2 block text-caption font-semibold text-text-primary"
          >
            {isConfirmStep ? t('label_password') : t('profile_label_phone')}
          </label>
          <input
            id={isConfirmStep ? 'profile-phone-password' : 'profile-phone-number'}
            type={isConfirmStep ? 'password' : 'tel'}
            value={isConfirmStep ? currentPassword : phoneNumber}
            onChange={(event) =>
              isConfirmStep ? setCurrentPassword(event.target.value) : setPhoneNumber(event.target.value)
            }
            placeholder={isConfirmStep ? t('profile_phone_placeholder_password') : t('profile_phone_placeholder_phone')}
            autoComplete={isConfirmStep ? 'current-password' : 'tel'}
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
