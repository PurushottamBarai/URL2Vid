import express from 'express';
import { getInfo } from '../controllers/infoController.js';
import validateUrl from '../middlewares/validateUrl.js';

const router = express.Router();

router.post('/', validateUrl, getInfo);

export default router;
