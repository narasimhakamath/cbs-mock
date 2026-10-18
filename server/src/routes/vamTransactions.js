import { Router } from 'express';
import { postVamCredit, postVamStatusAck, postMarkMissingTransaction } from '../controllers/vamTransactionController.js';

const router = Router();

router.post('/credit', postVamCredit);
router.post('/status-ack', postVamStatusAck);
router.post('/mark-missing-transaction', postMarkMissingTransaction);

export default router;
