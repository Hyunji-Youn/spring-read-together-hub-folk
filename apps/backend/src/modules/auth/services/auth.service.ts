import * as argon2 from 'argon2';
import nodemailer from 'nodemailer';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { AdminLoginRequestDto } from '../dto/auth.dto';
import { ApplicationStatus, RoleName } from '@prisma/client';
import { jwtService } from './jwt.service';
import crypto from 'crypto';

/**
 * Registration password verification
 * @param registrationPassword User entered registration password
 * @returns Whether the password is valid
 */
export async function verifyRegistrationPassword(registrationPassword: string): Promise<boolean> {
  try {
    console.log('Verifying registration password:', {
      passwordProvided: !!registrationPassword,
      passwordLength: registrationPassword ? registrationPassword.length : 0
    });
    
    // Query the registration password from AppConfig table
    const config = await prisma.appConfig.findUnique({
      where: { key: 'REGISTRATION_PASSWORD' }
    });

    console.log('Config found:', {
      hasConfig: !!config,
      configKey: config ? config.key : null,
      hashLength: config ? config.value.length : 0
    });

    // Return false if no config found
    if (!config) {
      console.log('Registration password verification failed: No config found');
      return false;
    }

    // Verify the password using argon2
    const isValid = await argon2.verify(config.value, registrationPassword);
    
    console.log('Registration password verification:', {
      inputProvided: !!registrationPassword,
      isValid,
      plainPassword: registrationPassword // Only in development for debugging!
    });

    return isValid;
  } catch (error) {
    console.error('Registration password verification error:', error);
    return false;
  }
}

/**
 * Registration request data type
 */
export interface RegisterUserData {
  username: string;
  password: string; // This will be the same as registration_password
  name: string;
  email: string;
  phone_number: string;
  registration_password: string;
  request_librarian_role?: boolean;
}

/**
 * Registration processing
 */
export async function register(userData: RegisterUserData) {
  try {
    // Check for duplicate username
    const existingUser = await prisma.users.findUnique({
      where: { username: userData.username },
    });

    if (existingUser) {
      return { success: false, message: 'Username already in use.' };
    }

    // Check for duplicate email
    const existingEmail = await prisma.users.findFirst({
      where: { email: userData.email },
    });

    if (existingEmail) {
      return { success: false, message: 'Email address already in use.' };
    }

    // Verify registration password
    const isValidRegistrationPassword = await verifyRegistrationPassword(userData.registration_password);
    if (!isValidRegistrationPassword) {
      return { success: false, message: 'Invalid registration code.' };
    }

    // Hash the registration code as password
    const hashedPassword = await argon2.hash(userData.registration_password);

    // Determine user role
    const roleId = userData.request_librarian_role ? 2 : 3; // 2 for Librarian, 3 for Member
    
    // Set approval status (admin approval required)
    const status = ApplicationStatus.pending_approval;

    // Create user
    const newUser = await prisma.users.create({
      data: {
        username: userData.username,
        password_hash: hashedPassword,
        name: userData.name,
        email: userData.email,
        phone_number: userData.phone_number,
        role_id: roleId,
        application_status: status,
        requested_librarian_role_on_application: !!userData.request_librarian_role,
        created_at: new Date(),
        updated_at: new Date()
      },
    });

    // Send registration email
    await sendRegistrationEmail(userData.email, userData.name, userData.request_librarian_role ? RoleName.Librarian : RoleName.Member);

    return {
      success: true,
      id: newUser.user_id,
      message: 'Registration complete. You can use the service after admin approval.',
    };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'An error occurred during registration.' };
  }
}

/**
 * Login result type
 */
export interface LoginResult {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
  isAdmin?: boolean;
  refreshToken?: string;
}

/**
 * Member login processing
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    // Find user
    const user = await prisma.users.findUnique({
      where: { username },
      include: { role: true }
    });

    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    // Check account approval status
    if (user.application_status !== ApplicationStatus.approved) {
      return { success: false, message: 'Account not yet approved. Please wait for administrator approval.' };
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password.' };
    }

    // Update last login time
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { updated_at: new Date() }, // Use updated_at as there's no last_login
    });

    // Generate access token with RS256 algorithm
    const token = await jwtService.generateAccessToken(
      user.user_id, 
      user.role.role_name,
      {
        username: user.username,
        email: user.email
      }
    );

    // Generate refresh token and store it
    const { token: refreshToken, hash, expiresAt } = await jwtService.generateRefreshToken(
      user.user_id,
      user.role.role_name
    );

    // Store refresh token in database
    await jwtService.storeRefreshToken(user.user_id, hash, expiresAt);

    return {
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role.role_name,
        status: user.application_status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      token,
      refreshToken, // Include refresh token in the response
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login.' };
  }
}

/**
 * Send registration completion email
 */
