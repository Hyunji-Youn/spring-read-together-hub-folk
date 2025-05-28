import { PrismaClient } from '@prisma/client';
import { 
  AppError, 
  HttpCode, 
  DatabaseError, 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../utils/app-error';

/**
 * Base Service Class
 * Provides common database operations and error handling
 */
export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Handle database errors consistently
   */
  protected handleDatabaseError(error: any, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    
    // Handle known Prisma errors
    if (error.code === 'P2002') {
      throw new ConflictError('Resource already exists');
    }
    
    if (error.code === 'P2025') {
      throw new NotFoundError();
    }
    
    if (error.code === 'P2003') {
      throw new ValidationError('Foreign key constraint failed');
    }
    
    // Generic database error
    throw new DatabaseError(operation, error);
  }

  /**
   * Validate that required fields are provided
   */
  protected validateRequiredFields(data: any, fields: string[]): void {
    const missingFields = fields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Check if resource exists by ID
   */
  protected async checkResourceExists(model: any, id: number, resourceName: string): Promise<void> {
    const exists = await model.findUnique({ where: { [`${resourceName}_id`]: id } });
    
    if (!exists) {
      throw new NotFoundError(resourceName);
    }
  }
}