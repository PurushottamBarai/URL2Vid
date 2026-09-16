import { checkUrlStatus } from '../utils/urlValidation.js';

const validateUrl = (req, res, next) => {
  const url = req.body?.url || req.query?.url;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  const trimmedUrl = url.trim();
  const { isValid, error } = checkUrlStatus(trimmedUrl);
  if (!isValid) {
    return res.status(400).json({ error });
  }

  if (req.body?.url) req.body.url = trimmedUrl;
  if (req.query?.url) req.query.url = trimmedUrl;

  next();
};

export default validateUrl;
