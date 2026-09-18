import express from 'express';
import { downloadMedia, getDownloadStatus } from '../controllers/downloadController.js';
import validateUrl from '../middlewares/validateUrl.js';

const router = express.Router();

router.get('/status', getDownloadStatus);
router.get('/', validateUrl, downloadMedia);

export default router;
