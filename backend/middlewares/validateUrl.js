import { checkUrlStatus } from '../../frontend/src/utils/urlValidation.js';

const validateUrl = (req, res, next) => {
  const url = req.body?.url || req.query?.url;

  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  const { isValid, error } = checkUrlStatus(url);
  if (!isValid) {
    return res.status(400).json({ error });
  }

  next();
};

export default validateUrl;
