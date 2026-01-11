// src/utils/validate.ts

/**
 * Validate email address
 * @param email - Email string to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateEmail = (email: string): string => {
  if (!email) return 'Email không được để trống';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Email không hợp lệ';

  return '';
};

/**
 * Validate password
 * @param password - Password string to validate
 * @param minLength - Minimum length required (default: 6)
 * @returns Error message if invalid, empty string if valid
 */
export const validatePassword = (password: string, minLength: number = 6): string => {
  if (!password) return 'Mật khẩu không được để trống';

  if (password.length < minLength) {
    return `Mật khẩu phải có ít nhất ${minLength} ký tự`;
  }

  return '';
};

/**
 * Validate verification code (OTP)
 * @param code - Verification code to validate
 * @param length - Expected code length (default: 6)
 * @returns Error message if invalid, empty string if valid
 */
export const validateVerificationCode = (code: string, length: number = 6): string => {
  if (!code) return 'Mã xác thực không được để trống';

  if (code.length !== length) {
    return `Mã xác thực phải có ${length} ký tự`;
  }

  const codeRegex = /^\d+$/;
  if (!codeRegex.test(code)) {
    return 'Mã xác thực chỉ được chứa số';
  }

  return '';
};

/**
 * Validate phone number (Vietnamese format)
 * @param phone - Phone number to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validatePhone = (phone: string): string => {
  if (!phone) return 'Số điện thoại không được để trống';

  // Vietnamese phone number: starts with 0, followed by 9 digits
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return 'Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 0)';
  }

  return '';
};

/**
 * Validate username
 * @param username - Username to validate
 * @param minLength - Minimum length (default: 3)
 * @param maxLength - Maximum length (default: 20)
 * @returns Error message if invalid, empty string if valid
 */
export const validateUsername = (username: string, minLength: number = 3, maxLength: number = 20): string => {
  if (!username) return 'Tên đăng nhập không được để trống';

  if (username.length < minLength) {
    return `Tên đăng nhập phải có ít nhất ${minLength} ký tự`;
  }

  if (username.length > maxLength) {
    return `Tên đăng nhập không được quá ${maxLength} ký tự`;
  }

  // Only alphanumeric and underscore
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
  }

  return '';
};

/**
 * Validate confirm password
 * @param password - Original password
 * @param confirmPassword - Confirm password
 * @returns Error message if invalid, empty string if valid
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return 'Vui lòng xác nhận mật khẩu';

  if (password !== confirmPassword) {
    return 'Mật khẩu xác nhận không khớp';
  }

  return '';
};

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if invalid, empty string if valid
 */
export const validateRequired = (value: string, fieldName: string = 'Trường này'): string => {
  if (!value || value.trim() === '') {
    return `${fieldName} không được để trống`;
  }

  return '';
};

/**
 * Validate string length
 * @param value - String to validate
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @param fieldName - Name of the field for error message
 * @returns Error message if invalid, empty string if valid
 */
export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Trường này'
): string => {
  if (value.length < minLength) {
    return `${fieldName} phải có ít nhất ${minLength} ký tự`;
  }

  if (value.length > maxLength) {
    return `${fieldName} không được quá ${maxLength} ký tự`;
  }

  return '';
};

/**
 * Validate email, phone or username (for login)
 * Tự động phát hiện loại input và validate phù hợp
 * @param value - Email, phone hoặc username
 * @returns Error message if invalid, empty string if valid
 */
export const validateEmailOrPhone = (value: string): string => {
  if (!value) return 'Vui lòng nhập email, số điện thoại hoặc tên đăng nhập';

  const trimmedValue = value.trim();

  // 1. Kiểm tra nếu là SỐ ĐIỆN THOẠI (chỉ chứa số)
  if (/^\d+$/.test(trimmedValue)) {
    // Số điện thoại Việt Nam: 10 số, bắt đầu bằng 0
    if (trimmedValue.length === 10 && trimmedValue.startsWith('0')) {
      return validatePhone(trimmedValue);
    } else if (trimmedValue.length < 10) {
      return 'Số điện thoại phải có 10 chữ số';
    } else if (trimmedValue.length > 10) {
      return 'Số điện thoại không hợp lệ';
    } else {
      return 'Số điện thoại phải bắt đầu bằng số 0';
    }
  }

  // 2. Kiểm tra nếu là EMAIL (có chứa @)
  if (trimmedValue.includes('@')) {
    return validateEmail(trimmedValue);
  }

  // 3. Còn lại coi là USERNAME
  // Username có thể chứa chữ cái, số, dấu gạch dưới, dấu chấm
  if (trimmedValue.length < 3) {
    return 'Tên đăng nhập phải có ít nhất 3 ký tự';
  }

  if (trimmedValue.length > 50) {
    return 'Tên đăng nhập không được quá 50 ký tự';
  }

  // Username chỉ chứa: chữ cái, số, gạch dưới, dấu chấm
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(trimmedValue)) {
    return 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu chấm';
  }

  return '';
};

/**
 * Phát hiện loại input (để hiển thị placeholder động)
 * @param value - Input value
 * @returns 'email' | 'phone' | 'username' | 'unknown'
 */
export const detectInputType = (value: string): 'email' | 'phone' | 'username' | 'unknown' => {
  if (!value) return 'unknown';

  const trimmedValue = value.trim();

  // Kiểm tra số điện thoại
  if (/^\d+$/.test(trimmedValue)) {
    return 'phone';
  }

  // Kiểm tra email
  if (trimmedValue.includes('@')) {
    return 'email';
  }

  // Kiểm tra username hợp lệ
  if (/^[a-zA-Z0-9_.]+$/.test(trimmedValue) && trimmedValue.length >= 3) {
    return 'username';
  }

  return 'unknown';
};

/**
 * Validate full name
 * @param fullName - Full name to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateFullName = (fullName: string): string => {
  if (!fullName) return 'Họ và tên không được để trống';

  if (fullName.trim().length < 2) {
    return 'Họ và tên phải có ít nhất 2 ký tự';
  }

  // Allow letters, spaces, and Vietnamese characters
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
  if (!nameRegex.test(fullName)) {
    return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
  }

  return '';
};

/**
 * Validate checkbox (terms and conditions)
 * @param isChecked - Boolean value of checkbox
 * @param message - Custom error message
 * @returns Error message if invalid, empty string if valid
 */
export const validateCheckbox = (isChecked: boolean, message: string = 'Bạn phải đồng ý với điều khoản'): string => {
  if (!isChecked) return message;
  return '';
};