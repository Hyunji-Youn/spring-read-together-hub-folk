/**
 * Utility script to hash a registration code using Argon2
 * 
 * Usage:
 * ts-node src/scripts/hash-registration-code.ts [registration_code]
 * 
 * If registration_code is not provided, it will use 'test123test123' by default
 */

import * as argon2 from 'argon2';

async function hashRegistrationCode() {
  try {
    // Get code from command line or use default
    const code = process.argv[2] || 'test123test123';
    
    // Hash the code
    const hashedCode = await argon2.hash(code);
    
    console.log('Original code:', code);
    console.log('Hashed code:', hashedCode);
    console.log('\nSQL command to update in database:');
    console.log(`UPDATE public."AppConfig" SET value = '${hashedCode}', notes = 'Hashed registration code: ${code}', updated_at = CURRENT_TIMESTAMP WHERE key = 'REGISTRATION_PASSWORD';`);
    
  } catch (error) {
    console.error('Error hashing registration code:', error);
  }
}

// Run the function
hashRegistrationCode(); 