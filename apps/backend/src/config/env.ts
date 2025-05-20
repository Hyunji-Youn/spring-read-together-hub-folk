const dotenv = require('dotenv');
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
  DATABASE_URL: process.env.DATABASE_URL as string,
  DIRECT_URL: process.env.DIRECT_URL as string,
  
  // JWT 설정
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access-secret-key-dev',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-dev',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m', // 15분
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d', // 7일
  
  // CORS 설정
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // 이메일 설정 (관리자 이메일 주소 고정)
  ADMIN_EMAIL: '00@gmail.com',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  
  // 보안 설정
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1분 (ms 단위)
  RATE_LIMIT_MAX: 5, // 5 요청/분
}; 