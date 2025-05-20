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

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

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
    const response: AxiosResponse<ApiResponse<UserProfile>> = await api.put(
      `/users/${userId}/application-status`, 
      { status, assignRole }
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