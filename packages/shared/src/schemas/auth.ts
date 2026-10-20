import { z } from 'zod';

export const emailSchema = z
  .string('Email is required')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));

// bcrypt ignores everything after 72 bytes, so longer passwords are rejected
export const passwordSchema = z
  .string('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  fullName: z
    .string('Name is required')
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: emailSchema,
  password: passwordSchema,
});

// Login only checks presence: strength rules would hint at valid passwords
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string('Password is required').min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string('Reset token is required').min(1, 'Reset token is required'),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
