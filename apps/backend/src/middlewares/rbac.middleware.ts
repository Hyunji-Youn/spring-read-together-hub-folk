import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, HttpCode } from '../common/utils/app-error';

// Define the permissions for each resource
export enum Permission {
  // User management
  VIEW_USERS = 'view:users',
  CREATE_USER = 'create:user',
  EDIT_USER = 'edit:user',
  APPROVE_USER = 'approve:user',
  DELETE_USER = 'delete:user',
  
  // Content
  VIEW_PUBLIC_CONTENT = 'view:public-content',
  VIEW_MEMBER_CONTENT = 'view:member-content',
  CREATE_POST = 'create:post',
  EDIT_OWN_POST = 'edit:own-post',
  EDIT_ANY_POST = 'edit:any-post',
  DELETE_OWN_POST = 'delete:own-post',
  DELETE_ANY_POST = 'delete:any-post',
  
  // Materials
  UPLOAD_MATERIAL = 'upload:material',
  EDIT_OWN_MATERIAL = 'edit:own-material',
  EDIT_ANY_MATERIAL = 'edit:any-material',
  DELETE_OWN_MATERIAL = 'delete:own-material',
  DELETE_ANY_MATERIAL = 'delete:any-material',
  
  // Events
  VIEW_EVENTS = 'view:events',
  CREATE_EVENT = 'create:event',
  EDIT_EVENT = 'edit:event',
  DELETE_EVENT = 'delete:event',
  
  // Chat (Sudabang)
  USE_CHAT = 'use:chat',
  DELETE_OWN_CHAT = 'delete:own-chat',
  DELETE_ANY_CHAT = 'delete:any-chat',
}

// Map roles to permissions
const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [RoleName.Admin]: [
    // All permissions except DELETE_USER
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.APPROVE_USER,
    
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.EDIT_ANY_POST,
    Permission.DELETE_OWN_POST,
    Permission.DELETE_ANY_POST,
    
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.EDIT_ANY_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    Permission.DELETE_ANY_MATERIAL,
    
    Permission.VIEW_EVENTS,
    Permission.CREATE_EVENT,
    Permission.EDIT_EVENT,
    Permission.DELETE_EVENT,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
    Permission.DELETE_ANY_CHAT,
  ],
  
  [RoleName.Librarian]: [
    Permission.VIEW_USERS,
    Permission.DELETE_USER, // Only Librarians can delete users
    
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    
    Permission.VIEW_EVENTS,
    Permission.CREATE_EVENT, // Librarians can manage events
    Permission.EDIT_EVENT,
    Permission.DELETE_EVENT,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
  ],
  
  [RoleName.Member]: [
    Permission.VIEW_USERS,
    
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    
    Permission.VIEW_EVENTS,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
  ],
  
  [RoleName.PotentialMember]: [
    Permission.VIEW_PUBLIC_CONTENT,
  ],
};

// Check if a role has a specific permission
function hasPermission(role: RoleName, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

// Check if a role has any of the specified permissions
function hasAnyPermission(role: RoleName, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Check if a role has all of the specified permissions
function hasAllPermissions(role: RoleName, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Middleware to require a specific permission
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(HttpCode.UNAUTHORIZED, '인증이 필요합니다.'));
    }
    
    const userRole = req.user.role as RoleName;
    
    if (hasPermission(userRole, permission)) {
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
    
    if (hasAnyPermission(userRole, permissions)) {
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
    
    if (hasAllPermissions(userRole, permissions)) {
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
    
    const userId = req.user.userId;
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