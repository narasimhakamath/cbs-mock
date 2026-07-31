import { Router } from 'express';
import { postVamCredit } from '../controllers/vamTransactionController.js';

const router = Router();

router.post('/credit', postVamCredit);

export default router;
