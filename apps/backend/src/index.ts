import 'reflect-metadata';
import { startServer } from './app';

// 서버 시작
startServer()
  .catch((error) => {
    console.error('❌ Fatal error during application startup:', error);
    process.exit(1);
  }); 