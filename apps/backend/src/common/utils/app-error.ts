export enum HttpCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

interface AppErrorArgs {
  name?: string;
  httpCode: HttpCode;
  message: string;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly name: string;
  public readonly httpCode: HttpCode;
  public readonly isOperational: boolean = true;

  constructor(httpCode: HttpCode, message: string, name: string = 'Error', isOperational: boolean = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.httpCode = httpCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }
}

/**
 * Specific Error Classes
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(HttpCode.BAD_REQUEST, message, 'ValidationError');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(HttpCode.NOT_FOUND, `${resource} not found`, 'NotFoundError');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(HttpCode.UNAUTHORIZED, message, 'UnauthorizedError');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(HttpCode.FORBIDDEN, message, 'ForbiddenError');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(HttpCode.CONFLICT, message, 'ConflictError');
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError?: Error) {
    const message = `Database error during ${operation}`;
    super(HttpCode.INTERNAL_SERVER_ERROR, message, 'DatabaseError');
    
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
} 