import { Link } from 'react-router-dom';
import { useLogin } from '../../../hooks/auth/useLogin';

const LoginPage = () => {
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

    // Computed
    getPlaceholder,

    // Handlers
    handleEmailChange,
    handlePasswordChange,
    togglePasswordVisibility,
    handleTabChange,
    handleLogin,
  } = useLogin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg px-6 py-3 shadow-lg">
              <span className="text-white font-black text-3xl leading-none tracking-tight">
                ECOMX
              </span>
            </div>
            <span className="mt-2 text-sm font-semibold text-gray-600 tracking-wide">
              Đăng nhập
            </span>
          </Link>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tab Header */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => handleTabChange('password')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'password'
                ? 'text-red-500'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Đăng nhập
              {activeTab === 'password' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('qr')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === 'qr'
                ? 'text-red-500'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Đăng nhập với mã QR
            </button>
          </div>

          {/* Password Login Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* API Error Message */}
              {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{apiError}</p>
                </div>
              )}

              {/* Email/Phone/Username Input */}
              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={getPlaceholder()}
                    value={login}
                    onChange={handleEmailChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-colors ${emailError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                      } ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    autoComplete="username"
                  />
                  {/* Icon hiển thị loại input */}
                  {login && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {inputType === 'email' && (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {inputType === 'phone' && (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      )}
                      {inputType === 'username' && (
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-red-500">{emailError}</p>
                )}
                {/* Hint text */}
                {login && !emailError && (
                  <p className="mt-1 text-xs text-gray-500">
                    {inputType === 'email' && '✓ Đang nhập dưới dạng email'}
                    {inputType === 'phone' && '✓ Đang nhập dưới dạng số điện thoại'}
                    {inputType === 'username' && '✓ Đang nhập dưới dạng tên đăng nhập'}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm pr-12 transition-colors ${passwordError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                      } ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
                  <p className="mt-1 text-xs text-red-500">{passwordError}</p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  'ĐĂNG NHẬP'
                )}
              </button>

              {/* Forgot Password */}
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Quên mật khẩu
                </Link>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">HOẶC</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => console.log('Facebook login')}
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Facebook</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => console.log('Google login')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Google</span>
                </button>
              </div>

              {/* Register Link */}
              <div className="text-center mt-6">
                <span className="text-sm text-gray-600">Bạn mới biết đến ECOMX? </span>
                <Link to="/register" className="text-sm text-red-500 hover:text-red-600 font-medium hover:underline transition-colors">
                  Đăng ký
                </Link>
              </div>
            </form>
          )}

          {/* QR Login Tab */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-32 h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Mở ứng dụng ECOMX và quét mã QR để đăng nhập
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;