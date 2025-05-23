import { prisma } from '../../../config/database';
import { ApplicationStatus, Prisma, RoleName, Users } from '@prisma/client';
import { UpdateApplicationStatusDto, UpdateUserProfileDto, BatchRoleAssignmentDto } from '../dto/user.dto';
import { AppError, HttpCode } from '../../../common/utils/app-error';
import { AuditEventType, createAuditLog } from '../../audit/services/audit.service';
import { sendApplicationStatusEmail, sendRoleChangeEmail } from '../../notifications/services/email.service';

// Add this new type for statistics response
export type UserStatistics = {
  totalUsers: number;
  roleDistribution: Record<string, number>;
  applicationStatusDistribution: Record<string, number>;
  recentRegistrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
};

/**
 * Get user statistics for admin dashboard
 * 
 * @returns Promise with user statistics
 */
export const getUserStatistics = async (): Promise<UserStatistics> => {
  // Get total users count
  const totalUsers = await prisma.users.count();
  
  // Get role distribution
  const roleDistribution = await prisma.users.groupBy({
    by: ['role_id'],
    _count: {
      user_id: true
    }
  });
  
  // Get role names map
  const roles = await prisma.roles.findMany();
  const roleMap = Object.fromEntries(roles.map(role => [role.role_id, role.role_name]));
  
  // Get application status distribution
  const applicationStatusDistribution = await prisma.users.groupBy({
    by: ['application_status'],
    _count: {
      user_id: true
    }
  });
  
  // Get recent registrations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const registrationsToday = await prisma.users.count({
    where: {
      created_at: {
        gte: today
      }
    }
  });
  
  const registrationsThisWeek = await prisma.users.count({
    where: {
      created_at: {
        gte: oneWeekAgo
      }
    }
  });
  
  const registrationsThisMonth = await prisma.users.count({
    where: {
      created_at: {
        gte: oneMonthAgo
      }
    }
  });
  
  // Format role distribution
  const formattedRoleDistribution: Record<string, number> = {};
  roleDistribution.forEach(item => {
    const roleName = roleMap[item.role_id] || `Role ID ${item.role_id}`;
    formattedRoleDistribution[roleName] = item._count.user_id;
  });
  
  // Format application status distribution
  const formattedStatusDistribution: Record<string, number> = {};
  applicationStatusDistribution.forEach(item => {
    formattedStatusDistribution[item.application_status] = item._count.user_id;
  });
  
  return {
    totalUsers,
    roleDistribution: formattedRoleDistribution,
    applicationStatusDistribution: formattedStatusDistribution,
    recentRegistrations: {
      today: registrationsToday,
      thisWeek: registrationsThisWeek,
      thisMonth: registrationsThisMonth
    }
  };
};

/**
 * Get users with pagination, sorting, and extended filtering options
 */
