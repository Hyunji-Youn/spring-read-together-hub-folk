import { Request, Response, NextFunction } from 'express';
import { AppError, HttpCode } from '../common/utils/app-error';

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
  console.error('Error:', error);

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

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        name: errorName,
        stack: error.stack,
        isOperational
      }
    })
  });
};

/**
 * 404 Not Found middleware
 * 
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HttpCode.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
}; 