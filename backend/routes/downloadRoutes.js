import express from 'express';
const router = express.Router();
import { downloadMedia } from '../controllers/downloadController.js';
import validateUrl from '../middlewares/validateUrl.js';

router.get('/', validateUrl, downloadMedia);

export default router;
