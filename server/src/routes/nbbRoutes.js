import { Router } from 'express';
import { depositAccountDetailsEnquiry } from '../controllers/nbbController.js';

const router = Router();

router.post('/CPRSum', depositAccountDetailsEnquiry);

export default router;
