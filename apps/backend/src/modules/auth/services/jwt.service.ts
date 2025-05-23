import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { env } from '../../../config/env';
import { prisma } from '../../../config/database';
import crypto from 'crypto';

// Interface for JWT payload
export interface JwtPayload {
  sub: number; // User ID
  role: string; // User role
  email?: string; // Optional user email
  username?: string; // Optional username
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
  jti?: string; // JWT ID for token identification
}

// Define StringValue to match jwt.sign expectations
type StringValue = string | Buffer;

/**
 * Service for JWT token generation, verification, and management
 * 
 * Consistently uses RS256 (RSA Signature with SHA-256) for secure token signing.
 * All JWT operations in this service must use RS256 without exception.
 */
export class JwtService {
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;
  private privateKey: string | null = null;
  private publicKey: string | null = null;

  constructor() {
    this.accessTokenExpiration = env.JWT_ACCESS_EXPIRATION;
    this.refreshTokenExpiration = env.JWT_REFRESH_EXPIRATION;
    
    // Load keys synchronously to ensure they're available when needed
    this.loadKeys();
  }

  /**
   * Load RSA keys from environment variables or generate them if needed
   * This is now a synchronous method to ensure keys are available
   */
  private loadKeys(): void {
    try {
      // First, try to load keys from environment
      if (env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY) {
        // Validate the key format before accepting
        if (this.validateRsaKeyPair(env.JWT_PRIVATE_KEY, env.JWT_PUBLIC_KEY)) {
          this.privateKey = env.JWT_PRIVATE_KEY;
          this.publicKey = env.JWT_PUBLIC_KEY;
          console.log('✅ RS256 keys loaded from environment variables');
          return;
        } else {
          console.warn('⚠️ RS256 keys in environment variables are invalid, falling back to file or generation');
        }
      }

      // Keys not in environment, check for key files
      const keysDir = path.join(process.cwd(), 'keys');
      const privateKeyPath = path.join(keysDir, 'private.key');
      const publicKeyPath = path.join(keysDir, 'public.key');

      // Create directory if it doesn't exist
      if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
      }

      // Check if key files exist
      if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        
        // Validate the key format before accepting
        if (this.validateRsaKeyPair(privateKey, publicKey)) {
          this.privateKey = privateKey;
          this.publicKey = publicKey;
          console.log('✅ RS256 keys loaded from file system');
          return;
        } else {
          console.warn('⚠️ RS256 keys in files are invalid, generating new keys');
        }
      }

      // Generate new key pair
      console.log('Generating new RS256 key pair for JWT signing...');
      const { privateKey, publicKey } = this.generateKeyPair();
      
      // Validate the generated keys
      if (!this.validateRsaKeyPair(privateKey, publicKey)) {
        throw new Error('Generated RSA key pair is invalid');
      }
      
      // Save keys to files
      fs.writeFileSync(privateKeyPath, privateKey);
      fs.writeFileSync(publicKeyPath, publicKey);
      fs.chmodSync(privateKeyPath, 0o600); // Read/write for owner only
      
      this.privateKey = privateKey;
      this.publicKey = publicKey;
      
