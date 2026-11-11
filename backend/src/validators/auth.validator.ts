import { z } from 'zod';
import { PUBLIC_REGISTRATION_ROLES, type UserRole } from '../constants/roles.js';

const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(bdPhoneRegex, 'Valid Bangladesh phone number is required (e.g., 01712345678 or +8801712345678)'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  role: z
    .enum(PUBLIC_REGISTRATION_ROLES as [UserRole, ...UserRole[]], {
      errorMap: () => ({
        message: 'Role must be either CUSTOMER, INDIVIDUAL_PROVIDER, or COMPANY_OWNER',
      }),
    })
    .default('CUSTOMER'),
  preferredLanguage: z.enum(['bn', 'en']).default('bn').optional(),
});

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Email or phone number is required' })
    .trim()
    .min(3, 'Identifier must be at least 3 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  identifier: z
    .string({ required_error: 'Email or phone number is required' })
    .trim()
    .min(3, 'Identifier is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }).min(1),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().regex(bdPhoneRegex).optional(),
  preferredLanguage: z.enum(['bn', 'en']).optional(),
  avatarUrl: z.string().url().optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(50).default('Home'),
  area: z.string().trim().min(2).max(50),
  addressLine: z.string().trim().min(5).max(300),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export const googleAuthSchema = z.object({
  idToken: z.string({ required_error: 'Google ID token is required' }).min(10, 'Invalid Google ID token format'),
  role: z
    .enum(PUBLIC_REGISTRATION_ROLES as [UserRole, ...UserRole[]])
    .optional(),
});
