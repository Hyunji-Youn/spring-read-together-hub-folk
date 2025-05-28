import winston from 'winston';
import { env } from '../../config/env';

/**
 * Centralized logging utility using Winston
 * Provides structured logging with different levels and formats
 */

// Define log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug'
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create winston logger instance
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  format: logFormat,
  defaultMeta: { service: 'spring-backend' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: LogLevel.ERROR,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
});

// Create logs directory if it doesn't exist
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

/**
 * Enhanced logging methods with context
 */
export class Logger {
  private static formatMessage(message: string, context?: string): string {
    return context ? `[${context}] ${message}` : message;
  }

  static error(message: string, error?: Error | any, context?: string): void {
    const formattedMessage = this.formatMessage(message, context);
    if (error) {
      logger.error(formattedMessage, { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
    } else {
      logger.error(formattedMessage);
    }
  }

  static warn(message: string, meta?: any, context?: string): void {
    const formattedMessage = this.formatMessage(message, context);
    logger.warn(formattedMessage, meta);
  }

  static info(message: string, meta?: any, context?: string): void {
    const formattedMessage = this.formatMessage(message, context);
    logger.info(formattedMessage, meta);
  }

  static http(message: string, meta?: any, context?: string): void {
    const formattedMessage = this.formatMessage(message, context);
    logger.http(formattedMessage, meta);
  }

  static debug(message: string, meta?: any, context?: string): void {
    const formattedMessage = this.formatMessage(message, context);
    logger.debug(formattedMessage, meta);
  }

  // Auth-specific logging methods
  static authSuccess(message: string, userId?: number, username?: string): void {
    this.info(message, { userId, username, type: 'auth_success' }, 'AUTH');
  }

  static authFailure(message: string, username?: string, reason?: string): void {
    this.warn(message, { username, reason, type: 'auth_failure' }, 'AUTH');
  }

  // API-specific logging methods
  static apiRequest(method: string, url: string, userId?: number, ip?: string): void {
    this.http(`${method} ${url}`, { userId, ip, type: 'api_request' }, 'API');
  }

  static apiResponse(method: string, url: string, statusCode: number, duration?: number): void {
    this.http(`${method} ${url} - ${statusCode}`, { 
      statusCode, 
      duration,
      type: 'api_response' 
    }, 'API');
  }

  static apiError(method: string, url: string, statusCode: number, error: Error | string): void {
    this.error(`${method} ${url} - ${statusCode}`, error, 'API');
  }

  // Database-specific logging methods
  static dbQuery(query: string, duration?: number): void {
    this.debug(`Database query executed`, { query, duration, type: 'db_query' }, 'DB');
  }

  static dbError(operation: string, error: Error): void {
    this.error(`Database operation failed: ${operation}`, error, 'DB');
  }
}

// Export the raw winston logger for advanced usage
export { logger };
export default Logger;