      console.log('✅ RS256 key pair generated and saved successfully');
    } catch (error) {
      console.error('Error loading or generating JWT keys:', error);
      throw new Error('Failed to initialize JWT service: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    // Final validation to ensure keys are loaded
    if (!this.privateKey || !this.publicKey) {
      throw new Error('Failed to load or generate valid RSA keys for JWT');
    }
  }

  /**
   * Validate RSA key pair format
   * @param privateKey - The private key to validate
   * @param publicKey - The public key to validate
   * @returns true if both keys are valid, false otherwise
   */
  private validateRsaKeyPair(privateKey: string, publicKey: string): boolean {
    try {
      // Check if private key appears to be in PEM format
      if (!privateKey.includes('BEGIN PRIVATE KEY') && 
          !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
        return false;
      }
      
      // Check if public key appears to be in PEM format
      if (!publicKey.includes('BEGIN PUBLIC KEY')) {
        return false;
      }
      
      // Test signature creation and verification with the key pair
      const testPayload = { test: true };
      const signOptions = { algorithm: 'RS256' as jwt.Algorithm };
      const verifyOptions = { algorithms: ['RS256' as jwt.Algorithm] };
      
      // Try to sign with private key
      const testToken = jwt.sign(testPayload, privateKey, signOptions);
      
      // Try to verify with public key
      jwt.verify(testToken, publicKey, verifyOptions);
      
      return true;
    } catch (error) {
      console.error('Key validation error:', error);
      return false;
    }
  }

  /**
   * Generate a new RSA key pair for JWT signing
   */
  private generateKeyPair(): { privateKey: string, publicKey: string } {
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
   * Generate an access token for a user
   * 
   * @param userId - User ID to include in the token
   * @param role - User role for authorization
   * @param additionalData - Additional data to include in the token
   * @returns Promise resolving to the generated access token
   */
  async generateAccessToken(
    userId: number,
    role: string,
    additionalData: { email?: string; username?: string } = {}
  ): Promise<string> {
    if (!this.privateKey) {
      throw new Error('JWT private key not available');
    }

    const payload: JwtPayload = {
      sub: userId,
      role,
      ...additionalData
    };

    // Use promisify to convert the callback-based jwt.sign to a Promise-based function
    const signAsync = promisify<JwtPayload, jwt.Secret, jwt.SignOptions, string>(jwt.sign);
    
    return signAsync(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.accessTokenExpiration as jwt.SignOptions['expiresIn'],
      jwtid: crypto.randomBytes(16).toString('hex')
    });
  }

  /**
   * Generate a refresh token for a user
   * 
   * @param userId - User ID to include in the token
   * @param role - User role for authorization
   * @returns Promise resolving to the generated refresh token and its hash
   */
  async generateRefreshToken(
    userId: number,
    role: string
  ): Promise<{ token: string; hash: string; expiresAt: Date }> {
    if (!this.privateKey) {
      throw new Error('JWT private key not available');
    }

    // Generate a unique token ID
    const jti = crypto.randomBytes(32).toString('hex');
    
    // Create payload with minimal data
    const payload: JwtPayload = {
      sub: userId,
      role
    };

    // Use promisify to convert the callback-based jwt.sign to a Promise-based function
    const signAsync = promisify<JwtPayload, jwt.Secret, jwt.SignOptions, string>(jwt.sign);
    
    // Calculate expiration date for database storage
    const expiresInSeconds = typeof this.refreshTokenExpiration === 'string'
      ? parseInt(this.refreshTokenExpiration.replace(/\D/g, '')) * (this.refreshTokenExpiration.includes('d') ? 86400 : 60)
      : this.refreshTokenExpiration;
    
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    
    // Sign the token
    const token = await signAsync(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.refreshTokenExpiration as jwt.SignOptions['expiresIn'],
      jwtid: jti
    });
    
    // Create a hash of the token for storage
    // We don't store the actual token in the database for security
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    
    return { token, hash, expiresAt };
  }

  /**
   * Store a refresh token hash in the database
   * 
   * @param userId - User ID associated with the token
   * @param tokenHash - Hash of the refresh token
   * @param expiresAt - Expiration date of the token
   * @returns Promise resolving to the created token record
   */
  async storeRefreshToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date
  ) {
    // Store the token hash in the database
    return prisma.refreshTokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        is_revoked: false
      }
    });
  }

  /**
   * Revoke a refresh token
   * 
   * @param tokenHash - Hash of the token to revoke
   * @returns Promise resolving to true if token was found and revoked
   */
  async revokeRefreshToken(tokenHash: string): Promise<boolean> {
    try {
      const result = await prisma.refreshTokens.updateMany({
        where: { token_hash: tokenHash },
        data: { is_revoked: true }
      });
      
      return result.count > 0;
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      return false;
    }
  }

  /**
   * Verify and decode a JWT token
   * 
   * @param token - The JWT token to verify
   * @returns Promise resolving to the decoded token payload if valid
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    if (!this.publicKey) {
      throw new Error('JWT public key not available');
    }

    // Debug: Log token algorithm
    try {
      const decoded = jwt.decode(token, { complete: true });
      console.log('Token algorithm debug:', {
        algorithm: decoded?.header?.alg,
        tokenStart: token.substring(0, 20) + '...'
      });
    } catch (error) {
      console.error('Error decoding token for debug:', error);
    }

    // Use promisify to convert the callback-based jwt.verify to a Promise-based function
    const verifyAsync = promisify<string, jwt.Secret, jwt.VerifyOptions, JwtPayload>(jwt.verify);
    
    try {
      // Always explicitly specify RS256 as the algorithm
      return await verifyAsync(token, this.publicKey, {
        algorithms: ['RS256'] // Only allow RS256 algorithm
      });
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Verify a refresh token and check it's not revoked
   * 
   * @param token - The refresh token to verify
   * @returns Promise resolving to the token payload if valid
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      if (!this.publicKey) {
        throw new Error('JWT public key not available');
      }
      
      // Verify token using RS256 algorithm with the public key
      const verifyAsync = promisify<string, jwt.Secret, jwt.VerifyOptions, JwtPayload>(jwt.verify);
      const payload = await verifyAsync(token, this.publicKey, {
        algorithms: ['RS256'] // Only allow RS256 algorithm
      });
      
      // Compute the token hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Check if the token is in our database and not revoked
      const storedToken = await prisma.refreshTokens.findFirst({
        where: {
          token_hash: tokenHash,
          is_revoked: false,
          expires_at: { gt: new Date() }
        }
      });
      
      if (!storedToken) {
        throw new Error('Invalid or revoked refresh token');
      }
      
      return payload;
    } catch (error) {
      console.error('Refresh token verification error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * 
   * @param userId - The user ID whose tokens should be revoked
   * @returns Promise resolving to the number of revoked tokens
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    try {
      const result = await prisma.refreshTokens.updateMany({
        where: { 
          user_id: userId,
          is_revoked: false
        },
        data: { is_revoked: true }
      });
      
      return result.count;
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      return 0;
    }
  }

  /**
   * Extract token from authorization header
   * 
   * @param authHeader - The authorization header value
   * @returns The token if found, null otherwise
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}

// Export singleton instance
export const jwtService = new JwtService(); 