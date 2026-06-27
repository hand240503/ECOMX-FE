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
    loading,
    emailError,
    passwordError,
    apiError,
    inputType,
    getPlaceholder,
    handleEmailChange,
    handlePasswordChange,
    togglePasswordVisibility,
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
