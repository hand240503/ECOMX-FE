import LoadingLink from '../components/LoadingLink';
import AuthBrandMark from '../components/auth/AuthBrandMark';
import { Button } from '../components/ui';
import { authInputClass } from '../lib/authFormClasses';
import { cn } from '../lib/cn';
import { useRegister } from '../hooks/useRegister';
import { useI18n } from '../i18n/I18nProvider';

const RegisterPage = () => {
  const { t } = useI18n();
  const {
    currentStep,
    emailOrPhone,
    verificationCode,
    password,
    confirmPassword,
    agreedToTerms,
    countdown,
    isLoading,
    emailOrPhoneError,
    otpError,
    passwordError,
    confirmPasswordError,
    termsError,
    inputType,
    isEmailOrPhoneValid,
    isOtpValid,
    isPasswordValid,
    getPlaceholder,
    handleEmailOrPhoneChange,
    handleSendOTP,
    handleOtpChange,
    handleVerifyOTP,
    handleResendOTP,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleAgreedToTermsChange,
    handleRegister,
    handleBackStep
  } = useRegister();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 tablet:px-6">
      <div className="w-full max-w-lg">
        <AuthBrandMark subtitle={t('register_tagline')} />

        <div
          className={cn(
            'rounded-md border border-border bg-surface p-6 shadow-elevation-card',
            'tablet:p-8'
          )}
        >
          <div className="mb-6 text-center">
            <h1 className="text-display text-text-primary">{t('register_page_title')}</h1>
            <p className="mt-1.5 text-body text-text-secondary">{t('register_page_subtitle')}</p>
          </div>

          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-caption font-medium',
                  currentStep === 'email' ? 'bg-primary text-white' : 'bg-primary-light text-primary'
                )}
              >
                1
              </div>
              <div className={cn('h-1 w-12 rounded-full', currentStep === 'email' ? 'bg-border' : 'bg-primary')} />
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-caption font-medium',
                  currentStep === 'otp'
                    ? 'bg-primary text-white'
                    : currentStep === 'password'
                      ? 'bg-primary-light text-primary'
                      : 'bg-border text-text-disabled'
                )}
              >
                2
              </div>
              <div
                className={cn('h-1 w-12 rounded-full', currentStep === 'password' ? 'bg-primary' : 'bg-border')}
              />
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-caption font-medium',
                  currentStep === 'password' ? 'bg-primary text-white' : 'bg-border text-text-disabled'
                )}
              >
                3
              </div>
            </div>
          </div>

          <h2 className="mb-2 text-center text-heading text-text-primary">
            {currentStep === 'email' && t('step_email_title')}
            {currentStep === 'otp' && t('step_otp_title')}
            {currentStep === 'password' && t('step_password_title')}
          </h2>
          <p className="mb-6 text-center text-body text-text-secondary">
            {currentStep === 'email' && t('step_email_desc')}
            {currentStep === 'otp' && t('step_otp_desc')}
            {currentStep === 'password' && t('step_password_desc')}
          </p>

          <div className="space-y-4">
            {currentStep === 'email' && (
              <>
                <div>
                  <label className={cn('mb-2 block text-caption font-medium text-text-primary')}>
                    {t('label_email_or_phone')}
                  </label>
                  <input
                    type="text"
                    placeholder={getPlaceholder()}
                    value={emailOrPhone}
                    onChange={handleEmailOrPhoneChange}
                    className={authInputClass(Boolean(emailOrPhoneError))}
                  />
                  {emailOrPhoneError ? (
                    <p className="mt-1 text-caption text-danger">{emailOrPhoneError}</p>
                  ) : null}
                  {emailOrPhone && !emailOrPhoneError ? (
                    <p className="mt-1 text-caption text-success">
                      {inputType === 'email' && t('register_valid_email')}
                      {inputType === 'phone' && t('register_valid_phone')}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="profilePrimary"
                  fullWidth
                  className="rounded-sm"
                  onClick={handleSendOTP}
                  disabled={!isEmailOrPhoneValid || isLoading}
                  loading={isLoading}
                >
                  {isLoading ? null : t('btn_continue')}
                </Button>
              </>
            )}

            {currentStep === 'otp' && (
              <>
                <div>
                  <label className="mb-2 block text-caption font-medium text-text-primary">{t('label_otp')}</label>
                  <input
                    type="text"
                    placeholder={t('otp_placeholder')}
                    value={verificationCode}
                    onChange={handleOtpChange}
                    maxLength={6}
                    className={cn(
                      authInputClass(Boolean(otpError)),
                      'text-center text-2xl font-semibold tracking-widest'
                    )}
                  />
                  {otpError ? <p className="mt-1 text-caption text-danger">{otpError}</p> : null}
                  <p className="mt-2 text-center text-caption text-text-secondary">
                    {t('otp_sent_to')} <span className="font-medium text-text-primary">{emailOrPhone}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isLoading}
                    className={cn(
                      'text-body font-medium text-primary transition-colors hover:text-primary-dark',
                      'disabled:cursor-not-allowed disabled:text-text-disabled',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
                    )}
                  >
                    {countdown > 0
                      ? t('otp_resend_after').replace('{countdown}', String(countdown))
                      : t('otp_resend')}
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="profileGhost"
                    fullWidth
                    className="rounded-sm"
                    onClick={handleBackStep}
                  >
                    {t('btn_back')}
                  </Button>
                  <Button
                    type="button"
                    variant="profilePrimary"
                    fullWidth
                    className="rounded-sm"
                    onClick={handleVerifyOTP}
                    disabled={!isOtpValid || isLoading}
                    loading={isLoading}
                  >
                    {isLoading ? null : t('btn_verify')}
                  </Button>
                </div>
              </>
            )}

            {currentStep === 'password' && (
              <>
                <div>
                  <label className="mb-2 block text-caption font-medium text-text-primary">{t('label_password')}</label>
                  <input
                    type="password"
                    placeholder={t('register_password_placeholder')}
                    value={password}
                    onChange={handlePasswordChange}
                    className={authInputClass(Boolean(passwordError))}
                  />
                  {passwordError ? <p className="mt-1 text-caption text-danger">{passwordError}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-caption font-medium text-text-primary">
                    {t('label_confirm_password')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('register_confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={authInputClass(Boolean(confirmPasswordError))}
                  />
                  {confirmPasswordError ? (
                    <p className="mt-1 text-caption text-danger">{confirmPasswordError}</p>
                  ) : null}
                  {confirmPassword && !confirmPasswordError ? (
                    <p className="mt-1 text-caption text-success">{t('register_password_match')}</p>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => handleAgreedToTermsChange(e.target.checked)}
                      className="mt-1 size-4 rounded-sm border-border text-primary accent-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <label htmlFor="terms" className="text-caption text-text-secondary">
                      {t('register_terms_prefix')}{' '}
                      <a href="#" className="text-primary hover:text-primary-dark hover:underline">
                        {t('common_terms_service')}
                      </a>{' '}
                      {t('register_terms_and')}{' '}
                      <a href="#" className="text-primary hover:text-primary-dark hover:underline">
                        {t('common_privacy_policy')}
                      </a>{' '}
                      {t('register_terms_suffix')}
                    </label>
                  </div>
                  {termsError ? <p className="mt-1 text-caption text-danger">{termsError}</p> : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="profileGhost"
                    fullWidth
                    className="rounded-sm"
                    onClick={handleBackStep}
                  >
                    {t('btn_back')}
                  </Button>
                  <Button
                    type="button"
                    variant="profilePrimary"
                    fullWidth
                    className="rounded-sm"
                    onClick={handleRegister}
                    disabled={!isPasswordValid || isLoading}
                    loading={isLoading}
                  >
                    {isLoading ? null : t('btn_finish')}
                  </Button>
                </div>
              </>
            )}

            {currentStep === 'email' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-body">
                    <span className="bg-surface px-4 text-text-secondary">{t('common_or')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="authSocial"
                    className="w-full rounded-sm border-border text-text-primary"
                    leftIcon={
                      <svg className="size-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    }
                  >
                    <span className="text-body font-medium text-text-primary">Facebook</span>
                  </Button>

                  <Button
                    type="button"
                    variant="authSocial"
                    className="w-full rounded-sm border-border text-text-primary"
                    leftIcon={
                      <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    }
                  >
                    <span className="text-body font-medium text-text-primary">Google</span>
                  </Button>
                </div>
              </>
            )}

            <div className="mt-6 text-center">
              <span className="text-body text-text-secondary">{t('register_have_account')} </span>
              <LoadingLink
                to="/login"
                className={cn(
                  'text-body font-medium text-primary hover:text-primary-dark hover:underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
                )}
              >
                {t('login_button')}
              </LoadingLink>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-caption text-text-secondary">{t('register_agreement_prefix')}</p>
          <div className="mt-1 flex justify-center gap-3">
            <a href="#" className="text-caption text-primary hover:text-primary-dark hover:underline">
              {t('common_terms_service')}
            </a>
            <span className="text-caption text-text-disabled">|</span>
            <a href="#" className="text-caption text-primary hover:text-primary-dark hover:underline">
              {t('common_privacy_policy')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
