import { UserRole } from './auth';

/**
 * Permission Enum
 * Comprehensive list of all system permissions
 */
export enum Permission {
  // User management
  VIEW_USERS = 'view:users',
  CREATE_USER = 'create:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  APPROVE_USER = 'approve:user',
  
  // Content management
  VIEW_CONTENT = 'view:content',
  VIEW_PUBLIC_CONTENT = 'view:public-content',
  VIEW_MEMBER_CONTENT = 'view:member-content',
  CREATE_POST = 'create:post',
  UPDATE_POST = 'update:post',
  DELETE_POST = 'delete:post',
  EDIT_OWN_POST = 'edit:own-post',
  EDIT_ANY_POST = 'edit:any-post',
  DELETE_OWN_POST = 'delete:own-post',
  DELETE_ANY_POST = 'delete:any-post',
  
  // Material management
  VIEW_MATERIAL = 'view:material',
  CREATE_MATERIAL = 'create:material',
  UPDATE_MATERIAL = 'update:material',
  DELETE_MATERIAL = 'delete:material',
  UPLOAD_MATERIAL = 'upload:material',
  EDIT_OWN_MATERIAL = 'edit:own-material',
  EDIT_ANY_MATERIAL = 'edit:any-material',
  DELETE_OWN_MATERIAL = 'delete:own-material',
  DELETE_ANY_MATERIAL = 'delete:any-material',
  
  // Schedule/Event management
  VIEW_SCHEDULE = 'view:schedule',
  VIEW_EVENTS = 'view:events',
  CREATE_SCHEDULE = 'create:schedule',
  CREATE_EVENT = 'create:event',
  UPDATE_SCHEDULE = 'update:schedule',
  EDIT_EVENT = 'edit:event',
  DELETE_SCHEDULE = 'delete:schedule',
  DELETE_EVENT = 'delete:event',
  
  // Comment management
  CREATE_COMMENT = 'create:comment',
  UPDATE_COMMENT = 'update:comment',
  DELETE_COMMENT = 'delete:comment',
  
  // Read book management
  VIEW_READ_BOOK = 'view:readbook',
  CREATE_READ_BOOK = 'create:readbook',
  UPDATE_READ_BOOK = 'update:readbook',
  DELETE_READ_BOOK = 'delete:readbook',
  
  // Chat/Communication
  USE_CHAT = 'use:chat',
  DELETE_OWN_CHAT = 'delete:own-chat',
  DELETE_ANY_CHAT = 'delete:any-chat',
}

/**
 * Role to Permission Mapping
 * Single source of truth for RBAC
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.Admin]: [
    // Admin has all permissions except DELETE_USER
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.APPROVE_USER,
    
    Permission.VIEW_CONTENT,
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.UPDATE_POST,
    Permission.DELETE_POST,
    Permission.EDIT_OWN_POST,
    Permission.EDIT_ANY_POST,
    Permission.DELETE_OWN_POST,
    Permission.DELETE_ANY_POST,
    
    Permission.VIEW_MATERIAL,
    Permission.CREATE_MATERIAL,
    Permission.UPDATE_MATERIAL,
    Permission.DELETE_MATERIAL,
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.EDIT_ANY_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    Permission.DELETE_ANY_MATERIAL,
    
    Permission.VIEW_SCHEDULE,
    Permission.VIEW_EVENTS,
    Permission.CREATE_SCHEDULE,
    Permission.CREATE_EVENT,
    Permission.UPDATE_SCHEDULE,
    Permission.EDIT_EVENT,
    Permission.DELETE_SCHEDULE,
    Permission.DELETE_EVENT,
    
    Permission.CREATE_COMMENT,
    Permission.UPDATE_COMMENT,
    Permission.DELETE_COMMENT,
    
    Permission.VIEW_READ_BOOK,
    Permission.CREATE_READ_BOOK,
    Permission.UPDATE_READ_BOOK,
    Permission.DELETE_READ_BOOK,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
    Permission.DELETE_ANY_CHAT,
  ],
  
  [UserRole.Librarian]: [
    // Librarians have content management + DELETE_USER permissions
    Permission.VIEW_USERS,
    Permission.UPDATE_USER,
    Permission.DELETE_USER, // Only librarians can delete users
    
    Permission.VIEW_CONTENT,
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.UPDATE_POST,
    Permission.DELETE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    
    Permission.VIEW_MATERIAL,
    Permission.CREATE_MATERIAL,
    Permission.UPDATE_MATERIAL,
    Permission.DELETE_MATERIAL,
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    
    Permission.VIEW_SCHEDULE,
    Permission.VIEW_EVENTS,
    Permission.CREATE_SCHEDULE,
    Permission.CREATE_EVENT,
    Permission.UPDATE_SCHEDULE,
    Permission.EDIT_EVENT,
    Permission.DELETE_SCHEDULE,
    Permission.DELETE_EVENT,
    
    Permission.CREATE_COMMENT,
    Permission.UPDATE_COMMENT,
    Permission.DELETE_COMMENT,
    
    Permission.VIEW_READ_BOOK,
    Permission.CREATE_READ_BOOK,
    Permission.UPDATE_READ_BOOK,
    Permission.DELETE_READ_BOOK,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
  ],
  
  [UserRole.Member]: [
    // Members have basic access
    Permission.VIEW_USERS,
    
    Permission.VIEW_CONTENT,
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.UPDATE_POST, // Can update own posts only
    Permission.DELETE_POST, // Can delete own posts only
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    
    Permission.VIEW_MATERIAL,
    Permission.CREATE_MATERIAL,
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    
    Permission.VIEW_SCHEDULE,
    Permission.VIEW_EVENTS,
    
    Permission.CREATE_COMMENT,
    Permission.UPDATE_COMMENT, // Can update own comments only
    Permission.DELETE_COMMENT, // Can delete own comments only
    
    Permission.VIEW_READ_BOOK,
    Permission.CREATE_READ_BOOK,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
  ],
  
  [UserRole.PotentialMember]: [
    // Potential members can only view public content
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_READ_BOOK,
  ],
};

/**
 * Permission Helper Functions
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};