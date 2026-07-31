import { Router } from 'express';
import { depositAccountDetailsEnquiry, fullAndMiniStatement, quoteRequest } from '../controllers/nbbBHController.js';

const router = Router();

router.post('/CPRSum', depositAccountDetailsEnquiry);
router.post('/FullAndMiniStatement', fullAndMiniStatement);
router.post('/QuoteRequest', quoteRequest);

export default router;
