import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { testDatabaseConnection } from './config/database';

// 모듈 라우터 import 예정
import authRouter from './modules/auth/routes';
import userRouter from './modules/users/routes/user.routes';

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
  
  // CORS 설정
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
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
  
  return app;
}

// 애플리케이션 서버 시작 함수
export async function startServer() {
  try {
    const app = await createApp();
    const port = env.PORT;
    
    app.listen(port, () => {
      console.log(`✅ Server is running on port ${port}`);
      console.log(`🌐 Environment: ${env.NODE_ENV}`);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
} 