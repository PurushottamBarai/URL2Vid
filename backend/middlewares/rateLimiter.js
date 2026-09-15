import rateLimit from 'express-rate-limit';

const rateLimiterMessage = { error: 'Too many requests from this IP, please try again after a minute.' };

// Configured rate limiter instance (kept for future use)
export const activeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: rateLimiterMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

// Currently disabled: pass-through middleware
const limiter = (_req, _res, next) => next();

export default limiter;
