import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { testDatabaseConnection } from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { requestLogger, errorLogger } from './middlewares/logging.middleware';
import Logger from './common/utils/logger';
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

  Logger.info('Creating Express application with essential middleware', {}, 'APP_INIT');
  
  // For development: Allow self-signed certificates
  if (env.NODE_ENV === 'development') {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    // Additional certificate bypass for development
    const tls = require('tls');
    const originalCheckServerIdentity = tls.checkServerIdentity;
    tls.checkServerIdentity = () => undefined;
    console.log('🔧 TLS certificate validation completely disabled for development');
  }

  // Database connection
  await testDatabaseConnection();


  // Essential middleware for API functionality
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add request logging middleware early in the stack
  app.use(requestLogger);
  
  // Enhanced CORS configuration for HTTPS development
  Logger.info('CORS configuration', { origin: env.CORS_ORIGIN }, 'CORS');
  
  // Handle ALL requests (including preflight) with CORS headers first
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log(`=== ALL REQUESTS: ${req.method} ${req.originalUrl} ===`);
    console.log('Origin:', origin);
    
    // Always set CORS headers for any origin that matches localhost:5173
    if (origin && origin.includes('localhost:5173')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
    }
    
    // Handle preflight requests immediately
    if (req.method === 'OPTIONS') {
      console.log('=== PREFLIGHT HANDLED ===');
      return res.status(200).end();
    }
    
    next();
  });
  
  app.use(cors({
    origin: env.CORS_ORIGIN, // https://localhost:5173
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-XSRF-TOKEN'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200
  }));
  
  // Add debugging middleware to track all requests
  app.use((req, res, next) => {
    console.log(`=== REQUEST RECEIVED: ${req.method} ${req.originalUrl} ===`);
    console.log('Origin:', req.headers.origin);
    next();
  });
  
  // ABSOLUTE MINIMAL ROUTES FOR DEBUGGING
  console.log('=== REGISTERING MINIMAL ROUTES ===');
  
  app.get('/test', (req, res) => {
    console.log('=== ROOT TEST ROUTE HIT ===');
    res.json({ message: 'Root test works!' });
  });
  
  app.get('/api/test', (req, res) => {
    console.log('=== API TEST ROUTE HIT ===');
    res.header('Access-Control-Allow-Origin', env.CORS_ORIGIN);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.json({ 
      message: 'API test works!', 
      timestamp: new Date().toISOString(),
      certificateStatus: 'accepted'
    });
  });
  
  // Add a specific CORS test endpoint
  app.get('/api/cors-test', (req, res) => {
    Logger.info('CORS test endpoint hit', { origin: req.headers.origin }, 'CORS_TEST');
    res.header('Access-Control-Allow-Origin', env.CORS_ORIGIN);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.json({ 
      message: 'CORS test successful!', 
      origin: req.headers.origin,
      timestamp: new Date().toISOString()
    });
  });
  
  // Certificate test endpoint
  app.get('/api/certificate-test', (req, res) => {
    Logger.info('Certificate test endpoint hit', { 
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      method: req.method
    }, 'CERT_TEST');
    res.json({ 
      message: 'Certificate accepted! Backend is reachable.',
      timestamp: new Date().toISOString(),
      httpsWorking: true
    });
  });
  
  
  app.get('/health', (req, res) => {
    console.log('=== HEALTH ROUTE HIT ===');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  console.log('=== MINIMAL ROUTES REGISTERED ===');
  
  // Register application routes
  console.log('=== REGISTERING ROUTES ===');
  console.log('Auth router:', typeof authRouter, authRouter ? 'loaded' : 'not loaded');
  console.log('Auth router stack length:', authRouter?.stack?.length || 'no stack');
  console.log('User router:', typeof userRouter, userRouter ? 'loaded' : 'not loaded');
  console.log('Audit router:', typeof auditRouter, auditRouter ? 'loaded' : 'not loaded');
  
  app.use('/api/auth', (req, res, next) => {
    console.log('=== AUTH MIDDLEWARE HIT ===', req.method, req.path);
    next();
  }, authRouter);
  
  app.use('/api/users', userRouter);
  app.use('/api/audit', auditRouter);
  
  console.log('=== ROUTES REGISTERED ===');
  
  // Test endpoint for debugging - AFTER route registration
  app.get('/api/test', (_, res) => {
    console.log('=== TEST ENDPOINT HIT ===');
    res.status(200).json({ message: 'API is working' });
  });
  
  app.post('/api/test-auth', (req, res) => {
    console.log('=== TEST AUTH ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    res.status(200).json({ message: 'Auth endpoint is working', body: req.body });
  });
  
  // Error handling middleware
  app.use(errorLogger);  // Add error logging before error handler
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  console.log('=== APP CREATION COMPLETE ===');
  return app;
}

// 애플리케이션 서버 시작 함수
export async function startServer() {
  try {
    console.log('=== STARTING SERVER ===');
    console.log('Target port:', env.PORT);
    console.log('Certificate directory:', certDir);
    
    const app = await createApp();
    const port = env.PORT;
    
    // Add a test route directly to the app before starting server
    app.get('/direct-server-test', (req, res) => {
      console.log('=== DIRECT SERVER TEST HIT ===');
      res.json({ message: 'Direct server test works', timestamp: new Date().toISOString() });
    });
    
    // HTTPS 옵션 설정 - ALWAYS USE HTTPS
    const useHttps = fs.existsSync(path.join(certDir, 'server.key')) && fs.existsSync(path.join(certDir, 'server.cert'));
    console.log('HTTPS certificates exist:', useHttps);
    console.log('Using HTTPS:', useHttps);
    
    if (useHttps) {
      // HTTPS 서버 옵션
      const httpsOptions = {
        key: fs.readFileSync(path.join(certDir, 'server.key')),
        cert: fs.readFileSync(path.join(certDir, 'server.cert')),
      };
      
      // HTTPS 서버 시작 with enhanced options for development
      const httpsOptionsEnhanced = {
        ...httpsOptions,
        // Enhanced options for self-signed certificates
        secureProtocol: 'TLS_method',
        honorCipherOrder: true,
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384'
        ].join(':'),
      };
      
      const server = https.createServer(httpsOptionsEnhanced, app);
      server.listen(port, () => {
        console.log(`✅ HTTPS Server is running on port ${port}`);
        console.log(`🌐 Environment: ${env.NODE_ENV}`);
        console.log(`🔗 Test URL: https://localhost:${port}/direct-server-test`);
        console.log(`🔧 Self-signed certificates enabled for development`);
        console.log(`⚠️  IMPORTANT: Visit https://localhost:${port}/api/test in your browser and accept the certificate first!`);
      });
      
      server.on('error', (error) => {
        console.error('❌ HTTPS Server error:', error);
      });
      
      server.on('clientError', (err, socket) => {
        console.log('HTTPS Client error:', err.message);
        // More permissive error handling for self-signed certificates
        if (!socket.destroyed) {
          socket.end('HTTP/1.1 400 Bad Request\r\nAccess-Control-Allow-Origin: https://localhost:5173\r\n\r\n');
        }
      });
      
      server.on('tlsClientError', (err, tlsSocket) => {
        console.log('TLS Client error:', err.message);
        // Handle TLS errors more gracefully
      });
    } else {
      // HTTP 서버 시작 (기존 로직)
      const server = app.listen(port, () => {
        console.log(`✅ HTTP Server is running on port ${port}`);
        console.log(`🌐 Environment: ${env.NODE_ENV}`);
        console.log(`🔗 Test URL: http://localhost:${port}/direct-server-test`);
        console.log(`⚠️ HTTPS is not configured. Create certificate files in ${certDir} to enable HTTPS.`);
      });
      
      server.on('error', (error) => {
        console.error('❌ HTTP Server error:', error);
      });
    }
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
} 