import dotenv from 'dotenv';
import path from 'path';

// 환경변수 로드
dotenv.config();

// 필수 환경변수 검증
const requiredEnvVars = ['DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is missing`);
    process.exit(1);
  }
}

export const env = {
  // 서버 설정
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // 데이터베이스 설정
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/spring_advanced',
  DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres:password@localhost:5432/spring_advanced',
  
  // JWT 설정
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m', // 15분
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d', // 7일
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY || '', // RS256 private key
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY || '', // RS256 public key
  
  // CORS 설정
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // 이메일 설정 (관리자 이메일 주소 고정)
  ADMIN_EMAIL: '00@gmail.com',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  
  // 보안 설정
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per minute
  
  // Redis settings (for session/token management)
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_PREFIX: process.env.REDIS_PREFIX || 'spring_advanced:',
  
  // Email settings
  EMAIL_ENABLED: process.env.EMAIL_ENABLED || 'false',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_SECURE: process.env.EMAIL_SECURE || 'false',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
}; 