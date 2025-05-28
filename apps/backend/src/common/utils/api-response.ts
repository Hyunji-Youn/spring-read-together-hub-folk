import { Response } from 'express';

/**
 * Standardized API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Success Response Builder
 */
export class ResponseBuilder {
  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static successWithPagination<T>(
    data: T,
    pagination: { page: number; limit: number; total: number },
    message?: string
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          ...pagination,
          totalPages: Math.ceil(pagination.total / pagination.limit),
        },
      },
    };
  }

  static error(
    message: string,
    errors?: Array<{ field: string; message: string }>
  ): ApiResponse<null> {
    return {
      success: false,
      data: null,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Express Response Helper Methods
 */
export class ApiResponseHelper {
  static success<T>(res: Response, data?: T, message?: string, statusCode = 200) {
    return res.status(statusCode).json(ResponseBuilder.success(data, message));
  }

  static successWithPagination<T>(
    res: Response,
    data: T,
    pagination: { page: number; limit: number; total: number },
    message?: string,
    statusCode = 200
  ) {
    return res.status(statusCode).json(
      ResponseBuilder.successWithPagination(data, pagination, message)
    );
  }

  static created<T>(res: Response, data?: T, message = 'Resource created successfully') {
    return res.status(201).json(ResponseBuilder.success(data, message));
  }

  static badRequest(
    res: Response,
    message = 'Bad request',
    errors?: Array<{ field: string; message: string }>
  ) {
    return res.status(400).json(ResponseBuilder.error(message, errors));
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return res.status(401).json(ResponseBuilder.error(message));
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return res.status(403).json(ResponseBuilder.error(message));
  }

  static notFound(res: Response, message = 'Resource not found') {
    return res.status(404).json(ResponseBuilder.error(message));
  }

  static conflict(res: Response, message = 'Conflict') {
    return res.status(409).json(ResponseBuilder.error(message));
  }

  static validationError(
    res: Response,
    errors: Array<{ field: string; message: string }>,
    message = 'Validation failed'
  ) {
    return res.status(422).json(ResponseBuilder.error(message, errors));
  }

  static internalServerError(res: Response, message = 'Internal server error') {
    return res.status(500).json(ResponseBuilder.error(message));
  }
}