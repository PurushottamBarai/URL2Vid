const SAFE_STATUS_CODES = new Set([400, 401, 403, 404, 409, 422, 429, 500, 502, 503]);

const errorHandler = (err, req, res, next) => {
  const statusCode = SAFE_STATUS_CODES.has(err.status) ? err.status : 500;
  let message = err.message || 'An unexpected error occurred processing your request.';
  const stderr = err.stderr ? err.stderr.trim() : null;

  message = message.split(process.cwd()).join('[SERVER_DIR]');

  process.stderr.write(`[error] ${req.method} ${req.path} → ${statusCode}: ${message}\n`);
  if (stderr) {
    process.stderr.write(`[error details]: ${stderr.split(process.cwd()).join('[SERVER_DIR]')}\n`);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    error: message,
    ...(stderr && { details: stderr.split(process.cwd()).join('[SERVER_DIR]') })
  });
};

export default errorHandler;
