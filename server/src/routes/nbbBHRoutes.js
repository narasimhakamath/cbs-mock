import { Router } from 'express';
import { depositAccountDetailsEnquiry } from '../controllers/nbbBHController.js';

const router = Router();

router.post('/CPRSum', depositAccountDetailsEnquiry);

export default router;
