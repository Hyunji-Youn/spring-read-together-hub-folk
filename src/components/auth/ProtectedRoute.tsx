import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Permission } from '../../contexts/auth-context';
import { useAuth } from '../../contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  checkType?: 'any' | 'all';
  redirectTo?: string;
}

/**
 * Route component that redirects unauthenticated or unauthorized users
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions,
  checkType = 'any',
  redirectTo = '/login',
}) => {
  const { 
    isAuthenticated, 
    loading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions 
  } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (loading) {
    return <div>로딩 중...</div>;
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // Check permissions
  let hasRequiredPermission = true;
  
  if (permission) {
    hasRequiredPermission = hasPermission(permission);
  } else if (permissions) {
    hasRequiredPermission = checkType === 'any' 
      ? hasAnyPermission(permissions) 
      : hasAllPermissions(permissions);
  }
  
  // Redirect if user doesn't have required permissions
  if (!hasRequiredPermission) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute; 