import LoadingLink from '../components/LoadingLink';
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-7">
          <LoadingLink to="/" className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-7 py-3.5 shadow-lg ring-1 ring-blue-400/20">
              <span className="text-white font-black text-3xl leading-none tracking-tight caret-transparent select-none">ECOMX</span>
            </div>
            <span className="mt-3 text-sm font-semibold text-scale-600 tracking-wide ">{t('register_tagline')}</span>
          </LoadingLink>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl border border-rose-100 shadow-[0_20px_60px_-20px_rgba(244,63,94,0.35)] p-7 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-800 tracking-tight">{t('register_page_title')}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{t('register_page_subtitle')}</p>
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'email' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500'
                }`}>
                1
              </div>
              <div className={`w-12 h-1 ${currentStep === 'email' ? 'bg-gray-200' : 'bg-red-500'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'otp' ? 'bg-red-500 text-white' :
                currentStep === 'password' ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-400'
                }`}>
                2
              </div>
              <div className={`w-12 h-1 ${currentStep === 'password' ? 'bg-red-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'password' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                3
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            {currentStep === 'email' && t('step_email_title')}
            {currentStep === 'otp' && t('step_otp_title')}
            {currentStep === 'password' && t('step_password_title')}
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            {currentStep === 'email' && t('step_email_desc')}
            {currentStep === 'otp' && t('step_otp_desc')}
            {currentStep === 'password' && t('step_password_desc')}
          </p>

          <div className="space-y-4">
            {currentStep === 'email' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('label_email_or_phone')}
                  </label>
                  <input
                    type="text"
                    placeholder={getPlaceholder()}
                    value={emailOrPhone}
                    onChange={handleEmailOrPhoneChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm ${emailOrPhoneError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                      }`}
                  />
                  {emailOrPhoneError && (
                    <p className="mt-1 text-xs text-red-500">{emailOrPhoneError}</p>
                  )}
                  {emailOrPhone && !emailOrPhoneError && (
                    <p className="mt-1 text-xs text-green-600">
                      {inputType === 'email' && t('register_valid_email')}
                      {inputType === 'phone' && t('register_valid_phone')}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={!isEmailOrPhoneValid || isLoading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('register_loading_send') : t('btn_continue')}
                </button>
              </>
            )}

            {currentStep === 'otp' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('label_otp')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('otp_placeholder')}
                    value={verificationCode}
                    onChange={handleOtpChange}
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-center text-2xl tracking-widest font-semibold ${otpError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                      }`}
                  />
                  {otpError && (
                    <p className="mt-1 text-xs text-red-500">{otpError}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    {t('otp_sent_to')}{' '}
                    <span className="font-medium text-gray-700">{emailOrPhone}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isLoading}
                    className="text-sm text-red-500 hover:text-red-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {countdown > 0
                      ? t('otp_resend_after').replace('{countdown}', String(countdown))
                      : t('otp_resend')}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBackStep}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                  >
                    {t('btn_back')}
                  </button>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={!isOtpValid || isLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? t('register_loading_verify') : t('btn_verify')}
                  </button>
                </div>
              </>
            )}

            {currentStep === 'password' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('label_password')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('register_password_placeholder')}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm ${passwordError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                      }`}
                  />
                  {passwordError && (
                    <p className="mt-1 text-xs text-red-500">{passwordError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('label_confirm_password')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('register_confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm ${confirmPasswordError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                      }`}
                  />
                  {confirmPasswordError && (
                    <p className="mt-1 text-xs text-red-500">{confirmPasswordError}</p>
                  )}
                  {confirmPassword && !confirmPasswordError && (
                    <p className="mt-1 text-xs text-green-600">{t('register_password_match')}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => handleAgreedToTermsChange(e.target.checked)}
                      className="mt-1 w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-600">
                      {t('register_terms_prefix')}{' '}
                      <a href="#" className="text-red-500 hover:text-red-600 hover:underline">
                        {t('common_terms_service')}
                      </a>{' '}
                      {t('register_terms_and')}{' '}
                      <a href="#" className="text-red-500 hover:text-red-600 hover:underline">
                        {t('common_privacy_policy')}
                      </a>{' '}
                      {t('register_terms_suffix')}
                    </label>
                  </div>
                  {termsError && (
                    <p className="mt-1 text-xs text-red-500">{termsError}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBackStep}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
                  >
                    {t('btn_back')}
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={!isPasswordValid || isLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? t('register_loading_submit') : t('btn_finish')}
                  </button>
                </div>
              </>
            )}

            {currentStep === 'email' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">{t('common_or')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                  </button>

                  <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Google</span>
                  </button>
                </div>
              </>
            )}

            <div className="text-center mt-6">
              <span className="text-sm text-gray-600">{t('register_have_account')} </span>
              <LoadingLink to="/login" className="text-sm text-red-500 hover:text-red-600 font-medium hover:underline">
                {t('login_button')}
              </LoadingLink>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t('register_agreement_prefix')}
          </p>
          <div className="flex justify-center gap-3 mt-1">
            <a href="#" className="text-xs text-red-500 hover:text-red-600 hover:underline">
              {t('common_terms_service')}
            </a>
            <span className="text-xs text-gray-400">|</span>
            <a href="#" className="text-xs text-red-500 hover:text-red-600 hover:underline">
              {t('common_privacy_policy')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
