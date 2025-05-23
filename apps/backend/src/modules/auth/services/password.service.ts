import * as argon2 from 'argon2';

/**
 * Password service for hashing and verifying passwords using Argon2id
 * 
 * Argon2id is a modern password hashing algorithm that's designed to be secure 
 * against both side-channel attacks and GPU attacks. It's recommended by OWASP.
 */
export class PasswordService {
  /**
   * Hash a password using Argon2id
   * 
   * @param password - The plain text password to hash
   * @returns Promise resolving to the hashed password
   */
  async hashPassword(password: string): Promise<string> {
    // Using Argon2id with recommended parameters
    return argon2.hash(password, {
      // Argon2id combines the resistance to GPU attacks of Argon2d
      // with the resistance to side-channel attacks of Argon2i
      type: argon2.argon2id,
      
      // Memory cost: 19 MiB (19 * 1024 KB)
      memoryCost: 19456,
      
      // Time cost: 2 iterations
      timeCost: 2,
      
      // Parallelism: 1 thread
      parallelism: 1,
      
      // Output hash length: 32 bytes
      hashLength: 32,
      
      // Salt is automatically generated (32 bytes by default)
      // A unique salt is used for each password being hashed
    });
  }

  /**
   * Verify a password against a hash
   * 
   * @param hash - The previously hashed password
   * @param password - The plain text password to verify
   * @returns Promise resolving to true if password matches, false otherwise
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      // In case of verification errors (invalid hash format etc.), return false
      console.error('Password verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const passwordService = new PasswordService(); 