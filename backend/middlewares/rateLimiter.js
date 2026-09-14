import rateLimit from 'express-rate-limit';

const rateLimiterMessage = { error: 'Too many requests from this IP, please try again after a minute.' };

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: rateLimiterMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;
