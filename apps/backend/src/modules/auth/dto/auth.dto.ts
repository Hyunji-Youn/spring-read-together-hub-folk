import { z } from 'zod';

// 로그인 요청 스키마
export const loginSchema = z.object({
  username: z.string().min(4).max(100),
  password: z.string().min(6).max(100),
});

// 회원가입 요청 스키마
export const registerSchema = z.object({
  username: z.string().min(4).max(100),
  password: z.literal('test123test123', { 
    errorMap: () => ({ message: "가입 암호는 'test123test123'이어야 합니다." })
  }),
  name: z.string().min(2).max(100),
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  phone_number: z.string().regex(/^\d{10,11}$/, '10-11자리 숫자로 입력해주세요'),
  requested_librarian_role: z.boolean().default(false),
});

// 토큰 갱신 요청 스키마
export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// 사용자 프로필 수정 요청 스키마
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email('유효한 이메일 주소를 입력해주세요').optional(),
  phone_number: z.string().regex(/^\d{10,11}$/, '10-11자리 숫자로 입력해주세요').optional(),
});

// DTO 타입 추출
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>; 