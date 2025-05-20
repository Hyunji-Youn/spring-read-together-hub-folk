import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { UpdateApplicationStatusDto, UpdateUserProfileDto } from '../dto/user.dto';
import { ApplicationStatus, RoleName } from '@prisma/client';
import { AppError, HttpCode } from '../../../common/utils/app-error';

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
    if (updateDto.assignRole && !Object.values(RoleName).includes(updateDto.assignRole)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid role specified for assignment.'));
    }

    const updatedUser = await userService.updateUserApplicationStatus(userId, updateDto);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // The user ID is stored in req.user.userId by the authMiddleware
    const userId = (req.user as { userId: number }).userId;
    
    const userProfile = await userService.getUserProfile(userId);
    if (!userProfile) {
      return next(new AppError(HttpCode.NOT_FOUND, 'User profile not found.'));
    }
    
    res.status(200).json({ success: true, data: userProfile });
  } catch (error) {
    next(error);
  }
}

export async function updateCurrentUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // The user ID is stored in req.user.userId by the authMiddleware
    const userId = (req.user as { userId: number }).userId;
    
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