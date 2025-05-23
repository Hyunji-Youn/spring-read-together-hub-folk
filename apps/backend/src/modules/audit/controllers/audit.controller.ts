import { Request, Response, NextFunction } from 'express';
import { AuditEventType, getAuditLogs } from '../services/audit.service';
import { AppError, HttpCode } from '../../../common/utils/app-error';

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogsController(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      eventType,
      userId,
      targetId,
      startDate,
      endDate,
      limit,
      offset
    } = req.query;

    // Parse date strings to Date objects if provided
    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    // Validate dates if provided
    if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid start date format'));
    }

    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid end date format'));
    }

    // Parse numeric query parameters
    const parsedUserId = userId ? parseInt(userId as string, 10) : undefined;
    const parsedTargetId = targetId ? parseInt(targetId as string, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset as string, 10) : undefined;

    // Validate numeric parameters
    if (parsedUserId && isNaN(parsedUserId)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid user ID format'));
    }

    if (parsedTargetId && isNaN(parsedTargetId)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid target ID format'));
    }

    if (parsedLimit && isNaN(parsedLimit)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid limit format'));
    }

    if (parsedOffset && isNaN(parsedOffset)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid offset format'));
    }

    // Validate event type if provided
    if (eventType && !Object.values(AuditEventType).includes(eventType as AuditEventType)) {
      return next(new AppError(HttpCode.BAD_REQUEST, 'Invalid event type'));
    }

    // Get audit logs with filtered parameters
    const result = await getAuditLogs({
      eventType: eventType as AuditEventType,
      userId: parsedUserId,
      targetId: parsedTargetId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
} 