import { Request, Response, NextFunction } from 'express';
import Logger from '../common/utils/logger';

/**
 * Request logging middleware
 * Logs all incoming requests and outgoing responses
 */

interface RequestWithStartTime extends Request {
  startTime?: number;
}

/**
 * Request logging middleware that captures request details and response times
 */
export const requestLogger = (req: RequestWithStartTime, res: Response, next: NextFunction) => {
  // Record start time
  req.startTime = Date.now();
  
  // Extract user info if available (from JWT token)
  const userId = (req as any).user?.id;
  const username = (req as any).user?.username;
  
  // Log incoming request
  Logger.apiRequest(
    req.method, 
    req.originalUrl, 
    userId,
    req.ip || req.connection.remoteAddress
  );
  
  // Log additional request details for debugging
  Logger.debug('Request details', {
    method: req.method,
    url: req.originalUrl,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers.origin,
      'authorization': req.headers.authorization ? 'Present (Hidden)' : 'None'
    },
    query: req.query,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    userId,
    username
  }, 'REQUEST');

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    // Calculate response time
    const duration = req.startTime ? Date.now() - req.startTime : undefined;
    
    // Log response
    Logger.apiResponse(req.method, req.originalUrl, res.statusCode, duration);
    
    // Log response details for non-2xx status codes
    if (res.statusCode >= 400) {
      Logger.warn('Response with error status', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId,
        username
      }, 'RESPONSE');
    }
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeBody(body: any): any {
  if (!body) return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Error response logging middleware
 */
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const duration = (req as RequestWithStartTime).startTime 
    ? Date.now() - (req as RequestWithStartTime).startTime! 
    : undefined;

  // Log the error with full details
  Logger.apiError(req.method, req.originalUrl, res.statusCode || 500, error);
  
  // Log additional error context
  Logger.error('Request resulted in error', error, 'ERROR_HANDLER');
  
  next(error);
};

/**
 * Authentication logging middleware
 */
export const authLogger = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const hasToken = !!authHeader;
  
  Logger.debug('Authentication check', {
    url: req.originalUrl,
    method: req.method,
    hasAuthHeader: hasToken,
    tokenType: hasToken ? authHeader?.split(' ')[0] : 'None'
  }, 'AUTH_CHECK');
  
  next();
};