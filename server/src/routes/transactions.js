import { Router } from 'express';
import { listAllTransactions } from '../controllers/transactionController.js';

const router = Router();

router.get('/', listAllTransactions);

export default router;
