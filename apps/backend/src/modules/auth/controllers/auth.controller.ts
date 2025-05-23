import { Request, Response } from 'express';
import { RoleName, ApplicationStatus } from '@prisma/client';
import { prisma } from '../../../config/database';
import { passwordService } from '../services/password.service';
import { jwtService } from '../services/jwt.service';
import { 
  loginRequestSchema, 
  registrationRequestSchema, 
  passwordChangeRequestSchema,
  adminLoginRequestSchema
} from '../dto/auth.dto';
import crypto from 'crypto';
import { env } from '../../../config/env';
import { AuditEventType, createAuditLog } from '../../audit/services/audit.service';
import { z } from 'zod';
import * as authService from '../services/auth.service';

/**
 * Handle user login request
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and registration code are required',
      });
    }
    
    const result = await authService.login(username, password);
    
    if (result.success) {
      // Format response to match frontend expectations
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: result.token,          // For compatibility with old code
        accessToken: result.token,    // For compatibility with auth-context.tsx
        user: result.user,
        // Include data field for newer auth-context format
        data: {
          accessToken: result.token,
          user: result.user
        }
      });
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

/**
 * Refresh access token using refresh token
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    console.log('Token refresh attempt', { 
      cookies: req.cookies ? 'Present' : 'Missing',
      hasCookie: !!req.cookies.refreshToken,
      cookiePath: req.path
    });
    
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      console.log('Refresh token not provided in cookies');
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    try {
      // Verify refresh token
      console.log('Verifying refresh token...');
      const payload = await jwtService.verifyRefreshToken(refreshToken);
      console.log('Refresh token verified successfully for user:', payload.sub);

      // Find user
      const user = await prisma.users.findUnique({
        where: { user_id: payload.sub },
        include: { role: true }
      });

      if (!user) {
        console.log('User not found for refresh token payload:', payload);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is approved
      if (user.application_status !== ApplicationStatus.approved) {
        console.log('User account not approved:', user.user_id);
        return res.status(403).json({
          success: false,
          message: 'Your account is pending approval or has been rejected'
        });
      }

      // Generate new access token
      console.log('Generating new access token...');
      const accessToken = await jwtService.generateAccessToken(
        user.user_id,
        user.role.role_name,
        {
          email: user.email,
          username: user.username
        }
      );

      // Rotate refresh token (optional but recommended for security)
      console.log('Rotating refresh token...');
      const { token: newRefreshToken, hash: newRefreshTokenHash, expiresAt } =
        await jwtService.generateRefreshToken(
          user.user_id,
          user.role.role_name
        );

      // Compute old token hash for revocation
      const oldTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Revoke old refresh token
      await jwtService.revokeRefreshToken(oldTokenHash);

      // Store new refresh token
      await jwtService.storeRefreshToken(
        user.user_id,
        newRefreshTokenHash,
        expiresAt
      );

      console.log('Setting new refresh token cookie during token refresh');
      
      // Set new refresh token as httpOnly cookie with high security
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/api/auth/refresh'
      });

      // Return new access token
      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken,
        user: {
          id: user.user_id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role.role_name
        },
        data: {
          accessToken,
          user: {
            id: user.user_id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role.role_name
          }
        }
      });
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: process.env.NODE_ENV === 'development' ? (tokenError as Error).message : undefined
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear the invalid refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
      secure: true,
      sameSite: 'strict'
    });
    
    res.clearCookie('XSRF-TOKEN', {
      secure: true,
      sameSite: 'strict'
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

/**
 * Handle user logout by revoking the refresh token
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Compute token hash
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      // Revoke refresh token
      await jwtService.revokeRefreshToken(tokenHash);
    }

    // Clear cookies with high security settings
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
      secure: true,
      sameSite: 'strict'
    });

    res.clearCookie('XSRF-TOKEN', {
      secure: true,
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

/**
 * Handle user registration
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registration request received:');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', {
      contentType: req.headers['content-type'],
      accept: req.headers.accept
    });
    
    // Validate the request with zod schema
    try {
      const validationResult = registrationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('Validation failed with errors:', JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.log('Zod validation error:', JSON.stringify(validationError.errors, null, 2));
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
    }
    
    const { 
      username, 
      name, 
      email, 
      phone_number, 
      request_librarian_role = false,
      registration_password,
      accept_terms = false
    } = req.body;
    
    // Check terms acceptance
    if (!accept_terms) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the terms and conditions',
        errors: [
          { field: 'accept_terms', message: 'You must accept the terms and conditions' }
        ]
      });
    }

    // Verify the registration password
    const isValidRegistrationPassword = await authService.verifyRegistrationPassword(registration_password);
    if (!isValidRegistrationPassword) {
      console.log('Registration failed: Invalid registration code');
      return res.status(400).json({
        success: false,
        message: 'Invalid registration code'
      });
    }

    // Use registration_password as the account password
    const result = await authService.register({
      username: req.body.username,
      password: req.body.registration_password, // Use registration_password as the password
      name: req.body.name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      registration_password: req.body.registration_password,
      request_librarian_role: req.body.request_librarian_role || false
    });
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check if it's a validation error
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
};

/**
 * Handle admin login request
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    console.log('Admin login request received:', {
      body: req.body,
      headers: {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Present (Hidden)' : 'None'
      }
    });
    
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      console.log('Admin login validation failed: missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }
    
    // Zod validation
    try {
      adminLoginRequestSchema.parse(req.body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.log('Admin login Zod validation failed:', validationError.errors);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
    }
    
    console.log('Admin login validation passed, calling auth service...');
    const result = await authService.adminLogin({ username, password });
    console.log('Admin login result:', {
      success: result.success,
      isAdmin: result.isAdmin,
      hasToken: !!result.token,
      hasRefreshToken: !!result.refreshToken,
      message: result.message
    });
    
    if (result.success) {
      // Create audit log
      try {
        await createAuditLog(
          AuditEventType.LOGIN_SUCCESS,
          result.user?.id,
          undefined,
          { 
            isAdmin: true,
            username: result.user?.username
          }
        );
      } catch (auditError) {
        console.error('Error creating audit log for admin login:', auditError);
      }
      
      // Store refresh token as HTTP-only cookie
      if (result.refreshToken) {
        console.log('Setting refresh token cookie for admin login');
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
          path: '/api/auth/refresh'
        });
      }
      
      // Format response to match frontend expectations
      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token: result.token,              // For compatibility with old code
        accessToken: result.token,        // For compatibility with auth-context.tsx
        user: result.user,
        isAdmin: true,
        // Include data field for newer auth-context format
        data: {
          accessToken: result.token,
          user: {
            ...result.user,
            isAdmin: true
          }
        }
      });
    } else {
      console.log('Admin login failed with message:', result.message);
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error('Admin login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during admin login',
    });
  }
}; 