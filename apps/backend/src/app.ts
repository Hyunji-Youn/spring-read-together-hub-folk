import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { testDatabaseConnection } from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

// 모듈 라우터 import 예정
import authRouter from './modules/auth/routes/auth.routes';
import userRouter from './modules/users/routes/user.routes';
import auditRouter from './modules/audit/routes/audit.routes';

// HTTPS 인증서 경로 설정
const certDir = path.join(__dirname, '../certs');

export async function createApp(): Promise<Express> {
  // Express 애플리케이션 생성
  const app: Express = express();

  // 데이터베이스 연결 테스트
  await testDatabaseConnection();

  // 미들웨어 설정
  // Cookie 파싱 미들웨어
  app.use(cookieParser());
  
  // JSON 요청 바디 파싱
  app.use(express.json());
  
  // URL 인코딩된 폼 데이터 처리
  app.use(express.urlencoded({ extended: true }));
  
  // CORS 설정 - 항상 엄격한 보안 정책 적용
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-XSRF-TOKEN'],
  }));
  
  // 보안 헤더 설정
  app.use(helmet());
  
  // 속도 제한 설정 (rate limiting)
  app.use(rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS, // 1분
    max: env.RATE_LIMIT_MAX, // 최대 요청 수
    standardHeaders: true,
    legacyHeaders: false,
  }));
  
  // 상태 확인 엔드포인트
  app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // API 라우트 설정 (향후 모듈별 라우터 추가 예정)
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/audit', auditRouter);
  
  // Error handling middlewares
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}

// 애플리케이션 서버 시작 함수
export async function startServer() {
  try {
    const app = await createApp();
    const port = env.PORT;
    
    // HTTPS 옵션 설정
    const useHttps = fs.existsSync(path.join(certDir, 'server.key')) && fs.existsSync(path.join(certDir, 'server.cert'));
    
    if (useHttps) {
      // HTTPS 서버 옵션
      const httpsOptions = {
        key: fs.readFileSync(path.join(certDir, 'server.key')),
        cert: fs.readFileSync(path.join(certDir, 'server.cert')),
      };
      
      // HTTPS 서버 시작
      https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`✅ HTTPS Server is running on port ${port}`);
      console.log(`🌐 Environment: ${env.NODE_ENV}`);
    });
    } else {
      // HTTP 서버 시작 (기존 로직)
      app.listen(port, () => {
        console.log(`✅ HTTP Server is running on port ${port}`);
        console.log(`🌐 Environment: ${env.NODE_ENV}`);
        console.log(`⚠️ HTTPS is not configured. Create certificate files in ${certDir} to enable HTTPS.`);
      });
    }
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
} 