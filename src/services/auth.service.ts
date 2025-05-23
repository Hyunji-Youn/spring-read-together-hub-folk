import api from '../lib/api';
import { AxiosResponse } from 'axios';

// 타입 정의
export interface LoginRequest {
  username: string;
  password: string; // 이 필드는 이제 registration_password 값을 사용함
}

export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  phone_number: string;
  registration_password: string;
  request_librarian_role: boolean;
  accept_terms: boolean;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone_number: string;
  role: string;
  status?: string;
  isAdmin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  name: string;
  email: string;
  status: string;
  success?: boolean;
  message?: string;
}

// 인증 상태 관리
let currentUser: User | null = null;

// 로그인 함수
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // If login is successful, store the token in localStorage
    if (response.data && response.data.success) {
      const token = response.data.token || response.data.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
        // Set auth header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 어드민 로그인 함수
export const adminLogin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/admin/login', credentials);
    
    // If login is successful, store the token in localStorage
    if (response.data && response.data.success) {
      const token = response.data.token || response.data.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
        // Set auth header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Store user role or admin status
        if (response.data.isAdmin) {
          localStorage.setItem('isAdmin', 'true');
        }
      }
    }
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 회원가입 함수
export const register = async (userData: RegisterRequest): Promise<any> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

// 로그아웃 함수
export const logout = async (): Promise<boolean> => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await api.get('/users/me');
    return response.data.user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// 인증 상태 확인 함수
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
}; 