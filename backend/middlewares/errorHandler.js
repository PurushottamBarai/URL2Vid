const SAFE_STATUS_CODES = new Set([400, 401, 403, 404, 409, 422, 429, 500, 502, 503]);

const sanitize = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text.split(process.cwd()).join('[SERVER_DIR]');
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const rawStatus = err.status || err.statusCode;
  const statusCode = SAFE_STATUS_CODES.has(rawStatus) ? rawStatus : 500;
  const message = sanitize(err.message || 'An unexpected error occurred processing your request.');
  const stderr = err.stderr ? sanitize(err.stderr.trim()) : null;

  process.stderr.write(`[error] ${req.method} ${req.path} → ${statusCode}: ${message}\n`);
  if (stderr) {
    process.stderr.write(`[error details]: ${stderr}\n`);
  }

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    error: message,
    ...(isDev && stderr && { details: stderr })
  });
};

export default errorHandler;
