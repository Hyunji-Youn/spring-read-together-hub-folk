import { Request, Response, NextFunction } from 'express';
import { AppError, HttpCode } from '../common/utils/app-error';
import { ApiResponseHelper } from '../common/utils/api-response';
import { ZodError } from 'zod';
import Logger from '../common/utils/logger';

/**
 * Global error handling middleware
 * 
 * Processes all errors that are passed to next() and sends appropriate response
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Enhanced error logging with context
  Logger.error('Global error handler triggered', error, 'ERROR_MIDDLEWARE');
  
  // Log request context that led to the error
  Logger.error('Error request context', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: (req as any).user?.id,
    username: (req as any).user?.username
  }, 'ERROR_CONTEXT');

  // Default error values
  let statusCode = HttpCode.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errorName = error.name || 'Error';
  let isOperational = false;
  
  // If it's our custom AppError, use its properties
  if (error instanceof AppError) {
    statusCode = error.httpCode;
    message = error.message;
    errorName = error.name;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    // Handle validation errors (like Zod or Joi)
    statusCode = HttpCode.BAD_REQUEST;
    message = error.message;
    isOperational = true;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    // Handle JWT errors
    statusCode = HttpCode.UNAUTHORIZED;
    message = 'Authentication failed: Invalid or expired token';
    isOperational = true;
  } else if (error instanceof SyntaxError && 'body' in error) {
    // Handle JSON parsing errors
    statusCode = HttpCode.BAD_REQUEST;
    message = 'Invalid JSON';
    isOperational = true;
  }

  // Handle different error types with appropriate responses
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return ApiResponseHelper.validationError(res, validationErrors);
  }
  
  // Send standardized error response
  const errorResponse = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        error: {
          name: errorName,
          stack: error.stack,
          isOperational
        }
      })
    }
  };
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found middleware
 * 
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  Logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  }, 'NOT_FOUND');
  
  ApiResponseHelper.notFound(res, `Route not found: ${req.originalUrl}`);
}; 