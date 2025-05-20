import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/services/token.service';

// Request 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}

/**
 * JWT 인증 미들웨어
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const decoded = await verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
    
    // 요청 객체에 사용자 정보 추가
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: '인증에 실패했습니다.' });
  }
}

/**
 * 특정 역할 권한 확인 미들웨어 생성 함수
 */
export function roleGuard(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
    }
    
    next();
  };
} 