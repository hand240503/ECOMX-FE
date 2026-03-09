export const validateEmail = (email: string): string => {
  if (!email) return 'Email khong duoc de trong';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Email khong hop le';

  return '';
};

export const validatePassword = (password: string, minLength: number = 6): string => {
  if (!password) return 'Mat khau khong duoc de trong';

  if (password.length < minLength) {
    return `Mat khau phai co it nhat ${minLength} ky tu`;
  }

  return '';
};

export const validateVerificationCode = (code: string, length: number = 6): string => {
  if (!code) return 'Ma xac thuc khong duoc de trong';

  if (code.length !== length) {
    return `Ma xac thuc phai co ${length} ky tu`;
  }

  const codeRegex = /^\d+$/;
  if (!codeRegex.test(code)) {
    return 'Ma xac thuc chi duoc chua so';
  }

  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone) return 'So dien thoai khong duoc de trong';

  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return 'So dien thoai khong hop le (phai co 10 so va bat dau bang 0)';
  }

  return '';
};

export const validateUsername = (username: string, minLength: number = 3, maxLength: number = 20): string => {
  if (!username) return 'Ten dang nhap khong duoc de trong';

  if (username.length < minLength) {
    return `Ten dang nhap phai co it nhat ${minLength} ky tu`;
  }

  if (username.length > maxLength) {
    return `Ten dang nhap khong duoc qua ${maxLength} ky tu`;
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return 'Ten dang nhap chi duoc chua chu cai, so va dau gach duoi';
  }

  return '';
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) return 'Vui long xac nhan mat khau';

  if (password !== confirmPassword) {
    return 'Mat khau xac nhan khong khop';
  }

  return '';
};

export const validateRequired = (value: string, fieldName: string = 'Truong nay'): string => {
  if (!value || value.trim() === '') {
    return `${fieldName} khong duoc de trong`;
  }

  return '';
};

export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Truong nay'
): string => {
  if (value.length < minLength) {
    return `${fieldName} phai co it nhat ${minLength} ky tu`;
  }

  if (value.length > maxLength) {
    return `${fieldName} khong duoc qua ${maxLength} ky tu`;
  }

  return '';
};

export const validateEmailOrPhone = (value: string): string => {
  if (!value) return 'Vui long nhap email, so dien thoai hoac ten dang nhap';

  const trimmedValue = value.trim();

  if (/^\d+$/.test(trimmedValue)) {
    if (trimmedValue.length === 10 && trimmedValue.startsWith('0')) {
      return validatePhone(trimmedValue);
    }
    if (trimmedValue.length < 10) {
      return 'So dien thoai phai co 10 chu so';
    }
    if (trimmedValue.length > 10) {
      return 'So dien thoai khong hop le';
    }
    return 'So dien thoai phai bat dau bang so 0';
  }

  if (trimmedValue.includes('@')) {
    return validateEmail(trimmedValue);
  }

  if (trimmedValue.length < 3) {
    return 'Ten dang nhap phai co it nhat 3 ky tu';
  }

  if (trimmedValue.length > 50) {
    return 'Ten dang nhap khong duoc qua 50 ky tu';
  }

  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(trimmedValue)) {
    return 'Ten dang nhap chi duoc chua chu cai, so, dau gach duoi va dau cham';
  }

  return '';
};

export const detectInputType = (value: string): 'email' | 'phone' | 'username' | 'unknown' => {
  if (!value) return 'unknown';

  const trimmedValue = value.trim();

  if (/^\d+$/.test(trimmedValue)) {
    return 'phone';
  }

  if (trimmedValue.includes('@')) {
    return 'email';
  }

  if (/^[a-zA-Z0-9_.]+$/.test(trimmedValue) && trimmedValue.length >= 3) {
    return 'username';
  }

  return 'unknown';
};

export const validateFullName = (fullName: string): string => {
  if (!fullName) return 'Ho va ten khong duoc de trong';

  if (fullName.trim().length < 2) {
    return 'Ho va ten phai co it nhat 2 ky tu';
  }

  const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
  if (!nameRegex.test(fullName)) {
    return 'Ho va ten chi duoc chua chu cai va khoang trang';
  }

  return '';
};

export const validateCheckbox = (isChecked: boolean, message: string = 'Ban phai dong y voi dieu khoan'): string => {
  if (!isChecked) return message;
  return '';
};
