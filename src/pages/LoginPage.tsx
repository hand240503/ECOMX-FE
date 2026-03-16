import { Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-7">
          <Link to="/" className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-7 py-3.5 shadow-lg ring-1 ring-blue-400/20">
              <span className="text-white font-black text-3xl leading-none tracking-tight caret-transparent select-none">
                ECOMX
              </span>
            </div>
            <span className="mt-3 text-sm font-semibold text-slate-600 tracking-wide caret-transparent select-none">
              {t('register_tagline')}
            </span>
          </Link>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl border border-rose-100 shadow-[0_20px_60px_-20px_rgba(244,63,94,0.35)] p-7 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-800 tracking-tight">
              {t('login_page_title')}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {t('login_page_subtitle')}
            </p>
          </div>

          <div className="mb-6 p-1.5 bg-slate-100 rounded-xl grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleTabChange('password')}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'password'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {t('login_tab_password')}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('qr')}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'qr'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {t('login_tab_qr')}
            </button>
          </div>

          {activeTab === 'password' && (
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {apiError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{apiError}</p>
                </div>
              )}

              <div>
                <label htmlFor="login-input" className="block mb-2 text-sm font-semibold text-slate-700">
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
                    className={`w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-colors ${emailError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-rose-500'
                      } ${loading ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                    autoComplete="username"
                  />
                  {login && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {inputType === 'email' && (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {inputType === 'phone' && (
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      )}
                      {inputType === 'username' && (
                        <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-500">{emailError}</p>
                )}
                {login && !emailError && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {inputType === 'email' && t('login_hint_email')}
                    {inputType === 'phone' && t('login_hint_phone')}
                    {inputType === 'username' && t('login_hint_username')}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password-input" className="block mb-2 text-sm font-semibold text-slate-700">
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
                    className={`w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm pr-12 transition-colors ${passwordError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-rose-500'
                      } ${loading ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:cursor-not-allowed"
                    aria-label={showPassword ? t('login_hide_password') : t('login_show_password')}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-base py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('login_loading')}</span>
                  </>
                ) : (
                  t('login_button')
                )}
              </button>

              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  {t('login_forgot_password')}
                </Link>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">{t('common_or')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => console.log('Facebook login')}
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700 caret-transparent cursor-default select-none">Facebook</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => console.log('Google login')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700 caret-transparent cursor-default select-none">Google</span>
                </button>
              </div>

              <div className="text-center mt-6">
                <span className="text-sm text-slate-600">{t('login_new_user')} </span>
                <Link to="/register" className="text-sm text-rose-500 hover:text-rose-600 font-semibold hover:underline transition-colors">
                  {t('login_create_account')}
                </Link>
              </div>
            </form>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-64 h-64 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 border border-slate-200">
                <svg className="w-32 h-32 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 text-center max-w-xs">
                {t('login_qr_instruction')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
