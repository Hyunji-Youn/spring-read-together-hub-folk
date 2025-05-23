import { z } from 'zod';
import { ApplicationStatus, RoleName } from '@prisma/client';

/**
 * Schema for registration request validation
 */
export const registrationRequestSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Please provide a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  phone_number: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 digits')
    .regex(/^[0-9\-\+\(\)\s]+$/, 'Phone number can only contain digits, spaces, and these symbols: -+()'),
  registration_password: z.string()
    .min(8, 'Registration code must be at least 8 characters'),
  request_librarian_role: z.boolean().optional().default(false),
  accept_terms: z.boolean()
    .refine(val => val === true, {
      message: 'You must accept the terms and conditions'
    })
});

/**
 * Type inference of registration request schema
 */
export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;

/**
 * Schema for login request validation
 */
export const loginRequestSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

/**
 * Type inference of login request schema
 */
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Schema for admin login request validation
 */
export const adminLoginRequestSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

/**
 * Type inference of admin login request schema
 */
export type AdminLoginRequestDto = z.infer<typeof adminLoginRequestSchema>;

/**
 * Schema for user response
 */
export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone_number: z.string(),
  role: z.nativeEnum(RoleName),
  status: z.nativeEnum(ApplicationStatus).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  last_login: z.date().nullable(),
});

/**
 * Type inference of user response schema
 */
export type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * Schema for authenticated user response
 */
export const authUserResponseSchema = z.object({
  message: z.string(),
  user: userResponseSchema,
  token: z.string(),
});

/**
 * Type inference of authenticated user response schema
 */
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;

/**
 * Schema for token refresh request validation
 */
export const refreshTokenRequestSchema = z.object({
  // No body needed for refresh token as it's in the cookie
});

/**
 * Type for token refresh request
 */
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;

/**
 * Schema for password change request validation
 */
export const passwordChangeRequestSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirm_new_password: z.string().min(1, 'Confirm password is required'),
}).refine(data => data.new_password === data.confirm_new_password, {
  message: 'Passwords do not match',
  path: ['confirm_new_password'],
});

/**
 * Type for password change request
 */
export type PasswordChangeRequestDto = z.infer<typeof passwordChangeRequestSchema>; 