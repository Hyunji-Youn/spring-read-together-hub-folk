import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth, requireAdmin, requireLibrarianOrAdmin } from '../../auth/middleware/auth.middleware';
import { Permission, requirePermission } from '../../auth/middleware/auth.middleware';

const router = Router();

// Admin dashboard routes

// Route to get user statistics for admin dashboard (Admin only)
// Example: GET /api/users/statistics
router.get(
  '/statistics',
  requireAuth,
  requireAdmin,
  userController.getUserStatistics
);

// Route to get users with advanced filtering, pagination, and sorting (Admin only)
// Example: GET /api/users/search?status=pending_approval&role=Member&search=john&limit=10&offset=0&sortBy=created_at&sortOrder=desc
router.get(
  '/search',
  requireAuth,
  requireAdmin,
  userController.getUsersWithOptions
);

// Route to get all users (Admin only)
// Example: GET /api/users?status=pending_approval
router.get(
  '/',
  requireAuth,
  requirePermission(Permission.ViewUsers),
  userController.getUsers
);

// Route to update a user's application status (Admin only)
// Example: PUT /api/users/123/application-status
router.put(
  '/:userId/application-status',
  requireAuth,
  requireAdmin,
  userController.updateUserApplication
);

// Route for batch role assignment (Admin only)
// Example: POST /api/users/batch-assign-roles
router.post(
  '/batch-assign-roles',
  requireAuth,
  requireAdmin,
  userController.batchAssignRoles
);

// Route to get the current user's profile
// Example: GET /api/users/me
router.get(
  '/me',
  requireAuth,
  userController.getCurrentUserProfile
);

// Route for updating current user's profile
// Example: PUT /api/users/me
router.put(
  '/me',
  requireAuth,
  userController.updateCurrentUserProfile
);

// You can add other user-related routes here
// Example: PUT /api/users/me (for profile update)
// router.put('/me', authMiddleware, userController.updateCurrentUserProfile);

export default router; 