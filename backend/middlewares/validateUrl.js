const { isValidUrl } = require('../utils/urlHelpers');

const validateUrl = (req, res, next) => {
  const url = req.body?.url || req.query?.url;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid or unsupported URL.' });
  }

  next();
};

module.exports = validateUrl;
