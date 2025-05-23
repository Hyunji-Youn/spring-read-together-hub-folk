import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

// Role enum matching backend
export enum UserRole {
  Admin = 'Admin',
  Librarian = 'Librarian',
  Member = 'Member',
  PotentialMember = 'PotentialMember',
}

// Role object interface to match backend response
export interface UserRoleObject {
  role_id: number;
  role_name: UserRole;
}

// Permission enum matching backend
export enum Permission {
  // User management
  VIEW_USERS = 'view:users',
  CREATE_USER = 'create:user',
  EDIT_USER = 'edit:user',
  APPROVE_USER = 'approve:user',
  DELETE_USER = 'delete:user',
  
  // Content
  VIEW_PUBLIC_CONTENT = 'view:public-content',
  VIEW_MEMBER_CONTENT = 'view:member-content',
  CREATE_POST = 'create:post',
  EDIT_OWN_POST = 'edit:own-post',
  EDIT_ANY_POST = 'edit:any-post',
  DELETE_OWN_POST = 'delete:own-post',
  DELETE_ANY_POST = 'delete:any-post',
  
  // Materials
  UPLOAD_MATERIAL = 'upload:material',
  EDIT_OWN_MATERIAL = 'edit:own-material',
  EDIT_ANY_MATERIAL = 'edit:any-material',
  DELETE_OWN_MATERIAL = 'delete:own-material',
  DELETE_ANY_MATERIAL = 'delete:any-material',
  
  // Events
  VIEW_EVENTS = 'view:events',
  CREATE_EVENT = 'create:event',
  EDIT_EVENT = 'edit:event',
  DELETE_EVENT = 'delete:event',
  
  // Chat
  USE_CHAT = 'use:chat',
  DELETE_OWN_CHAT = 'delete:own-chat',
  DELETE_ANY_CHAT = 'delete:any-chat',
}

// Map roles to permissions - duplicate of backend mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.Admin]: [
    // All permissions except DELETE_USER
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.APPROVE_USER,
    
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.EDIT_ANY_POST,
    Permission.DELETE_OWN_POST,
    Permission.DELETE_ANY_POST,
    
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.EDIT_ANY_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    Permission.DELETE_ANY_MATERIAL,
    
    Permission.VIEW_EVENTS,
    Permission.CREATE_EVENT,
    Permission.EDIT_EVENT,
    Permission.DELETE_EVENT,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
    Permission.DELETE_ANY_CHAT,
  ],
  
  [UserRole.Librarian]: [
    Permission.VIEW_USERS,
    Permission.DELETE_USER, // Only Librarians can delete users
    
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    
    Permission.VIEW_EVENTS,
    Permission.CREATE_EVENT, // Librarians can manage events
    Permission.EDIT_EVENT,
    Permission.DELETE_EVENT,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
  ],
  
  [UserRole.Member]: [
    Permission.VIEW_USERS,
    
    Permission.VIEW_PUBLIC_CONTENT,
    Permission.VIEW_MEMBER_CONTENT,
    Permission.CREATE_POST,
    Permission.EDIT_OWN_POST,
    Permission.DELETE_OWN_POST,
    
    Permission.UPLOAD_MATERIAL,
    Permission.EDIT_OWN_MATERIAL,
    Permission.DELETE_OWN_MATERIAL,
    
    Permission.VIEW_EVENTS,
    
    Permission.USE_CHAT,
    Permission.DELETE_OWN_CHAT,
  ],
  
  [UserRole.PotentialMember]: [
    Permission.VIEW_PUBLIC_CONTENT,
  ],
};

// User interface
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRoleObject | UserRole; // 두 가지 형태 모두 지원: 객체 형태 또는 문자열 형태
}

