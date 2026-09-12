const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const validateUrl = require('../middlewares/validateUrl');

router.get('/', validateUrl, downloadController.downloadMedia);

module.exports = router;