async function sendRegistrationEmail(email: string, name: string, role: RoleName) {
  try {
    // Setup email transport
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: Number(env.EMAIL_PORT || '587'),
      secure: env.EMAIL_SECURE === 'true',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });

    // Customize content based on role
    const roleText = role === RoleName.Librarian ? 'Librarian' : 'Member';
    
    // Send email
    await transporter.sendMail({
      from: `"Spring Reading Club" <${env.EMAIL_FROM}>`,
      to: email,
      subject: 'Spring Reading Club Registration Complete',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B4513;">Spring Reading Club Registration Complete</h2>
          <p>Dear ${name}, your Spring Reading Club ${roleText} registration has been received.</p>
          <p>You can use the service after administrator approval.</p>
          <p>You will receive an email notification when your account is approved.</p>
          <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 0;">Thank you.</p>
            <p style="margin: 5px 0 0 0;">Spring Reading Club Team</p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
}

/**
 * Admin login processing
 */
export async function adminLogin(data: AdminLoginRequestDto): Promise<LoginResult> {
  try {
    console.log('Admin login attempt for username:', data.username);
    
    // Find admin user
    const admin = await prisma.users.findFirst({
      where: {
        username: data.username,
        role: {
          role_name: RoleName.Admin
        }
      },
      include: {
        role: true
      }
    });

    console.log('Admin user found:', admin ? 'yes' : 'no');

    if (!admin) {
      return { success: false, message: 'Admin account not found.' };
    }

    // Verify password
    const isPasswordValid = await argon2.verify(admin.password_hash, data.password);
    console.log('Password verification result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return { success: false, message: 'Incorrect password.' };
    }

    // Update last login time
    await prisma.users.update({
      where: { user_id: admin.user_id },
      data: { updated_at: new Date() }, // Use updated_at as there's no last_login
    });

    // Generate access token with RS256 algorithm
    console.log('Generating access token with user_id:', admin.user_id);
    const token = await jwtService.generateAccessToken(
      admin.user_id, 
      admin.role.role_name,
      {
        username: admin.username,
        email: admin.email
      }
    );

    // Generate refresh token and store it
    console.log('Generating refresh token');
    const { token: refreshToken, hash, expiresAt } = await jwtService.generateRefreshToken(
      admin.user_id,
      admin.role.role_name
    );

    // Store refresh token in database
    await jwtService.storeRefreshToken(admin.user_id, hash, expiresAt);
    console.log('Refresh token stored, returning login result');

    return {
      success: true,
      isAdmin: true,
      user: {
        id: admin.user_id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        phone_number: admin.phone_number,
        role: admin.role.role_name,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
      },
      token,
      refreshToken, // Include refresh token in the response
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, message: 'An error occurred during admin login.' };
  }
}

// Helper function to send registration notification email
async function sendRegistrationNotificationEmail(newUser: {
  username: string;
  name: string;
  email: string;
  requested_librarian_role: boolean;
}) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('SMTP configuration is missing. Skipping registration email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || '587'),
    secure: Number(env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Spring Hub Admin" <${env.SMTP_USER}>`, // Sender address (use SMTP user or a configured sender)
    to: env.ADMIN_EMAIL,
    subject: 'New Member Registration Notification',
    html: `
      <p>There's a new member registration request.</p>
      <ul>
        <li>User ID: ${newUser.username}</li>
        <li>Name: ${newUser.name}</li>
        <li>Email: ${newUser.email}</li>
        <li>Librarian Role Request: ${newUser.requested_librarian_role ? 'Yes' : 'No'}</li>
      </ul>
      <p>Please approve or reject this application on the admin page.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Registration notification email sent to admin.');
  } catch (error) {
    console.error('Error sending registration notification email:', error);
    // Do not throw error to prevent registration failure if email fails
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshTokens(refreshToken: string) {
  try {
    // Verify refresh token
    const payload = await jwtService.verifyRefreshToken(refreshToken);
    
    // Token verification failed
    if (!payload) {
      throw new Error('Invalid refresh token');
    }
    
    // Query user information and role
    const user = await prisma.users.findUnique({
      where: { user_id: payload.sub },
      include: {
        role: true,
      },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new tokens
    const accessToken = await jwtService.generateAccessToken(
      user.user_id,
      user.role.role_name,
      {
        email: user.email,
        username: user.username
      }
    );
    
    // Generate refresh token
    const { token: newRefreshToken, hash: refreshTokenHash, expiresAt } = 
      await jwtService.generateRefreshToken(
        user.user_id,
        user.role.role_name
      );
    
    // Revoke existing token and store new refresh token
    // Calculate token hash
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Revoke existing token
    await jwtService.revokeRefreshToken(tokenHash);
    
    // Store new token
    await jwtService.storeRefreshToken(
      user.user_id,
      refreshTokenHash,
      expiresAt
    );
    
    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
}

/**
 * Logout processing - Invalidate refresh token
 */
export async function logout(userId: number, refreshToken: string | undefined): Promise<boolean> {
  try {
    if (!refreshToken) {
      return false;
    }

    // Invalidate the specific refresh token for this user
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await jwtService.revokeRefreshToken(tokenHash);

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
} 