export const getUsersWithOptions = async (options: {
  status?: ApplicationStatus;
  role?: RoleName;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ users: Users[]; total: number }> => {
  const { 
    status, 
    role, 
    search, 
    limit = 10, 
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;
  
  // Build the where clause for filtering
  const where: Prisma.UsersWhereInput = {};
  
  // Filter by application status if provided
  if (status) {
    where.application_status = status;
  }
  
  // Filter by role if provided
  if (role) {
    where.role = {
      role_name: role
    };
  }
  
  // Add search functionality
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Validate the sort column
  const validSortFields = ['user_id', 'username', 'name', 'email', 'created_at', 'updated_at', 'application_status'];
  const actualSortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  
  // Build the order by object
  const orderBy: any = {};
  orderBy[actualSortField] = sortOrder;
  
  // Get the total count for pagination
  const total = await prisma.users.count({ where });
  
  // Get the users with pagination, sorting, and including roles
  const users = await prisma.users.findMany({
    where,
    include: {
      role: true,
    },
    orderBy,
    skip: offset,
    take: limit,
  });
  
  return { users, total };
};

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
  adminUserId: number,
  rejectionReason?: string
): Promise<Users> => {
  const applicant = await prisma.users.findUnique({
    where: { user_id: applicantUserId },
    include: { role: true },
  });

  if (!applicant) {
    throw new AppError(HttpCode.NOT_FOUND, 'User not found.');
  }

  let newRoleId = applicant.role_id; // Default to current role_id 

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
    const potentialMemberRole = await prisma.roles.findUnique({ where: { role_name: RoleName.PotentialMember }});
    if (potentialMemberRole && applicant.role.role_name === RoleName.PotentialMember) {
      newRoleId = potentialMemberRole.role_id; // Keep as PotentialMember if initially so, or re-set
    }
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: applicantUserId },
    data: {
      application_status: dto.status,
      role_id: newRoleId,
      updated_at: new Date(),
    },
    include: {
      role: true,
    },
  });

  // Create audit log
  await createAuditLog(
    AuditEventType.USER_STATUS_CHANGED,
    adminUserId,
    applicantUserId,
    {
      previousStatus: applicant.application_status,
      newStatus: dto.status,
      previousRole: applicant.role.role_name,
      newRole: updatedUser.role.role_name,
      rejectionReason: rejectionReason
    }
  );

  // Send email notification
  if (dto.status === ApplicationStatus.approved) {
    // For approved applications, include the role in the email
    await sendApplicationStatusEmail(updatedUser, dto.status, updatedUser.role.role_name);
  } else if (dto.status === ApplicationStatus.rejected) {
    // For rejected applications, include the rejection reason if provided
    await sendApplicationStatusEmail(updatedUser, dto.status, undefined, rejectionReason);
  }

  // TODO: Add email notification to the applicant about their status change.
  // This could be implemented in a separate notification service

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

/**
 * Batch assign roles to multiple users
 * 
 * @param dto - Batch role assignment data
 * @param adminUserId - User ID of the admin performing the operation
 * @returns Promise with array of updated users
 */
export const batchAssignRoles = async (dto: BatchRoleAssignmentDto, adminUserId: number) => {
  // Get the role to assign
  const roleToAssign = await prisma.roles.findUnique({
    where: { role_name: dto.role },
  });

  if (!roleToAssign) {
    throw new AppError(HttpCode.NOT_FOUND, `Role '${dto.role}' not found.`);
  }

  // Validate that all users exist
  const users = await prisma.users.findMany({
    where: { user_id: { in: dto.userIds } },
    include: { role: true }
  });

  if (users.length !== dto.userIds.length) {
    const foundUserIds = users.map(u => u.user_id);
    const notFoundUserIds = dto.userIds.filter(id => !foundUserIds.includes(id));
    throw new AppError(
      HttpCode.NOT_FOUND, 
      `Some users not found: ${notFoundUserIds.join(', ')}`
    );
  }

  // Begin a transaction
  return prisma.$transaction(async (tx) => {
    const updatedUsers = [];
    
    for (const user of users) {
      // Skip if the user already has the role
      if (user.role.role_name === dto.role) {
        updatedUsers.push(user);
        continue;
      }
      
      // Update the user
      const updatedUser = await tx.users.update({
        where: { user_id: user.user_id },
        data: {
          role_id: roleToAssign.role_id,
          updated_at: new Date(),
        },
        include: {
          role: true,
        },
      });
      
      updatedUsers.push(updatedUser);
      
      // Create audit log
      await createAuditLog(
        AuditEventType.USER_ROLE_CHANGED,
        adminUserId,
        user.user_id,
        {
          previousRole: user.role.role_name,
          newRole: dto.role
        }
      );
      
      // Send email notification
      await sendRoleChangeEmail(updatedUser, dto.role);
    }
    
    return updatedUsers;
  });
};

// You can add other user-related services here, e.g.:
// export const updateUserProfile = async (userId: number, data: UpdateUserProfileDto) => { ... }; 