import { env } from '../../../config/env';
import nodemailer from 'nodemailer';
import { RoleName, ApplicationStatus, Users } from '@prisma/client';

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST || 'smtp.gmail.com',
  port: env.EMAIL_PORT || 587,
  secure: env.EMAIL_SECURE === 'true',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});

// Add a fallback URL if FRONTEND_URL is not defined
const getFrontendUrl = () => {
  return env.FRONTEND_URL || 'http://localhost:3000';
};

/**
 * Template for registration notification email
 * @param user User data
 */
function getRegistrationEmailTemplate(user: Users): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2196F3;">Welcome to Spring Reading Club!</h2>
        <p style="color: #666; font-size: 16px;">Thank you for joining our literary community</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>Thank you for registering with our Spring Reading Club. Your application has been received and is currently pending approval by our administrators.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <p style="margin: 0;"><strong>What happens next?</strong></p>
          <ul style="margin-top: 10px;">
            <li>Our administrators will review your application within 1-2 business days</li>
            <li>You'll receive an email notification once your application is processed</li>
            <li>If approved, you'll be able to log in and access all Reading Club features</li>
          </ul>
        </div>
        
        <div style="margin: 20px 0; padding: 15px; border: 1px dashed #ccc;">
          <p style="margin: 0; font-weight: bold;">Registration Summary:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Username:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.username}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Role Requested:</strong></td>
              <td style="padding: 8px;">${user.requested_librarian_role_on_application ? 'Librarian' : 'Member'}</td>
            </tr>
          </table>
        </div>
        
        <p>If you have any questions about your application or need further assistance, please don't hesitate to contact our support team at <a href="mailto:support@springreadingclub.com" style="color: #2196F3;">support@springreadingclub.com</a>.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Spring Reading Club</p>
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  `;
}

/**
 * Template for application approval email
 * @param user User data
 * @param roleName Role assigned to the user
 */
function getApprovalEmailTemplate(user: Users, roleName: RoleName): string {
  const roleDescription = {
    [RoleName.Member]: 'As a Member, you can browse our catalog, participate in reading groups, and post comments in discussions.',
    [RoleName.Librarian]: 'As a Librarian, you have enhanced privileges including managing the book catalog, creating reading events, and moderating discussions.',
    [RoleName.Admin]: 'As an Admin, you have full administrative rights to manage the platform, users, and content.',
    [RoleName.PotentialMember]: 'Your role is currently set as a Potential Member.'
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4CAF50;">Your Application is Approved!</h2>
        <p style="color: #666; font-size: 16px;">Welcome to the Spring Reading Club community</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>We're delighted to inform you that your application to join our Spring Reading Club has been <strong style="color: #4CAF50;">approved</strong>!</p>
        
        <div style="background-color: #f0f7ed; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your account details:</strong></p>
          <p style="margin: 10px 0;"><strong>Username:</strong> ${user.username}</p>
          <p style="margin: 10px 0;"><strong>Role:</strong> ${roleName}</p>
          <p style="margin: 10px 0; font-style: italic;">${roleDescription[roleName] || ''}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>Next steps:</strong></p>
          <ol style="margin-top: 10px;">
            <li>Log in using your registered email and password</li>
            <li>Complete your profile and set your reading preferences</li>
            <li>Explore the catalog and join reading discussions</li>
            <li>Connect with other members with similar interests</li>
          </ol>
        </div>
        
        <p>If you have any questions or need assistance getting started, our support team is here to help at <a href="mailto:support@springreadingclub.com" style="color: #4CAF50;">support@springreadingclub.com</a>.</p>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${getFrontendUrl()}/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Your Account</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Spring Reading Club</p>
        <p>Happy reading!</p>
      </div>
    </div>
  `;
}

/**
 * Template for application rejection email
 * @param user User data
 * @param rejectionReason Optional reason for rejection
 */
function getRejectionEmailTemplate(user: Users, rejectionReason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #F44336;">Application Status Update</h2>
        <p style="color: #666; font-size: 16px;">Important information about your Reading Club application</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>Thank you for your interest in joining our Spring Reading Club. After careful review, we regret to inform you that your application has not been approved at this time.</p>
        
        ${rejectionReason ? `
        <div style="background-color: #fff9f9; padding: 15px; border-left: 4px solid #F44336; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reason for this decision:</strong></p>
          <p style="margin-top: 10px;">${rejectionReason}</p>
        </div>
        ` : `
        <div style="background-color: #fff9f9; padding: 15px; border-left: 4px solid #F44336; margin: 20px 0;">
          <p style="margin: 0;">This could be due to various reasons such as incomplete information or verification issues.</p>
        </div>
        `}
        
        <p>You're welcome to apply again after addressing the issues mentioned above, or contact our support team for more specific guidance.</p>
        
        <div style="margin: 20px 0; text-align: center;">
          <a href="mailto:support@springreadingclub.com" style="display: inline-block; background-color: #757575; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Contact Support</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Spring Reading Club</p>
        <p>Thank you for your understanding.</p>
      </div>
    </div>
  `;
}

/**
 * Template for role change email
 * @param user User data
 * @param newRole New role assigned to the user
 */
function getRoleChangeEmailTemplate(user: Users, newRole: RoleName): string {
  const roleDescriptions = {
    [RoleName.Member]: 'As a Member, you can browse our catalog, participate in reading groups, and post comments in discussions.',
    [RoleName.Librarian]: 'As a Librarian, you have enhanced privileges including managing the book catalog, creating reading events, and moderating discussions.',
    [RoleName.Admin]: 'As an Admin, you have full administrative rights to manage the platform, users, and content.',
    [RoleName.PotentialMember]: 'Your role is currently set as a Potential Member pending approval.'
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #2196F3;">Role Update Notification</h2>
        <p style="color: #666; font-size: 16px;">Your access level has been updated</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>We're writing to inform you that your role in the Spring Reading Club has been updated.</p>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your new role:</strong> ${newRole}</p>
          <p style="margin-top: 10px; font-style: italic;">${roleDescriptions[newRole] || ''}</p>
        </div>
        
        <p>This change may affect your access to certain features and privileges within the platform. The next time you log in, you'll see the updated options available to you based on your new role.</p>
        
        <p>If you have any questions about this change or need guidance on using your new permissions, please contact our support team.</p>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${getFrontendUrl()}/login" style="display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Your Account</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Spring Reading Club</p>
        <p>Thank you for being part of our community!</p>
      </div>
    </div>
  `;
}

