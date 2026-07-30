import { Router } from 'express';
import { depositAccountDetailsEnquiry, fullAndMiniStatement } from '../controllers/nbbBHController.js';

const router = Router();

router.post('/CPRSum', depositAccountDetailsEnquiry);
router.post('/FullAndMiniStatement', fullAndMiniStatement);

export default router;