// Login response interface
interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Permission checking methods
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isResourceOwner: (resourceOwnerId: number) => boolean;
  
  // Role checking methods
  isAdmin: () => boolean;
  isLibrarian: () => boolean;
  isMember: () => boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get stored token
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          // Set default auth header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user profile
          const response = await api.get('/users/me');
          
          // 응답 구조에 따라 사용자 정보 추출
          let userData;
          if (response.data.data) {
            userData = response.data.data;
          } else if (response.data.user) {
            userData = response.data.user;
          } else {
            userData = response.data;
          }
          
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Clear invalid auth state
        localStorage.removeItem('accessToken');
        api.defaults.headers.common['Authorization'] = '';
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Login function
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('AuthContext: 로그인 시도', { username });
      
      // Call login API
      const response = await api.post('/auth/login', {
        username,
        password,
      }, { withCredentials: true });
      
      console.log('AuthContext: 로그인 응답', response.data);
      
      // 백엔드 응답 구조에 따라 데이터 추출
      let accessToken;
      let user;
      
      if (!response.data) {
        console.error('AuthContext: 응답 데이터 없음');
        throw new Error('No response data received');
      }
      
      // Try to extract token and user from various possible response formats
      if (response.data.success) {
        console.log('AuthContext: 성공 응답 처리', {
          hasData: !!response.data.data,
          hasToken: !!(response.data.token || response.data.accessToken),
          hasUser: !!response.data.user
        });
        
        // Check if data field exists (newer format)
        if (response.data.data && response.data.data.accessToken && response.data.data.user) {
          accessToken = response.data.data.accessToken;
          user = response.data.data.user;
        } 
        // Direct fields (older format)
        else if ((response.data.token || response.data.accessToken) && response.data.user) {
          accessToken = response.data.token || response.data.accessToken;
          user = response.data.user;
        } 
        else {
          console.error('AuthContext: 응답 형식은 success:true이지만 필요한 데이터 누락', response.data);
          throw new Error('Missing token or user in response');
        }
      } 
      // Simple format without success field
      else if ((response.data.token || response.data.accessToken) && response.data.user) {
        accessToken = response.data.token || response.data.accessToken;
        user = response.data.user;
      } 
      else {
        // Check if this is an error response
        if (response.data.message) {
          console.error('AuthContext: 서버 오류 메시지', response.data.message);
          throw new Error(response.data.message);
        } else {
          console.error('AuthContext: 알 수 없는 응답 형식', response.data);
          throw new Error('Invalid response format');
        }
      }
      
      if (!accessToken || !user) {
        console.error('AuthContext: 토큰 또는 사용자 정보 누락', { 
          hasToken: !!accessToken, 
          hasUser: !!user,
          responseData: JSON.stringify(response.data)
        });
        throw new Error('Missing token or user data');
      }
      
      console.log('AuthContext: 인증 성공', { userId: user.id, role: user.role });
      
      // Store token and set auth header
      localStorage.setItem('accessToken', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Update state
      setUser(user);
    } catch (err) {
      console.error('AuthContext: 로그인 오류', err);
      console.error('오류 상세:', err.response?.data);
      
      // Provide more specific error message
      let errorMsg = 'Login failed';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      } else if (err.response?.status === 401) {
        errorMsg = 'Invalid credentials';
      } else if (err.response?.status === 403) {
        errorMsg = 'Account not approved';
      } else if (err.response?.status === 404) {
        errorMsg = 'Service unavailable';
      }
      
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Clear auth state first to ensure UI updates immediately
      localStorage.removeItem('accessToken');
      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
      
      // Call logout API
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Ensure auth state is cleared regardless of API success
      localStorage.removeItem('accessToken');
      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
      setLoading(false);
    }
  };
  
  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Call refresh token API
      const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/refresh');
      
      if (!response.data.success) {
        throw new Error('Token refresh failed');
      }
      
      const { accessToken, user } = response.data.data;
      
      // Update token and auth header
      localStorage.setItem('accessToken', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Update user state
      setUser(user);
      
      return true;
    } catch (err) {
      // Clear invalid auth state
      localStorage.removeItem('accessToken');
      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Permission checking functions
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const roleName = typeof user.role === 'string' ? user.role : user.role?.role_name;
    return ROLE_PERMISSIONS[roleName as UserRole]?.includes(permission) || false;
  };
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };
  
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };
  
  // Resource ownership check
  const isResourceOwner = (resourceOwnerId: number): boolean => {
    return user?.id === resourceOwnerId;
  };
  
  // Role checking functions
  const isAdmin = (): boolean => {
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.role_name;
    return roleName === UserRole.Admin;
  };
  
  const isLibrarian = (): boolean => {
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.role_name;
    return roleName === UserRole.Librarian;
  };
  
  const isMember = (): boolean => {
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.role_name;
    return roleName === UserRole.Admin || 
           roleName === UserRole.Librarian || 
           roleName === UserRole.Member;
  };
  
  // Create context value
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isResourceOwner,
    isAdmin,
    isLibrarian,
    isMember,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 