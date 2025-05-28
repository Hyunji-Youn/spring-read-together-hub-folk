import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rate-limit.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Add debugging middleware to the auth router
router.use((req, res, next) => {
  console.log(`=== AUTH ROUTER HIT: ${req.method} ${req.path} ===`);
  console.log('Full URL:', req.originalUrl);
  console.log('Base URL:', req.baseUrl);
  next();
});

// Test route for debugging
router.get('/test', (req, res) => {
  console.log('=== AUTH TEST ROUTE HIT ===');
  res.json({ message: 'Auth router is working' });
});

/**
 * @route POST /api/auth/admin/login
 * @desc Special admin login with static credentials
 * @access Public
 */
router.post('/admin/login', (req, res, next) => {
  console.log('=== ADMIN LOGIN ROUTE HIT ===');
  next();
}, authController.adminLogin);

/**
 * @route POST /api/auth/login
 * @desc Login user and get tokens
 * @access Public
 */
router.post('/login', authRateLimiter, authController.login);

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authRateLimiter, authController.register);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public (with refresh token in cookie)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate tokens
 * @access Public (but usually requires auth for meaningful logout)
 */
router.post('/logout', authController.logout);

export default router; 