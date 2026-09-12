const express = require('express');
const router = express.Router();
const infoController = require('../controllers/infoController');
const validateUrl = require('../middlewares/validateUrl');

router.post('/', validateUrl, infoController.getInfo);

module.exports = router;
