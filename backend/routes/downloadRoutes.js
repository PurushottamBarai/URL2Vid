import express from 'express';
import { downloadMedia } from '../controllers/downloadController.js';
import validateUrl from '../middlewares/validateUrl.js';

const router = express.Router();

router.get('/', validateUrl, downloadMedia);

export default router;
