import { Router } from 'express';
import { postVamCredit, postVamStatusAck } from '../controllers/vamTransactionController.js';

const router = Router();

router.post('/credit', postVamCredit);
router.post('/status-ack', postVamStatusAck);

export default router;
