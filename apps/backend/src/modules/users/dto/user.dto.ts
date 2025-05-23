import { z } from 'zod';
import { ApplicationStatus, RoleName } from '@prisma/client';

export const updateApplicationStatusSchema = z.object({
  status: z.enum([ApplicationStatus.approved, ApplicationStatus.rejected], {
    required_error: 'Application status is required.',
    invalid_type_error: 'Invalid application status. Must be approved or rejected.',
  }),
  // Optional: If status is 'approved', this specifies the role to assign.
  // If not provided for an approval, defaults to 'Member'.
  assignRole: z.enum([RoleName.Member, RoleName.Librarian]).optional(),
  // Optional: If status is 'rejected', this provides a reason for the rejection
  rejectionReason: z.string().optional(),
});

export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>;

export const batchRoleAssignmentSchema = z.object({
  userIds: z.array(z.number(), {
    required_error: 'User IDs are required.',
    invalid_type_error: 'User IDs must be an array of numbers.',
  }).min(1, 'At least one user ID is required.'),
  role: z.enum([RoleName.Admin, RoleName.Librarian, RoleName.Member, RoleName.PotentialMember], {
    required_error: 'Role is required.',
    invalid_type_error: 'Invalid role.',
  }),
});

export type BatchRoleAssignmentDto = z.infer<typeof batchRoleAssignmentSchema>;

// Schema for updating user profile
export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone_number: z.string().max(20).optional(),
});

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;

// You can add other user-related DTOs here as needed, for example:
// export const updateUserProfileSchema = z.object({ ... });
// export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>; 