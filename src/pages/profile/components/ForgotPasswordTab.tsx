import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { authService } from '../../../api/services';
import { notify } from '../../../utils/notify';
import { Button } from '../../../components/ui';
import { authInputClass } from '../../../lib/authFormClasses';
import { cn } from '../../../lib/cn';

export default function ForgotPasswordTab() {
  const { t } = useI18n();
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
      if (!nextEmail) return notify.error(t('profile_forgot_error_email_empty'));
      if (!isValidEmail(nextEmail)) return notify.error(t('profile_forgot_error_email_invalid'));

      setIsSaving(true);
      try {
        const message = await authService.forgotPassword({ email: nextEmail });
        notify.success(message || t('profile_forgot_success_sent'));
        setIsConfirmStep(true);
      } catch (error) {
        notify.error(error instanceof Error ? error.message : t('profile_forgot_error_send_failed'));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const token = code.trim();
    const password = newPassword.trim();

    if (!token) return notify.error(t('profile_forgot_error_code_empty'));
    if (!isValidPassword(password)) {
      return notify.error(t('profile_forgot_error_password_rules'));
    }

    setIsSaving(true);
    try {
      const message = await authService.resetPassword({
        token,
        newPassword: password,
        confirmPassword: password
      });
      notify.success(message || t('profile_forgot_success_reset'));
      navigate('/login');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t('profile_forgot_error_reset_failed'));
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
          {isConfirmStep ? t('profile_forgot_title_confirm') : t('profile_forgot_title')}
        </h2>
        <p className="mt-1 text-body text-text-secondary">
          {isConfirmStep ? t('profile_forgot_desc_confirm') : t('profile_forgot_desc_enter')}
        </p>

        <div className="mt-5 space-y-4">
          {!isConfirmStep ? (
            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-caption font-semibold text-text-primary">
                {t('profile_forgot_label_email')}
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('profile_forgot_placeholder_email')}
                className={authInputClass(false, isSaving)}
              />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="forgot-code" className="mb-2 block text-caption font-semibold text-text-primary">
                  {t('profile_forgot_label_code')}
                </label>
                <input
                  id="forgot-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('profile_forgot_placeholder_code')}
                  className={authInputClass(false, isSaving)}
                />
              </div>

              <div>
                <label htmlFor="forgot-password" className="mb-2 block text-caption font-semibold text-text-primary">
                  {t('profile_forgot_label_new_password')}
                </label>
                <input
                  id="forgot-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('profile_forgot_placeholder_new_password')}
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
              {t('btn_back')}
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
            {isSaving ? null : isConfirmStep ? t('btn_confirm') : t('profile_forgot_btn_send')}
          </Button>
        </div>
      </div>
    </div>
  );
}
