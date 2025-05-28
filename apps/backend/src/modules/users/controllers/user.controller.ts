import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { UpdateApplicationStatusDto, UpdateUserProfileDto, BatchRoleAssignmentDto, batchRoleAssignmentSchema } from '../dto/user.dto';
import { ApplicationStatus, RoleName } from '@prisma/client';
import { AppError, HttpCode } from '../../../common/utils/app-error';
import { AuditEventType, createAuditLog } from '../../audit/services/audit.service';

/**
 * Get user statistics for admin dashboard
 */
export async function getUserStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('Getting user statistics...');
    console.log('User info from token:', {
      id: req.user?.id,
      role: req.user?.role,
      username: req.user?.username
    });
    
    const stats = await userService.getUserStatistics();
    console.log('Statistics result:', stats);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error in getUserStatistics controller:', error);
    next(error);
  }
}

/**
 * Get users with pagination, sorting, and advanced filtering options
 */
export async function getUsersWithOptions(req: Request, res: Response, next: NextFunction) {
  try {
    const { 
      status, 
      role, 
      search, 
      limit = '10', 
      offset = '0',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    
    // Parse and validate limit and offset
    const parsedLimit = parseInt(limit as string, 10);
    const parsedOffset = parseInt(offset as string, 10);
    
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid limit value. Must be a positive number.'));
    }
    
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid offset value. Must be a non-negative number.'));
    }
    
    // Validate status if provided
    if (status && !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid application status.'));
    }
    
    // Validate role if provided
    if (role && !Object.values(RoleName).includes(role as RoleName)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid role.'));
    }
    
    // Validate sort order
    if (sortOrder && !['asc', 'desc'].includes(sortOrder as string)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid sort order. Must be "asc" or "desc".'));
    }
    
    const result = await userService.getUsersWithOptions({
      status: status as ApplicationStatus,
      role: role as RoleName,
      search: search as string,
      limit: parsedLimit,
      offset: parsedOffset,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
    });
    
    res.status(200).json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + result.users.length < result.total
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all users with optional status filter
 */
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as ApplicationStatus | undefined;
    if (status && !Object.values(ApplicationStatus).includes(status)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid application status filter.'));
    }
    const users = await userService.getAllUsers(status ? { application_status: status } : undefined);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a user's application status
 */
export async function updateUserApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid user ID.'));
    }
    const updateDto: UpdateApplicationStatusDto = req.body;

    if (!updateDto.status || !Object.values(ApplicationStatus).includes(updateDto.status)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid application status provided.'));
    }
    
    // Enhanced validation for role assignment
    if (updateDto.status === ApplicationStatus.approved) {
      if (!updateDto.assignRole) {
        return next(new AppError(HttpCode.BAD_REQUEST, 'Role assignment is required when approving an application.'));
      }
      
      if (!Object.values(RoleName).includes(updateDto.assignRole)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid role specified for assignment.'));
    }

      // Admin role cannot be assigned through this endpoint for security reasons
      if (updateDto.assignRole && updateDto.assignRole.toString() === 'Admin') {
        return next(new AppError(HttpCode.FORBIDDEN, 'Admin role cannot be assigned through this endpoint for security reasons.'));
      }
    }
    
    // For rejections, we allow an optional reason
    let rejectionReason: string | undefined;
    if (updateDto.status === ApplicationStatus.rejected) {
      rejectionReason = updateDto.rejectionReason;
      
      // Validate that the reason is not too long
      if (rejectionReason && rejectionReason.length > 1000) {
        return next(new AppError(HttpCode.BAD_REQUEST, 'Rejection reason is too long. Maximum 1000 characters allowed.'));
      }
    }

    // Get the user applying the change (the admin)
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      return next(new AppError(HttpCode.UNAUTHORIZED, 'Admin user ID not found in token.'));
    }

    // Check that admin user is not updating their own status
    if (adminUserId === userId) {
      return next(new AppError(HttpCode.FORBIDDEN, 'You cannot update your own application status.'));
    }
    
    // Check that the user exists and get their current status
    const userToUpdate = await userService.findUserById(userId);
    if (!userToUpdate) {
      return next(new AppError(HttpCode.NOT_FOUND, 'User not found.'));
    }
    
    // Prevent changing status if the user is already in the requested status
    if (userToUpdate.application_status === updateDto.status) {
      return next(new AppError(HttpCode.BAD_REQUEST, `User application is already in '${updateDto.status}' status.`));
    }
    
    // Update the user's application status with appropriate audit and notifications
    const updatedUser = await userService.updateUserApplicationStatus(userId, updateDto, adminUserId, rejectionReason);
      
    res.status(200).json({ 
      success: true, 
      message: `User application ${updateDto.status === ApplicationStatus.approved 
        ? 'approved successfully. The user will receive an email notification.' 
        : 'rejected. The user has been notified of this decision.'}`,
      data: updatedUser 
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    console.error('Error updating user application:', error);
    next(new AppError(HttpCode.INTERNAL_SERVER_ERROR, 'An unexpected error occurred while processing your request.'));
  }
}

/**
 * Batch assign roles to multiple users
 */
export async function batchAssignRoles(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate request body
    const result = batchRoleAssignmentSchema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(
        HttpCode.BAD_REQUEST, 
        'Invalid request data', 
        result.error.errors.map(err => err.message).join(', ')
      ));
    }

    const batchDto: BatchRoleAssignmentDto = result.data;

    // Get admin user ID from the JWT token
    const adminUserId = req.user?.id;
    if (!adminUserId) {
      return next(new AppError(HttpCode.UNAUTHORIZED, 'Admin user ID not found in token.'));
    }

    const updatedUsers = await userService.batchAssignRoles(batchDto, adminUserId);
    
    res.status(200).json({
      success: true,
      message: `Successfully assigned role ${batchDto.role} to ${updatedUsers.length} user(s)`,
      data: updatedUsers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // The user ID is stored in req.user.id by the authMiddleware
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError(HttpCode.UNAUTHORIZED, 'User ID not found in token.'));
    }
    
    const userProfile = await userService.getUserProfile(userId);
    if (!userProfile) {
      return next(new AppError(HttpCode.NOT_FOUND, 'User profile not found.'));
    }
    
    res.status(200).json({ success: true, data: userProfile });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user's profile
 */
export async function updateCurrentUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // The user ID is stored in req.user.id by the authMiddleware
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError(HttpCode.UNAUTHORIZED, 'User ID not found in token.'));
    }
    
    // Only allow updating allowed fields (name, email, phone_number)
    const updateData: UpdateUserProfileDto = {
      name: req.body.name,
      email: req.body.email,
      phone_number: req.body.phone_number
    };
    
    // Validate the data
    if (!updateData.name && !updateData.email && !updateData.phone_number) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'No valid fields to update were provided.'));
    }
    
    const updatedProfile = await userService.updateUserProfile(userId, updateData);
    if (!updatedProfile) {
      return next(new AppError(HttpCode.NOT_FOUND, 'User profile not found.'));
    }
    
    res.status(200).json({ success: true, data: updatedProfile });
  } catch (error) {
    next(error);
  }
} 