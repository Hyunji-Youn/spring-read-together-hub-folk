import api from '../lib/api';
import { AxiosResponse } from 'axios';

// 타입 정의
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string; // This will be 'test123test123'
  name: string;
  email: string;
  phone_number: string;
  requested_librarian_role: boolean;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  expiresIn: number;
  user: User;
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
export const login = async (credentials: LoginRequest): Promise<User> => {
  try {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/login', credentials, {
      withCredentials: true, // 쿠키를 받기 위해 필요
    });
    
    // 액세스 토큰 저장
    localStorage.setItem('accessToken', response.data.accessToken);
    
    // 현재 사용자 정보 저장
    currentUser = response.data.user;
    
    return response.data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 회원가입 함수
export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response: AxiosResponse<RegisterResponse> = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// 로그아웃 함수
export const logout = async (): Promise<void> => {
  try {
    // 서버에 로그아웃 요청 보내기 (리프레시 토큰 무효화)
    await api.post('/auth/logout', {}, { withCredentials: true });
    
    // 로컬 스토리지에서 액세스 토큰 제거
    localStorage.removeItem('accessToken');
    
    // 현재 사용자 정보 초기화
    currentUser = null;
  } catch (error) {
    console.error('Logout error:', error);
    
    // 실패하더라도 클라이언트 측에서는 토큰 삭제
    localStorage.removeItem('accessToken');
    currentUser = null;
    
    throw error;
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<User | null> => {
  // 이미 로드된 사용자 정보가 있으면 반환
  if (currentUser) {
    return currentUser;
  }
  
  // 토큰이 있으면 사용자 정보 요청
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }
  
  try {
    const response: AxiosResponse<{ user: User }> = await api.get('/users/me');
    currentUser = response.data.user;
    return currentUser;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

// 인증 상태 확인 함수
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
}; 