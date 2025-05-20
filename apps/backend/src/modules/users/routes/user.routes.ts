import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware, roleGuard } from '../../../middlewares/auth.middleware';
import { RoleName } from '@prisma/client';

const router = Router();

// Route to get all users (Admin only)
// Example: GET /api/users?status=pending_approval
router.get(
  '/',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  userController.getUsers
);

// Route to update a user's application status (Admin only)
// Example: PUT /api/users/123/application-status
router.put(
  '/:userId/application-status',
  authMiddleware,
  roleGuard([RoleName.Admin]),
  userController.updateUserApplication
);

// Route to get the current user's profile
// Example: GET /api/users/me
router.get(
  '/me',
  authMiddleware,
  userController.getCurrentUserProfile
);

// Route for updating current user's profile
// Example: PUT /api/users/me
router.put(
  '/me',
  authMiddleware,
  userController.updateCurrentUserProfile
);

// You can add other user-related routes here
// Example: PUT /api/users/me (for profile update)
// router.put('/me', authMiddleware, userController.updateCurrentUserProfile);

export default router; 