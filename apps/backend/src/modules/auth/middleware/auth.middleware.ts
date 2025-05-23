import { Request, Response, NextFunction } from 'express';
import { jwtService, JwtPayload } from '../services/jwt.service';
import { RoleName } from '@prisma/client';
import { prisma } from '../../../config/database';

// Extend Express Request with user info
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
 * Middleware to verify JWT access token and add user to request
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: No token provided' 
      });
    }

    // Verify the token
    const payload = await jwtService.verifyToken(token);
    
    // Map the payload to user info
    req.user = {
      id: payload.sub,
      role: payload.role as RoleName,
      email: payload.email,
      username: payload.username
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed: Invalid token' 
    });
  }
};

/**
 * Middleware to require a specific role
 * 
 * @param roles - Allowed roles for this route
 */
export const requireRole = (roles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Must be used after requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Helper middleware to restrict routes to admin only
 */
export const requireAdmin = requireRole([RoleName.Admin]);

/**
 * Helper middleware to restrict routes to librarians and admins
 */
export const requireLibrarianOrAdmin = requireRole([RoleName.Admin, RoleName.Librarian]);

/**
 * Helper middleware to restrict routes to members, librarians and admins
 */
export const requireMember = requireRole([RoleName.Admin, RoleName.Librarian, RoleName.Member]);

/**
 * Define a permission enum for granular access control
 */
export enum Permission {
  // User management
  ViewUsers = 'view:users',
  CreateUser = 'create:user',
  UpdateUser = 'update:user',
  DeleteUser = 'delete:user',
  
  // Content management
  ViewContent = 'view:content',
  CreatePost = 'create:post',
  UpdatePost = 'update:post',
  DeletePost = 'delete:post',
  
  // Material management
  ViewMaterial = 'view:material',
  CreateMaterial = 'create:material',
  UpdateMaterial = 'update:material',
  DeleteMaterial = 'delete:material',
  
  // Schedule management
  ViewSchedule = 'view:schedule',
  CreateSchedule = 'create:schedule',
  UpdateSchedule = 'update:schedule',
  DeleteSchedule = 'delete:schedule',
  
  // Comment management
  CreateComment = 'create:comment',
  UpdateComment = 'update:comment',
  DeleteComment = 'delete:comment',
  
  // Read book management
  ViewReadBook = 'view:readbook',
  CreateReadBook = 'create:readbook',
  UpdateReadBook = 'update:readbook',
  DeleteReadBook = 'delete:readbook'
}

/**
 * Map roles to permissions
 */
const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [RoleName.Admin]: [
    // Admin has all permissions except DeleteUser (as specified in the PRD)
    Permission.ViewUsers,
    Permission.CreateUser,
    Permission.UpdateUser,
    
    Permission.ViewContent,
    Permission.CreatePost,
    Permission.UpdatePost,
    Permission.DeletePost,
    
    Permission.ViewMaterial,
    Permission.CreateMaterial,
    Permission.UpdateMaterial,
    Permission.DeleteMaterial,
    
    Permission.ViewSchedule,
    Permission.CreateSchedule,
    Permission.UpdateSchedule,
    Permission.DeleteSchedule,
    
    Permission.CreateComment,
    Permission.UpdateComment,
    Permission.DeleteComment,
    
    Permission.ViewReadBook,
    Permission.CreateReadBook,
    Permission.UpdateReadBook,
    Permission.DeleteReadBook
  ],
  [RoleName.Librarian]: [
    // Librarians have content management + DeleteUser permissions
    Permission.ViewUsers,
    Permission.UpdateUser,
    Permission.DeleteUser,
    
    Permission.ViewContent,
    Permission.CreatePost,
    Permission.UpdatePost,
    Permission.DeletePost,
    
    Permission.ViewMaterial,
    Permission.CreateMaterial,
    Permission.UpdateMaterial,
    Permission.DeleteMaterial,
    
    Permission.ViewSchedule,
    Permission.CreateSchedule,
    Permission.UpdateSchedule,
    Permission.DeleteSchedule,
    
    Permission.CreateComment,
    Permission.UpdateComment,
    Permission.DeleteComment,
    
    Permission.ViewReadBook,
    Permission.CreateReadBook,
    Permission.UpdateReadBook,
    Permission.DeleteReadBook
  ],
  [RoleName.Member]: [
    // Members have basic access
    Permission.ViewUsers,
    
    Permission.ViewContent,
    Permission.CreatePost,
    Permission.UpdatePost, // Can update own posts only
    Permission.DeletePost, // Can delete own posts only
    
    Permission.ViewMaterial,
    Permission.CreateMaterial,
    
    Permission.ViewSchedule,
    
    Permission.CreateComment,
    Permission.UpdateComment, // Can update own comments only
    Permission.DeleteComment, // Can delete own comments only
    
    Permission.ViewReadBook,
    Permission.CreateReadBook
  ],
  [RoleName.PotentialMember]: [
    // Potential members can only view public content
    Permission.ViewContent,
    Permission.ViewReadBook
  ]
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: RoleName, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a role has any of the given permissions
 */
export const hasAnyPermission = (role: RoleName, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the given permissions
 */
export const hasAllPermissions = (role: RoleName, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Middleware to require a specific permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Must be used after requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied: You don't have the required permission (${permission})` 
      });
    }

    next();
  };
};

