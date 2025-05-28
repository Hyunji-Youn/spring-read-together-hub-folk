/**
 * User Roles
 * Shared between frontend and backend
 */
export enum UserRole {
  Admin = 'Admin',
  Librarian = 'Librarian',
  Member = 'Member',
  PotentialMember = 'PotentialMember',
}

/**
 * Application Status
 * Matches Prisma enum
 */
export enum ApplicationStatus {
  pending_approval = 'pending_approval',
  approved = 'approved',
  rejected = 'rejected',
}

/**
 * User Role Object
 * Structure returned by backend
 */
export interface UserRoleObject {
  role_id: number;
  role_name: UserRole;
}

/**
 * User Interface
 * Core user data structure
 */
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone_number?: string;
  role: UserRoleObject | UserRole;
  application_status?: ApplicationStatus;
  created_at?: string | Date;
  updated_at?: string | Date;
}

/**
 * Login Request
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Registration Request
 */
export interface RegistrationRequest {
  username: string;
  name: string;
  email: string;
  phone_number: string;
  registration_password: string;
  request_librarian_role?: boolean;
  accept_terms: boolean;
}

/**
 * Auth Response
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    user: User;
  };
  // Legacy fields for backward compatibility
  token?: string;
  accessToken?: string;
  user?: User;
}