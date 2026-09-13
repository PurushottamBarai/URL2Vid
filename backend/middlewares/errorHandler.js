const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  const message = err.message || 'An unexpected error occurred processing your request.';

  res.status(statusCode).json({ error: message });
};

export default errorHandler;