/**
 * Middleware to require any of the specified permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Must be used after requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied: You don't have any of the required permissions` 
      });
    }

    next();
  };
};

/**
 * Middleware to require all of the specified permissions
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Must be used after requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied: You don't have all the required permissions` 
      });
    }

    next();
  };
};

/**
 * Middleware to check resource ownership
 * 
 * Supports posts, comments, materials, and schedules
 */
export const requireResourceOwnership = (resourceType: 'post' | 'comment' | 'material' | 'schedule') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Must be used after requireAuth middleware
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const userId = req.user.id;
      const resourceId = Number(req.params.id);

      if (!resourceId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Resource ID is required' 
        });
      }

      // Admin and Librarian bypass ownership check for most resources
      // But we exclude specific cases like content editing where even admins should follow the rules
      if ([RoleName.Admin, RoleName.Librarian].includes(req.user.role) && 
          resourceType !== 'comment') {
        return next();
      }

      let isOwner = false;

      switch (resourceType) {
        case 'post':
          const post = await prisma.posts.findUnique({
            where: { post_id: resourceId },
            select: { user_id: true }
          });
          isOwner = post?.user_id === userId;
          break;
          
        case 'comment':
          const comment = await prisma.comments.findUnique({
            where: { comment_id: resourceId },
            select: { user_id: true }
          });
          isOwner = comment?.user_id === userId;
          break;
          
        case 'material':
          const material = await prisma.materials.findUnique({
            where: { material_id: resourceId },
            select: { uploaded_by_id: true }
          });
          isOwner = material?.uploaded_by_id === userId;
          break;
          
        case 'schedule':
          const schedule = await prisma.schedules.findUnique({
            where: { schedule_id: resourceId },
            select: { created_by_id: true }
          });
          isOwner = schedule?.created_by_id === userId;
          break;
          
        default:
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid resource type' 
          });
      }

      if (!isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied: You don't own this ${resourceType}` 
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking resource ownership' 
      });
    }
  };
};

/**
 * Combine permission check with ownership check
 * Allows users to perform action if they either have admin permission
 * or they own the resource
 */
export const requirePermissionOrOwnership = (
  permission: Permission,
  resourceType: 'post' | 'comment' | 'material' | 'schedule'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Must be used after requireAuth middleware
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // If the user has the required permission, allow access
      if (hasPermission(req.user.role, permission)) {
        return next();
      }

      // Otherwise, check if they own the resource
      const userId = req.user.id;
      const resourceId = Number(req.params.id);

      if (!resourceId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Resource ID is required' 
        });
      }

      let isOwner = false;

      switch (resourceType) {
        case 'post':
          const post = await prisma.posts.findUnique({
            where: { post_id: resourceId },
            select: { user_id: true }
          });
          isOwner = post?.user_id === userId;
          break;
          
        case 'comment':
          const comment = await prisma.comments.findUnique({
            where: { comment_id: resourceId },
            select: { user_id: true }
          });
          isOwner = comment?.user_id === userId;
          break;
          
        case 'material':
          const material = await prisma.materials.findUnique({
            where: { material_id: resourceId },
            select: { uploaded_by_id: true }
          });
          isOwner = material?.uploaded_by_id === userId;
          break;
          
        case 'schedule':
          const schedule = await prisma.schedules.findUnique({
            where: { schedule_id: resourceId },
            select: { created_by_id: true }
          });
          isOwner = schedule?.created_by_id === userId;
          break;
          
        default:
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid resource type' 
          });
      }

      if (!isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied: Insufficient permissions and not the owner of this ${resourceType}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission or ownership check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions or ownership' 
      });
    }
  };
}; 