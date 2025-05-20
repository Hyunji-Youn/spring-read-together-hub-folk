import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { loginSchema, refreshTokenSchema, registerSchema } from '../dto/auth.dto';
import { env } from '../../../config/env';

/**
 * 사용자 로그인 컨트롤러
 */
export async function login(req: Request, res: Response) {
  try {
    // 요청 데이터 검증
    const validatedData = loginSchema.parse(req.body);
    
    // 로그인 서비스 호출
    const result = await authService.login(validatedData);
    
    // 리프레시 토큰을 HTTP Only 쿠키로 설정
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseExpiration(env.JWT_REFRESH_EXPIRATION),
    });
    
    // 액세스 토큰은 응답 본문으로 반환
    res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      } else if (error.message === 'Account not approved') {
        return res.status(403).json({ success: false, message: '계정이 아직 승인되지 않았습니다.' });
      }
    }
    
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' });
  }
}

/**
 * 회원 가입 컨트롤러
 */
export async function register(req: Request, res: Response) {
  try {
    // 요청 데이터 검증
    const validatedData = registerSchema.parse(req.body);
    
    // 회원 가입 서비스 호출
    const result = await authService.register(validatedData);
    
    // 관리자 이메일 알림 로직은 별도 함수로 구현 가능
    
    res.status(201).json({
      success: true,
      message: '회원 가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
      user: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Username or email already exists') {
        return res.status(409).json({ success: false, message: '이미 사용 중인 아이디 또는 이메일입니다.' });
      }
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: '회원 가입 처리 중 오류가 발생했습니다.' });
  }
}

/**
 * 토큰 갱신 컨트롤러
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    // 쿠키에서 리프레시 토큰 추출
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: '리프레시 토큰이 없습니다.' });
    }
    
    // 토큰 갱신 서비스 호출
    const result = await authService.refreshTokens(refreshToken);
    
    // 새 리프레시 토큰을 쿠키로 설정
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseExpiration(env.JWT_REFRESH_EXPIRATION),
    });
    
    // 새 액세스 토큰 반환
    res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ success: false, message: '토큰 갱신에 실패했습니다.' });
  }
}

/**
 * 로그아웃 컨트롤러
 */
export async function logout(req: Request, res: Response) {
  try {
    // 리프레시 토큰 쿠키에서 가져오기
    const refreshToken = req.cookies?.refreshToken;
    const userId = req.user?.userId;

    // 사용자 ID가 없으면 그냥 쿠키만 삭제
    if (!userId) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    }

    // 리프레시 토큰 무효화 (refreshToken이 없어도 됨)
    await authService.logout(userId, refreshToken);
    
    // 리프레시 토큰 쿠키 삭제
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Error occurred during logout' });
  }
}

/**
 * 문자열 형태의 만료 시간(예: '15m', '1h', '7d')을 밀리초 단위로 변환
 */
function parseExpiration(expiration: string): number {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1));
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000; // 기본값 15분
  }
} 