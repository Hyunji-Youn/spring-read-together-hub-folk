import rateLimit from 'express-rate-limit';
import { env } from '../../../config/env';

/**
 * Rate limiting middleware for authentication endpoints
 * 
 * Limits requests to 20 per minute per IP address as specified in PRD 5.4
 */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 1 minute window
  max: env.RATE_LIMIT_MAX, // 20 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  skipSuccessfulRequests: false, // Don't skip successful requests
  // Apply it to all IP addresses
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if behind a proxy, or client IP otherwise
    return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
  }
}); 