import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// 로그인 라우트
router.post('/login', authController.login);

// 회원가입 라우트
router.post('/register', authController.register);

// 로그아웃 라우트
router.post('/logout', authMiddleware, authController.logout);

// 토큰 갱신 라우트는 필요시 나중에 추가

export default router; 