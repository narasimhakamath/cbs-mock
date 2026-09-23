import { Router } from 'express';
import {
  depositAccountDetailsEnquiry,
  fullAndMiniStatement,
  quoteRequest,
  purposeCodeForCountry,
  fundTransfer,
} from '../controllers/nbbAEController.js';

const router = Router();

router.post('/CPRSum', depositAccountDetailsEnquiry);
router.post('/FullAndMiniStatement', fullAndMiniStatement);
router.post('/QuoteRequest', quoteRequest);
router.post('/PurposeCodeForCountry', purposeCodeForCountry);
router.post('/FundTransfer', fundTransfer);

export default router;
