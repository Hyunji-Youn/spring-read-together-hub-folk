import * as argon2 from 'argon2';
import nodemailer from 'nodemailer';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { generateTokens, verifyRefreshToken } from './token.service';
import { ApplicationStatus, RoleName } from '@prisma/client';

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
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Spring Hub Admin" <${env.SMTP_USER}>`, // Sender address (use SMTP user or a configured sender)
    to: env.ADMIN_EMAIL,
    subject: '새로운 회원 가입 신청 알림',
    html: `
      <p>새로운 회원 가입 신청이 있습니다.</p>
      <ul>
        <li>사용자 ID: ${newUser.username}</li>
        <li>이름: ${newUser.name}</li>
        <li>이메일: ${newUser.email}</li>
        <li>사서 역할 신청: ${newUser.requested_librarian_role ? '예' : '아니오'}</li>
      </ul>
      <p>관리자 페이지에서 승인 또는 반려 처리를 진행해주세요.</p>
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
 * 사용자 로그인 처리
 */
export async function login(loginDto: LoginDto) {
  const { username, password } = loginDto;
  
  // 사용자 찾기
  const user = await prisma.users.findUnique({
    where: {
      username,
    },
    include: {
      role: true, // 'Roles'에서 'role'로 수정
    },
  });
  
  // 사용자가 존재하지 않거나 비밀번호가 일치하지 않으면 에러
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // 계정이 승인되지 않은 상태인 경우
  if (user.application_status !== ApplicationStatus.approved) {
    throw new Error('Account not approved');
  }
  
  // 비밀번호 검증
  const isPasswordValid = await argon2.verify(user.password_hash, password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  // JWT 토큰 생성
  const tokens = await generateTokens(user.user_id, user.role.role_name);
  
  // 리프레시 토큰 저장
  await storeRefreshToken(user.user_id, tokens.refreshToken);
  
  return {
    user: {
      id: user.user_id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role.role_name,
    },
    ...tokens,
  };
}

/**
 * 회원 가입 처리
 */
export async function register(registerDto: RegisterDto) {
  const { username, password, name, email, phone_number, requested_librarian_role } = registerDto;
  
  // 이미 존재하는 사용자인지 확인
  const existingUser = await prisma.users.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  });
  
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  
  // 비밀번호 해싱
  const passwordHash = await argon2.hash(password);
  
  // PotentialMember 역할 ID 조회
  const potentialMemberRole = await prisma.roles.findUnique({
    where: { role_name: RoleName.PotentialMember },
  });
  
  if (!potentialMemberRole) {
    // This should ideally not happen if roles are seeded correctly
    console.error("Critical: PotentialMember role not found in database.");
    throw new Error('Role setup error. Please contact administrator.');
  }
  
  // 회원 생성
  const newUser = await prisma.users.create({
    data: {
      username,
      password_hash: passwordHash,
      name,
      email,
      phone_number,
      role_id: potentialMemberRole.role_id,
      application_status: ApplicationStatus.pending_approval,
      requested_librarian_role_on_application: requested_librarian_role,
    },
  });

  // Send notification email to admin
  await sendRegistrationNotificationEmail({
    username: newUser.username,
    name: newUser.name,
    email: newUser.email,
    requested_librarian_role: requested_librarian_role, 
  });
  
  return {
    id: newUser.user_id,
    username: newUser.username,
    name: newUser.name,
    email: newUser.email,
    status: newUser.application_status,
  };
}

/**
 * 리프레시 토큰을 이용한 액세스 토큰 갱신
 */
export async function refreshTokens(refreshToken: string) {
  // 리프레시 토큰 검증
  const decoded = await verifyRefreshToken(refreshToken);
  
  // 토큰 검증 실패
  if (!decoded) {
    throw new Error('Invalid refresh token');
  }
  
  // 토큰이 DB에 저장된 것인지 확인
  const savedToken = await prisma.refreshTokens.findFirst({
    where: {
      token_hash: await argon2.hash(refreshToken),
      user_id: decoded.userId,
      is_revoked: false,
      expires_at: {
        gt: new Date(),
      },
    },
  });
  
  if (!savedToken) {
    throw new Error('Refresh token not found or revoked');
  }
  
  // 사용자 정보 및 역할 조회
  const user = await prisma.users.findUnique({
    where: { user_id: decoded.userId },
    include: {
      role: true,
    },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // 새 토큰 생성
  const tokens = await generateTokens(user.user_id, user.role.role_name);
  
  // 기존 토큰 폐기 및 새 리프레시 토큰 저장
  await prisma.refreshTokens.update({
    where: { token_id: savedToken.token_id },
    data: { is_revoked: true },
  });
  
  await storeRefreshToken(user.user_id, tokens.refreshToken);
  
  return tokens;
}

/**
 * 로그아웃 처리 - 리프레시 토큰 무효화
 */
export async function logout(userId: number, refreshToken: string | undefined): Promise<boolean> {
  try {
    if (!refreshToken) {
      return false;
    }

    // 해당 사용자의 특정 리프레시 토큰 무효화
    const tokenHash = await argon2.hash(refreshToken);
    await prisma.refreshTokens.updateMany({
      where: {
        user_id: userId,
        token_hash: tokenHash,
        is_revoked: false
      },
      data: {
        is_revoked: true
      }
    });

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

/**
 * 리프레시 토큰 저장
 */
async function storeRefreshToken(userId: number, refreshToken: string) {
  // 리프레시 토큰 해시 계산
  const tokenHash = await argon2.hash(refreshToken);
  
  // 만료 시간 계산
  const expiresIn = env.JWT_REFRESH_EXPIRATION;
  const expiresAt = new Date();
  
  if (expiresIn.endsWith('d')) {
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn.slice(0, -1)));
  } else if (expiresIn.endsWith('h')) {
    expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn.slice(0, -1)));
  } else if (expiresIn.endsWith('m')) {
    expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expiresIn.slice(0, -1)));
  }
  
  // DB에 토큰 저장
  await prisma.refreshTokens.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      is_revoked: false,
    },
  });
} 