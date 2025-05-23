import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../modules/auth/services/jwt.service';
import { RoleName } from '@prisma/client';

/**
 * Extended Request interface to include user data
 * Added after JWT verification with RS256 algorithm
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: RoleName;
        email?: string;
        username?: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies tokens using RS256 algorithm through jwtService
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - Authorization header:', authHeader ? 'Present' : 'Missing');
    
    const token = jwtService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      console.log('Auth middleware - No token found in request');
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }
    
    console.log('Auth middleware - Verifying token with jwtService (RS256)');
    
    // Verify token (using RS256 algorithm in jwtService)
    const payload = await jwtService.verifyToken(token);
    
    console.log('Auth middleware - Token verified successfully for user:', payload.sub);
    
    // Add user information to request object
    req.user = {
      id: payload.sub,
      role: payload.role as RoleName,
      email: payload.email,
      username: payload.username
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
}

/**
 * Role Guard Factory
 * Creates middleware to check user roles after JWT authentication
 */
export function roleGuard(allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    next();
  };
}

/**
 * Helper middleware to restrict routes to admin only
 */
export const adminOnly = roleGuard([RoleName.Admin]);

/**
 * Helper middleware to restrict routes to librarians and admins
 */
export const librarianOrAdminOnly = roleGuard([RoleName.Admin, RoleName.Librarian]);

/**
 * Helper middleware to restrict routes to members, librarians and admins
 */
export const membersOnly = roleGuard([RoleName.Admin, RoleName.Librarian, RoleName.Member]); 