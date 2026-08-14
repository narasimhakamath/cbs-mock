import { Router } from 'express';
import {
  depositAccountDetailsEnquiry,
  fullAndMiniStatement,
  quoteRequest,
  purposeCodeForCountry,
} from '../controllers/nbbAEController.js';

const router = Router();

router.post('/CPRSum', depositAccountDetailsEnquiry);
router.post('/FullAndMiniStatement', fullAndMiniStatement);
router.post('/QuoteRequest', quoteRequest);
router.post('/PurposeCodeForCountry', purposeCodeForCountry);

export default router;
