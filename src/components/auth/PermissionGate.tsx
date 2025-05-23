import React from 'react';
import { Permission } from '../../contexts/auth-context';
import { useAuth } from '../../contexts/auth-context';

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  checkType?: 'any' | 'all';
  ownerCheck?: { resourceOwnerId: number };
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A component that conditionally renders children based on user permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  checkType = 'any',
  ownerCheck,
  fallback = null,
  children,
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isResourceOwner 
  } = useAuth();
  
  // Check permissions
  let hasRequiredPermission = false;
  
  if (permission) {
    hasRequiredPermission = hasPermission(permission);
  } else if (permissions) {
    hasRequiredPermission = checkType === 'any' 
      ? hasAnyPermission(permissions) 
      : hasAllPermissions(permissions);
  } else {
    // No permission check required, allow access
    hasRequiredPermission = true;
  }
  
  // Check resource ownership if required
  if (ownerCheck) {
    // If permission is met OR user is owner, allow access
    hasRequiredPermission = hasRequiredPermission || isResourceOwner(ownerCheck.resourceOwnerId);
  }
  
  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate; 