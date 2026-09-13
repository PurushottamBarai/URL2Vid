import express from 'express';
const router = express.Router();
import { getInfo } from '../controllers/infoController.js';
import validateUrl from '../middlewares/validateUrl.js';

router.post('/', validateUrl, getInfo);

export default router;
