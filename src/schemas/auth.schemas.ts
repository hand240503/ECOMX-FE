import { z } from 'zod';

const loginRegex = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+|0\d{9})$/;

export const forgotPasswordSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại')
    .regex(loginRegex, 'Email hoặc số điện thoại không hợp lệ')
});

export const verifyForgotOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'Mã OTP phải gồm 6 chữ số')
    .regex(/^\d{6}$/, 'Mã OTP chỉ được chứa số')
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Vui lòng nhập lại mật khẩu')
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp'
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type VerifyForgotOtpFormValues = z.infer<typeof verifyForgotOtpSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
