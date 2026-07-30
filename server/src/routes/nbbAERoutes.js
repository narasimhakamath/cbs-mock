import { Router } from 'express';
import { depositAccountDetailsEnquiry } from '../controllers/nbbAEController.js';

const router = Router();

router.post('/CPRSum', depositAccountDetailsEnquiry);

export default router;
