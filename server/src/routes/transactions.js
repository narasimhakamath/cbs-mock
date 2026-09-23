import { Router } from 'express';
import { listAllTransactions, acknowledgeTransaction } from '../controllers/transactionController.js';

const router = Router();

router.get('/', listAllTransactions);
router.post('/:id/acknowledge', acknowledgeTransaction);

export default router;
