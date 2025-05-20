import { prisma } from '../../../config/database';
import { ApplicationStatus, Prisma, RoleName, Users } from '@prisma/client';
import { UpdateApplicationStatusDto, UpdateUserProfileDto } from '../dto/user.dto';
import { AppError, HttpCode } from '../../../common/utils/app-error';

export const findUserById = async (userId: number): Promise<Users | null> => {
  return prisma.users.findUnique({ where: { user_id: userId } });
};

export const getAllUsers = async (filters?: Prisma.UsersWhereInput): Promise<Users[]> => {
  return prisma.users.findMany({
    where: filters,
    include: {
      role: true, // Include role information
    },
    orderBy: {
      created_at: 'desc',
    },
  });
};

export const updateUserApplicationStatus = async (
  applicantUserId: number,
  dto: UpdateApplicationStatusDto,
  // adminUserId: number // To verify admin privileges, not used directly in DB query yet
): Promise<Users> => {
  const applicant = await prisma.users.findUnique({
    where: { user_id: applicantUserId },
    include: { role: true },
  });

  if (!applicant) {
    throw new AppError(HttpCode.NOT_FOUND, `User with ID ${applicantUserId} not found.`);
  }

  if (applicant.application_status === ApplicationStatus.approved && dto.status === ApplicationStatus.approved) {
    throw new AppError(HttpCode.BAD_REQUEST, 'User is already approved.');
  }
  if (applicant.application_status === ApplicationStatus.rejected && dto.status === ApplicationStatus.rejected) {
    throw new AppError(HttpCode.BAD_REQUEST, 'User is already rejected.');
  }

  let newRoleId = applicant.role_id;
  if (dto.status === ApplicationStatus.approved) {
    // Determine the role to assign upon approval
    const targetRoleName = dto.assignRole || (applicant.requested_librarian_role_on_application ? RoleName.Librarian : RoleName.Member);
    const roleToAssign = await prisma.roles.findUnique({
      where: { role_name: targetRoleName },
    });
    if (!roleToAssign) {
      throw new AppError(HttpCode.INTERNAL_SERVER_ERROR, `Role '${targetRoleName}' not found.`);
    }
    newRoleId = roleToAssign.role_id;
  } else if (dto.status === ApplicationStatus.rejected) {
    // If rejecting, ensure they are set back to PotentialMember or keep their current role if it was already beyond pending.
    // For simplicity, if they were pending, we could revert to PotentialMember. If already approved/rejected, this state change is a new decision.
    const potentialMemberRole = await prisma.roles.findUnique({ where: { role_name: RoleName.PotentialMember }});
    if (potentialMemberRole && applicant.role.role_name === RoleName.PotentialMember) {
      newRoleId = potentialMemberRole.role_id; // Keep as PotentialMember if initially so, or re-set
    }
    // If already approved and now rejecting, their role might remain as Member/Librarian but status is rejected.
    // This logic might need refinement based on exact business rules for re-rejection or revoking approved status.
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: applicantUserId },
    data: {
      application_status: dto.status,
      role_id: newRoleId,
      // Reset requested_librarian_role_on_application as it has been processed
      // requested_librarian_role_on_application: dto.status === ApplicationStatus.approved ? false : applicant.requested_librarian_role_on_application,
      updated_at: new Date(),
    },
    include: {
      role: true,
    },
  });

  // TODO: Add email notification to the applicant about their status change.
  // if (dto.status === ApplicationStatus.approved) { ... send approval email ... }
  // else if (dto.status === ApplicationStatus.rejected) { ... send rejection email ... }

  return updatedUser;
};

// Define type for user profile response
type UserProfileResponse = {
  user_id: number;
  username: string;
  name: string;
  email: string;
  phone_number: string;
  application_status: ApplicationStatus;
  role: {
    role_id: number;
    role_name: RoleName;
  };
  created_at: Date;
  updated_at: Date;
  requested_librarian_role_on_application: boolean;
};

export const getUserProfile = async (userId: number): Promise<UserProfileResponse | null> => {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    include: {
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  // Return a clean profile object without sensitive information
  return {
    user_id: user.user_id,
    username: user.username,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number,
    application_status: user.application_status,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    requested_librarian_role_on_application: user.requested_librarian_role_on_application
  };
};

// Update user profile (only allowed fields)
export const updateUserProfile = async (userId: number, data: UpdateUserProfileDto): Promise<UserProfileResponse | null> => {
  // First, check if user exists
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    return null;
  }

  // Update the user with provided fields
  const updatedUser = await prisma.users.update({
    where: { user_id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone_number && { phone_number: data.phone_number }),
      updated_at: new Date(),
    },
    include: {
      role: true,
    },
  });

  // Return the updated profile
  return {
    user_id: updatedUser.user_id,
    username: updatedUser.username,
    name: updatedUser.name,
    email: updatedUser.email,
    phone_number: updatedUser.phone_number,
    application_status: updatedUser.application_status,
    role: updatedUser.role,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at,
    requested_librarian_role_on_application: updatedUser.requested_librarian_role_on_application
  };
};

// You can add other user-related services here, e.g.:
// export const updateUserProfile = async (userId: number, data: UpdateUserProfileDto) => { ... }; 