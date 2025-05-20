import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { RoleName } from '@prisma/client';

// JWT 토큰 페이로드 타입
interface TokenPayload {
  userId: number;
  role: RoleName;
}

// 토큰 응답 타입
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 초 단위
}

/**
 * 액세스 토큰과 리프레시 토큰 생성
 */
export async function generateTokens(userId: number, role: RoleName): Promise<TokenResponse> {
  const accessTokenPayload: TokenPayload = { userId, role };
  const refreshTokenPayload: TokenPayload = { userId, role };
  
  // 만료 시간 계산 (초 단위)
  const accessTokenExpiresIn = parseExpirationToSeconds(env.JWT_ACCESS_EXPIRATION);
  const refreshTokenExpiresIn = parseExpirationToSeconds(env.JWT_REFRESH_EXPIRATION);
  
  // 토큰 생성
  const accessToken = jwt.sign(
    accessTokenPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: accessTokenExpiresIn }
  );
  
  const refreshToken = jwt.sign(
    refreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: refreshTokenExpiresIn }
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenExpiresIn,
  };
}

/**
 * 액세스 토큰 검증
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 리프레시 토큰 검증
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 문자열 형태의 만료 시간(예: '15m', '1h', '7d')을 초 단위로 변환
 */
function parseExpirationToSeconds(expiration: string): number {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1));
  
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 900; // 기본값 15분
  }
} 