/**
 * Template for admin notification email about new registration
 * @param user New registered user requiring approval
 */
function getAdminNotificationTemplate(user: Users): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #FF9800;">New Registration Requires Approval</h2>
        <p style="color: #666; font-size: 16px;">Spring Reading Club - Administrator Notification</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <p>Dear Administrator,</p>
        <p>A new user has registered with Spring Reading Club and requires your approval:</p>
        
        <div style="background-color: #FFF8E1; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
          <p style="margin: 0;"><strong>Registration Details:</strong></p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Username:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.username}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.phone_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px;"><strong>Requested Role:</strong></td>
              <td style="padding: 8px;">${user.requested_librarian_role_on_application ? 'Librarian' : 'Member'}</td>
            </tr>
          </table>
        </div>
        
        <p>Please review this application at your earliest convenience.</p>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${getFrontendUrl()}/admin/users/pending" style="display: inline-block; background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Review Pending Applications</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Spring Reading Club - Administrator Portal</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  `;
}

/**
 * Send registration notification email
 * @param user New registered user
 */
export async function sendRegistrationEmail(user: Users): Promise<boolean> {
  try {
    if (!env.EMAIL_ENABLED || env.EMAIL_ENABLED !== 'true') {
      console.log('Email notifications are disabled in configuration.');
      return false;
    }

    await transporter.sendMail({
      from: `"Spring Reading Club" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Spring Reading Club: Registration Received',
      html: getRegistrationEmailTemplate(user),
    });

    return true;
  } catch (error) {
    console.error('Failed to send registration email:', error);
    return false;
  }
}

/**
 * Send application status update email
 * @param user User to notify
 * @param status Application status (approved/rejected)
 * @param roleName Role assigned if approved
 * @param rejectionReason Optional reason for rejection if rejected
 */
export async function sendApplicationStatusEmail(
  user: Users,
  status: ApplicationStatus,
  roleName?: RoleName,
  rejectionReason?: string
): Promise<boolean> {
  try {
    if (!env.EMAIL_ENABLED || env.EMAIL_ENABLED !== 'true') {
      console.log('Email notifications are disabled in configuration.');
      return false;
    }

    let subject: string;
    let htmlContent: string;

    if (status === ApplicationStatus.approved && roleName) {
      subject = 'Spring Reading Club: Your Application Has Been Approved!';
      htmlContent = getApprovalEmailTemplate(user, roleName);
    } else if (status === ApplicationStatus.rejected) {
      subject = 'Spring Reading Club: Application Status Update';
      htmlContent = getRejectionEmailTemplate(user, rejectionReason);
    } else {
      console.error('Invalid application status or missing role for approved status');
      return false;
    }

    await transporter.sendMail({
      from: `"Spring Reading Club" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Failed to send application status email:', error);
    return false;
  }
}

/**
 * Send role change notification email
 * @param user User to notify
 * @param newRole New role assigned to the user
 */
export async function sendRoleChangeEmail(user: Users, newRole: RoleName): Promise<boolean> {
  try {
    if (!env.EMAIL_ENABLED || env.EMAIL_ENABLED !== 'true') {
      console.log('Email notifications are disabled in configuration.');
      return false;
    }

    await transporter.sendMail({
      from: `"Spring Reading Club" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Spring Reading Club: Your Role Has Been Updated',
      html: getRoleChangeEmailTemplate(user, newRole),
    });

    return true;
  } catch (error) {
    console.error('Failed to send role change email:', error);
    return false;
  }
}

/**
 * Send notification email to admin about new user registration
 * @param adminEmail Admin's email address
 * @param user New registered user requiring approval
 */
export async function sendAdminNotificationEmail(adminEmail: string, user: Users): Promise<boolean> {
  try {
    if (!env.EMAIL_ENABLED || env.EMAIL_ENABLED !== 'true') {
      console.log('Email notifications are disabled in configuration.');
      return false;
    }

    await transporter.sendMail({
      from: `"Spring Reading Club Admin" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'Spring Reading Club: New User Registration Requires Approval',
      html: getAdminNotificationTemplate(user),
    });

    return true;
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
    return false;
  }
} 