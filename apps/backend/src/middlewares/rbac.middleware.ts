import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, HttpCode } from '../common/utils/app-error';
import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions 
} from '@spring-book-club/shared-types';

// Using shared Permission enum from @spring-book-club/shared-types

// Using shared ROLE_PERMISSIONS from @spring-book-club/shared-types
// Helper to convert RoleName to UserRole
const roleNameToUserRole = {
  [RoleName.Admin]: UserRole.Admin,
  [RoleName.Librarian]: UserRole.Librarian,
  [RoleName.Member]: UserRole.Member,
  [RoleName.PotentialMember]: UserRole.PotentialMember,
} as const;

// Helper functions that wrap shared permission functions
function hasRolePermission(role: RoleName, permission: Permission): boolean {
  const userRole = roleNameToUserRole[role];
  return hasPermission(userRole, permission);
}

function hasAnyRolePermission(role: RoleName, permissions: Permission[]): boolean {
  const userRole = roleNameToUserRole[role];
  return hasAnyPermission(userRole, permissions);
}

function hasAllRolePermissions(role: RoleName, permissions: Permission[]): boolean {
  const userRole = roleNameToUserRole[role];
  return hasAllPermissions(userRole, permissions);
}

// Middleware to require a specific permission
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(HttpCode.UNAUTHORIZED, '인증이 필요합니다.'));
    }
    
    const userRole = req.user.role as RoleName;
    
    if (hasRolePermission(userRole as RoleName, permission)) {
      return next();
    }
    
    return next(new AppError(HttpCode.FORBIDDEN, '접근 권한이 없습니다.'));
  };
}

// Middleware to require any of the specified permissions
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(HttpCode.UNAUTHORIZED, '인증이 필요합니다.'));
    }
    
    const userRole = req.user.role as RoleName;
    
    if (hasAnyRolePermission(userRole as RoleName, permissions)) {
      return next();
    }
    
    return next(new AppError(HttpCode.FORBIDDEN, '접근 권한이 없습니다.'));
  };
}

// Middleware to require all of the specified permissions
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(HttpCode.UNAUTHORIZED, '인증이 필요합니다.'));
    }
    
    const userRole = req.user.role as RoleName;
    
    if (hasAllRolePermissions(userRole as RoleName, permissions)) {
      return next();
    }
    
    return next(new AppError(HttpCode.FORBIDDEN, '접근 권한이 없습니다.'));
  };
}

// Middleware to check if a user is accessing their own resource
export function requireResourceOwnership(
  getResourceOwnerIdFn: (req: Request) => Promise<number | null> | number | null
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(HttpCode.UNAUTHORIZED, '인증이 필요합니다.'));
    }
    
    const userId = req.user.id;
    const userRole = req.user.role as RoleName;
    
    // If user is an admin, they can access any resource
    if (userRole === RoleName.Admin) {
      return next();
    }
    
    // Get the resource owner ID
    const ownerId = await getResourceOwnerIdFn(req);
    
    if (ownerId === null) {
      return next(new AppError(HttpCode.NOT_FOUND, '리소스를 찾을 수 없습니다.'));
    }
    
    if (userId === ownerId) {
      return next();
    }
    
    return next(new AppError(HttpCode.FORBIDDEN, '본인의 리소스만 접근할 수 있습니다.'));
  };
}

// Helper functions for common permission checks
export const isAdmin = (req: Request) => req.user?.role === RoleName.Admin;
export const isLibrarian = (req: Request) => req.user?.role === RoleName.Librarian;
export const isMember = (req: Request) => {
  const role = req.user?.role as RoleName | undefined;
  return role === RoleName.Admin || role === RoleName.Librarian || role === RoleName.Member;
};
export const isAuthenticated = (req: Request) => !!req.user;

// Middleware shortcuts for common role checks
export const adminOnly = requirePermission(Permission.APPROVE_USER);
export const librarianOnly = requirePermission(Permission.DELETE_USER);
export const membersOnly = requirePermission(Permission.VIEW_MEMBER_CONTENT);
export const publicAccess = requirePermission(Permission.VIEW_PUBLIC_CONTENT); 