import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { RoleName } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Token Service
 * Handles JWT token operations using RS256 algorithm consistently.
 * This service must always use RS256 without exception.
 */

// JWT token payload type
interface TokenPayload {
  userId: number;
  role: RoleName;
}

// Token response type
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

// RS256 key variables
let privateKey: string;
let publicKey: string;

// Initialization function - load keys
(function loadKeys() {
  try {
    // Try to load keys from environment variables
    if (env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY) {
      privateKey = env.JWT_PRIVATE_KEY;
      publicKey = env.JWT_PUBLIC_KEY;
      console.log('✅ RS256 keys loaded from environment variables in token.service');
      return;
    }

    // Try to load keys from files
    const keysDir = path.join(process.cwd(), 'keys');
    const privateKeyPath = path.join(keysDir, 'private.key');
    const publicKeyPath = path.join(keysDir, 'public.key');

    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
      privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      publicKey = fs.readFileSync(publicKeyPath, 'utf8');
      console.log('✅ RS256 keys loaded from file system in token.service');
      return;
    }

    // Generate keys if they don't exist
    console.log('Generating new RS256 key pair in token.service...');
    const keys = generateKeyPair();
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;

    // Create directory and save keys
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }
    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);
    fs.chmodSync(privateKeyPath, 0o600); // Owner read/write only

    console.log('✅ RS256 key pair generated and saved in token.service');
  } catch (error) {
    console.error('Error loading or generating JWT keys in token.service:', error);
    throw new Error('Failed to initialize tokens service: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
})();

// Generate RSA key pair function
function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

/**
 * Generate access and refresh tokens
 * Always uses RS256 algorithm for consistent security
 */
export async function generateTokens(userId: number, role: RoleName): Promise<TokenResponse> {
  const accessTokenPayload: TokenPayload = { userId, role };
  const refreshTokenPayload: TokenPayload = { userId, role };
  
  // Calculate expiration time in seconds
  const accessTokenExpiresIn = parseExpirationToSeconds(env.JWT_ACCESS_EXPIRATION);
  const refreshTokenExpiresIn = parseExpirationToSeconds(env.JWT_REFRESH_EXPIRATION);
  
  // Generate tokens (using RS256 algorithm)
  const accessToken = jwt.sign(
    accessTokenPayload,
    privateKey,
    { 
      expiresIn: accessTokenExpiresIn,
      algorithm: 'RS256'  // Explicitly use RS256
    }
  );
  
  const refreshToken = jwt.sign(
    refreshTokenPayload,
    privateKey,
    { 
      expiresIn: refreshTokenExpiresIn,
      algorithm: 'RS256'  // Explicitly use RS256
    }
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenExpiresIn,
  };
}

/**
 * Verify access token
 * Only accepts tokens signed with RS256 algorithm
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    // Explicitly specify we only accept RS256
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Verify refresh token
 * Only accepts tokens signed with RS256 algorithm
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    // Explicitly specify we only accept RS256
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Parse expiration string (e.g., '15m', '1h', '7d') to seconds
 */
function parseExpirationToSeconds(expiration: string): number {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1));
  
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 900; // Default 15 minutes
  }
} 