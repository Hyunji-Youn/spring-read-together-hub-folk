import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/user.service';
import { useToast } from './use-toast';
import { AxiosError } from 'axios';

export function useProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get profile information
  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['profile'],
    queryFn: getUserProfile,
    retry: (failureCount, error) => {
      // If we hit rate limiting (429), retry with exponential backoff
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 429) {
        // Retry up to 3 times for rate limiting errors
        return failureCount < 3;
      }
      // For other errors, retry once
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 8000);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update profile information
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['profile'], data);
      toast({
        title: 'Profile Update Complete',
        description: 'Your profile information has been successfully updated.',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Profile Update Failed',
        description: `An error occurred: ${err.message}`,
        variant: 'destructive',
      });
    },
  });

  // Profile update function
  const updateProfile = (data: Partial<UserProfile>) => {
    updateProfileMutation.mutate(data);
  };

  return {
    profile,
    isLoading,
    isError,
    error,
    updateProfile,
    isUpdating: updateProfileMutation.isPending,
  };
} 