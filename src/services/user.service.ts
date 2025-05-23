import api from '../lib/api';
import { AxiosResponse, AxiosError } from 'axios';

export interface UserProfile {
  user_id: number;
  username: string;
  name: string;
  email: string;
  phone_number: string;
  application_status: 'pending_approval' | 'approved' | 'rejected';
  role: {
    role_id: number;
    role_name: 'Admin' | 'Librarian' | 'Member' | 'PotentialMember';
  };
  created_at: string;
  updated_at: string;
  requested_librarian_role_on_application: boolean;
}

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

export interface AuditLogEntry {
  log_id: number;
  event_type: string;
  user_id: number;
  target_id: number | null;
  details: Record<string, any>;
  created_at: string;
  user?: {
    username: string;
    name: string;
  };
  target?: {
    username: string;
    name: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Get user statistics for admin dashboard
export const getUserStatistics = async (): Promise<UserStatistics> => {
  try {
    const response: AxiosResponse<ApiResponse<UserStatistics>> = await api.get('/users/statistics');
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      console.error('Rate limit exceeded when fetching user statistics. Too many requests.');
    } else {
      console.error('Failed to fetch user statistics:', error);
    }
    throw error;
  }
};

// Get users with advanced filtering and pagination
export const getUsersWithOptions = async (options: {
  status?: string;
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedResponse<UserProfile>> => {
  try {
    // Build query string from options
    const queryParams = new URLSearchParams();
    if (options.status) queryParams.append('status', options.status);
    if (options.role) queryParams.append('role', options.role);
    if (options.search) queryParams.append('search', options.search);
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.offset) queryParams.append('offset', options.offset.toString());
    if (options.sortBy) queryParams.append('sortBy', options.sortBy);
    if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
    
    const response: AxiosResponse<PaginatedResponse<UserProfile>> = 
      await api.get(`/users/search?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      console.error('Rate limit exceeded when fetching filtered users. Too many requests.');
    } else {
      console.error('Failed to fetch filtered users:', error);
    }
    throw error;
  }
};

// Get audit logs with filtering
export const getAuditLogs = async (options: {
  eventType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> => {
  try {
    // Build query string from options
    const queryParams = new URLSearchParams();
    if (options.eventType) queryParams.append('eventType', options.eventType);
    if (options.userId) queryParams.append('userId', options.userId.toString());
    if (options.startDate) queryParams.append('startDate', options.startDate);
    if (options.endDate) queryParams.append('endDate', options.endDate);
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.offset) queryParams.append('offset', options.offset.toString());
    
    const response: AxiosResponse<ApiResponse<AuditLogEntry[]>> = 
      await api.get(`/audit/logs?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      console.error('Rate limit exceeded when fetching audit logs. Too many requests.');
    } else {
      console.error('Failed to fetch audit logs:', error);
    }
    throw error;
  }
};

// Get user profile information
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response: AxiosResponse<ApiResponse<UserProfile>> = await api.get('/users/me');
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      console.error('Rate limit exceeded when fetching profile. Too many requests.');
    } else {
      console.error('Failed to fetch user profile:', error);
    }
    throw error;
  }
};

// Update user profile (API not yet implemented)
export const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const response: AxiosResponse<ApiResponse<UserProfile>> = await api.put('/users/me', data);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      console.error('Rate limit exceeded when updating profile. Too many requests.');
    } else {
      console.error('Failed to update user profile:', error);
    }
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsers = async (status?: string): Promise<UserProfile[]> => {
  try {
    const url = status ? `/users?status=${status}` : '/users';
    const response: AxiosResponse<ApiResponse<UserProfile[]>> = await api.get(url);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      console.error('Rate limit exceeded when fetching users. Too many requests.');
    } else {
      console.error('Failed to fetch users:', error);
    }
    throw error;
  }
};

// Update user application status (admin only)
export const updateUserApplicationStatus = async (
  userId: number, 
  status: 'approved' | 'rejected',
  assignRole?: 'Member' | 'Librarian'
): Promise<UserProfile> => {
  try {
    const requestData: { status: string; assignRole?: string } = { status };
    
    // Only include assignRole if provided and status is 'approved'
    if (status === 'approved' && assignRole) {
      requestData.assignRole = assignRole;
    }
    
    const response: AxiosResponse<ApiResponse<UserProfile>> = await api.put(
      `/users/${userId}/application-status`, 
      requestData
    );
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      console.error('Rate limit exceeded when updating user status. Too many requests.');
    } else {
      console.error('Failed to update user status:', error);
    }
    throw error;
  }
}; 