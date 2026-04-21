import LoadingLink from '../components/LoadingLink';
import AuthBrandMark from '../components/auth/AuthBrandMark';
import { Button } from '../components/ui';
import { authInputClass } from '../lib/authFormClasses';
import { cn } from '../lib/cn';
import { useLogin } from '../hooks/useLogin';
import { useI18n } from '../i18n/I18nProvider';

const LoginPage = () => {
  const { t } = useI18n();
  const {
    login,
    password,
    showPassword,
    activeTab,
    loading,
    emailError,
    passwordError,
    apiError,
    inputType,
    getPlaceholder,
    handleEmailChange,
    handlePasswordChange,
    togglePasswordVisibility,
    handleTabChange,
    handleLogin
  } = useLogin();

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
            <h1 className="text-display text-text-primary">{t('login_page_title')}</h1>
            <p className="mt-1.5 text-body text-text-secondary">{t('login_page_subtitle')}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-md bg-background p-1.5">
            <button
              type="button"
              onClick={() => handleTabChange('password')}
              className={cn(
                'rounded-sm py-2.5 text-sm font-semibold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                activeTab === 'password'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t('login_tab_password')}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('qr')}
              className={cn(
                'rounded-sm py-2.5 text-sm font-semibold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                activeTab === 'qr'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t('login_tab_qr')}
            </button>
          </div>

          {activeTab === 'password' && (
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {apiError && (
                <div className="rounded-md border border-danger/25 bg-danger/5 p-3.5">
                  <p className="text-body font-medium text-danger">{apiError}</p>
                </div>
              )}

              <div>
                <label htmlFor="login-input" className="mb-2 block text-caption font-semibold text-text-primary">
                  {t('login_label_account')}
                </label>
                <div className="relative">
                  <input
                    id="login-input"
                    type="text"
                    placeholder={getPlaceholder()}
                    value={login}
                    onChange={handleEmailChange}
                    disabled={loading}
                    className={cn(
                      authInputClass(Boolean(emailError), loading),
                      login ? 'pr-12' : ''
                    )}
                    autoComplete="username"
                  />
                  {login ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {inputType === 'email' && (
                        <svg className="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      {inputType === 'phone' && (
                        <svg className="size-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      )}
                      {inputType === 'username' && (
                        <svg className="size-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                  ) : null}
                </div>
                {emailError ? <p className="mt-1.5 text-caption text-danger">{emailError}</p> : null}
                {login && !emailError ? (
                  <p className="mt-1.5 text-caption text-text-secondary">
                    {inputType === 'email' && t('login_hint_email')}
                    {inputType === 'phone' && t('login_hint_phone')}
                    {inputType === 'username' && t('login_hint_username')}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password-input" className="mb-2 block text-caption font-semibold text-text-primary">
                  {t('label_password')}
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login_password_placeholder')}
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    className={cn(authInputClass(Boolean(passwordError), loading), 'pr-12')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className={cn(
                      'absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors',
                      'hover:text-text-primary disabled:cursor-not-allowed',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
                    )}
                    aria-label={showPassword ? t('login_hide_password') : t('login_show_password')}
                  >
                    {showPassword ? (
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError ? <p className="mt-1.5 text-caption text-danger">{passwordError}</p> : null}
              </div>

              <Button
                type="submit"
                variant="profilePrimary"
                fullWidth
                loading={loading}
                className="rounded-sm"
              >
                {loading ? null : t('login_button')}
              </Button>

              <div className="text-center">
                <LoadingLink
                  to="/forgot-password"
                  className={cn(
                    'text-body text-primary transition-colors hover:text-primary-dark hover:underline',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
                  )}
                >
                  {t('login_forgot_password')}
                </LoadingLink>
              </div>

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
                  disabled={loading}
                  className="w-full rounded-sm border-border text-text-primary"
                  onClick={() => console.log('Facebook login')}
                  leftIcon={
                    <svg className="size-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  }
                >
                  <span className="select-none text-body font-medium">Facebook</span>
                </Button>

                <Button
                  type="button"
                  variant="authSocial"
                  disabled={loading}
                  className="w-full rounded-sm border-border text-text-primary"
                  onClick={() => console.log('Google login')}
                  leftIcon={
                    <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  }
                >
                  <span className="select-none text-body font-medium">Google</span>
                </Button>
              </div>

              <div className="mt-6 text-center">
                <span className="text-body text-text-secondary">{t('login_new_user')} </span>
                <LoadingLink
                  to="/register"
                  className={cn(
                    'text-body font-semibold text-primary transition-colors hover:text-primary-dark hover:underline',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
                  )}
                >
                  {t('login_create_account')}
                </LoadingLink>
              </div>
            </form>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center py-8">
              <div
                className={cn(
                  'mb-4 flex size-64 items-center justify-center rounded-md border border-border',
                  'bg-background'
                )}
              >
                <svg className="size-32 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <p className="max-w-xs text-center text-body text-text-secondary">{t('login_qr_instruction')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
