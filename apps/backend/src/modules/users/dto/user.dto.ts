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
});

export type UpdateApplicationStatusDto = z.infer<typeof updateApplicationStatusSchema>;

// Schema for updating user profile
export const updateUserProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
});

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;

// You can add other user-related DTOs here as needed, for example:
// export const updateUserProfileSchema = z.object({ ... });
// export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>; 