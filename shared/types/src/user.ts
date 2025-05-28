import { User, ApplicationStatus, UserRole } from './auth';

/**
 * User Management DTOs
 */

export interface UpdateUserProfileDto {
  name?: string;
  email?: string;
  phone_number?: string;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
  assignRole?: UserRole;
  rejectionReason?: string;
}

export interface BatchRoleAssignmentDto {
  userIds: number[];
  role: UserRole;
}

/**
 * User with Role Information
 */
export interface UserWithRole extends User {
  role: {
    role_id: number;
    role_name: UserRole;
  };
}

/**
 * User Search/Filter Options
 */
export interface UserSearchOptions {
  status?: ApplicationStatus;
  role?: UserRole;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * User Statistics Response
 */
export interface UserStatisticsResponse {
  totalUsers: number;
  roleDistribution: Record<string, number>;
  applicationStatusDistribution: Record<string, number>;
  recentRegistrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}