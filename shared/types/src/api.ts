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
    pagination?: PaginationMeta;
  };
}

/**
 * Pagination Meta Information
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination Request Parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sorting Parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Parameters
 */
export interface SearchParams {
  search?: string;
  filters?: Record<string, any>;
}

/**
 * Combined Query Parameters
 */
export interface QueryParams extends PaginationParams, SortParams, SearchParams {}

/**
 * HTTP Error Response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  meta: {
    timestamp: string;
    error?: {
      name: string;
      stack?: string;
      isOperational?: boolean;
    };
  };
}

/**
 * API Request/Response Types for Common Operations
 */

// User Management
export interface UserListRequest extends QueryParams {
  status?: string;
  role?: string;
}

export interface UserListResponse extends ApiResponse<any[]> {
  meta: {
    timestamp: string;
    pagination: PaginationMeta;
  };
}

// Statistics
export interface UserStatistics {
  totalUsers: number;
  roleDistribution: Record<string, number>;
  applicationStatusDistribution: Record<string, number>;
  recentRegistrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}