import { Router } from 'express';
import { getAuditLogsController } from '../controllers/audit.controller';
import { requireAuth, requireAdmin } from '../../auth/middleware/auth.middleware';

const router = Router();

/**
 * Route to get audit logs (Admin only)
 * Example: GET /api/audit/logs?eventType=USER_ROLE_CHANGED&startDate=2023-01-01
 */
router.get(
  '/logs',
  requireAuth,
  requireAdmin,
  getAuditLogsController
);

export default router; 