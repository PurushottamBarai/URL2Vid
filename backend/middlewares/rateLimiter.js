import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per window
  message: 'Too many requests from this IP, please try again after a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;
