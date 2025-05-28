import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { 
  getAllUsers, 
  updateUserApplicationStatus, 
  getUserStatistics, 
  getAuditLogs,
  getUsersWithOptions,
  UserProfile, 
  UserStatistics,
  AuditLogEntry
} from '../services/user.service';
import { useAuth } from '../contexts/auth-context';

// Define rate limit error type for better handling
interface RateLimitError {
  isRateLimit: boolean;
  retryAfter?: number;
  message: string;
}

// Hook for user statistics
export const useUserStatistics = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['admin-statistics'],
    queryFn: async () => {
      try {
        return await getUserStatistics();
      } catch (error) {
        // Check if it's a rate limit error
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'] 
            ? parseInt(axiosError.response.headers['retry-after']) * 1000
            : 60000; // Default to 1 minute if header is not present
          
          // Create a custom error with rate limit info
          throw {
            isRateLimit: true,
            retryAfter,
            message: 'Rate limit exceeded. Please try again later.'
          } as RateLimitError;
        }
        
        // Handle authentication errors
        if (axiosError.response?.status === 401) {
          throw {
            isAuthError: true,
            message: 'Please log in to access this data.'
          };
        }
        
        // Handle authorization errors
        if (axiosError.response?.status === 403) {
          throw {
            isAuthError: true,
            message: 'You do not have permission to access this data.'
          };
        }
        
        throw error;
      }
    },
    enabled: isAuthenticated && isAdmin(), // Only run if user is authenticated and has admin access
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors or auth errors
      const err = error as any;
      if (err.isRateLimit || err.isAuthError) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
};

// Hook for filtered users with pagination
export const useFilteredUsers = (options: {
  status?: string;
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['admin-filtered-users', options],
    queryFn: async () => {
      try {
        return await getUsersWithOptions(options);
      } catch (error) {
        // Check if it's a rate limit error
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'] 
            ? parseInt(axiosError.response.headers['retry-after']) * 1000
            : 60000; // Default to 1 minute if header is not present
          
          // Create a custom error with rate limit info
          throw {
            isRateLimit: true,
            retryAfter,
            message: 'Rate limit exceeded. Please try again later.'
          } as RateLimitError;
        }
        
        // Handle authentication errors
        if (axiosError.response?.status === 401) {
          throw {
            isAuthError: true,
            message: 'Please log in to access this data.'
          };
        }
        
        // Handle authorization errors
        if (axiosError.response?.status === 403) {
          throw {
            isAuthError: true,
            message: 'You do not have permission to access this data.'
          };
        }
        
        throw error;
      }
    },
    enabled: isAuthenticated && isAdmin(), // Only run if user is authenticated and has admin access
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors or auth errors
      const err = error as any;
      if (err.isRateLimit || err.isAuthError) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
};

// Hook for audit logs
export const useAuditLogs = (options: {
  eventType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['admin-audit-logs', options],
    queryFn: async () => {
      try {
        return await getAuditLogs(options);
      } catch (error) {
        // Check if it's a rate limit error
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'] 
            ? parseInt(axiosError.response.headers['retry-after']) * 1000
            : 60000; // Default to 1 minute if header is not present
          
          // Create a custom error with rate limit info
          throw {
            isRateLimit: true,
            retryAfter,
            message: 'Rate limit exceeded. Please try again later.'
          } as RateLimitError;
        }
        
        // Handle authentication errors
        if (axiosError.response?.status === 401) {
          throw {
            isAuthError: true,
            message: 'Please log in to access this data.'
          };
        }
        
        // Handle authorization errors
        if (axiosError.response?.status === 403) {
          throw {
            isAuthError: true,
            message: 'You do not have permission to access this data.'
          };
        }
        
        throw error;
      }
    },
    enabled: isAuthenticated && isAdmin(), // Only run if user is authenticated and has admin access
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors or auth errors
      const err = error as any;
      if (err.isRateLimit || err.isAuthError) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
};

export const useAdminUsers = (applicationStatus?: string) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin } = useAuth();

  // Query to get all users
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', applicationStatus],
    queryFn: async () => {
      try {
        return await getAllUsers(applicationStatus);
      } catch (error) {
        // Check if it's a rate limit error
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          const retryAfter = axiosError.response.headers['retry-after'] 
            ? parseInt(axiosError.response.headers['retry-after']) * 1000
            : 60000; // Default to 1 minute if header is not present
          
          // Create a custom error with rate limit info
          throw {
            isRateLimit: true,
            retryAfter,
            message: 'Rate limit exceeded. Please try again later.'
          } as RateLimitError;
        }
        
        // Handle authentication errors
        if (axiosError.response?.status === 401) {
          throw {
            isAuthError: true,
            message: 'Please log in to access this data.'
          };
        }
        
        // Handle authorization errors
        if (axiosError.response?.status === 403) {
          throw {
            isAuthError: true,
            message: 'You do not have permission to access this data.'
          };
        }
        
        throw error;
      }
    },
    enabled: isAuthenticated && isAdmin(), // Only run if user is authenticated and has admin access
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors or auth errors
      const err = error as any;
      if (err.isRateLimit || err.isAuthError) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  // Check if error is a rate limit error
  const isRateLimitError = error ? (error as any)?.isRateLimit === true : false;
  const retryAfter = isRateLimitError ? (error as any)?.retryAfter : undefined;

  // Mutation to approve a user
  const approveUserMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role?: 'Member' | 'Librarian' }) => 
      updateUserApplicationStatus(userId, 'approved', role),
    onSuccess: () => {
      toast.success('User approved successfully', {
        description: 'The user can now log in to the platform'
      });
      // Invalidate and refetch users data after approval
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      // Check if it's a rate limit error
      if ((error as AxiosError).response?.status === 429) {
        toast.error('Rate limit exceeded', {
          description: 'Too many requests. Please try again later.'
        });
      } else {
        console.error('Error approving user:', error);
        toast.error('Failed to approve user', {
          description: 'There was an error processing your request'
        });
      }
    }
  });

  // Mutation to reject a user
  const rejectUserMutation = useMutation({
    mutationFn: (userId: number) => updateUserApplicationStatus(userId, 'rejected'),
    onSuccess: () => {
      toast.error('User rejected', {
        description: 'The user has been denied access'
      });
      // Invalidate and refetch users data after rejection
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      // Check if it's a rate limit error
      if ((error as AxiosError).response?.status === 429) {
        toast.error('Rate limit exceeded', {
          description: 'Too many requests. Please try again later.'
        });
      } else {
        console.error('Error rejecting user:', error);
        toast.error('Failed to reject user', {
          description: 'There was an error processing your request'
        });
      }
    }
  });

  return {
    users,
    isLoading,
    error,
    isRateLimitError,
    retryAfter,
    refetch,
    approveUser: approveUserMutation.mutate,
    rejectUser: rejectUserMutation.mutate,
    isApproving: approveUserMutation.isPending,
    isRejecting: rejectUserMutation.isPending,
  };
}; 