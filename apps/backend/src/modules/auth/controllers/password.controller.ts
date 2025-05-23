import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { passwordService } from '../services/password.service';
import { passwordChangeRequestSchema } from '../dto/auth.dto';

/**
 * Handle password change request
 * 
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    // Validate the request against the schema
    const result = passwordChangeRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: result.error.errors
      });
    }

    const { current_password, new_password } = result.data;

    // Get authenticated user from middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user with password hash
    const user = await prisma.users.findUnique({
      where: { user_id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await passwordService.verifyPassword(
      user.password_hash,
      current_password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await passwordService.hashPassword(new_password);

    // Update password in database
    await prisma.users.update({
      where: { user_id: req.user.id },
      data: { password_hash: newPasswordHash }
    });

    // Revoke all refresh tokens for the user (optional security measure)
    // This forces the user to log in again with the new password
    await prisma.refreshTokens.updateMany({
      where: { user_id: req.user.id },
      data: { is_revoked: true }
    });

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh'
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while changing your password'
    });
  }
}; 