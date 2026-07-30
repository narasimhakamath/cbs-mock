import { Router } from 'express';
import {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/accountController.js';
import {
  listTransactions,
  createInwardCredit,
  createOutwardDebit,
} from '../controllers/transactionController.js';

const router = Router();

router.get('/', listAccounts);
router.get('/:id', getAccount);
router.post('/', createAccount);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

router.get('/:id/transactions', listTransactions);
router.post('/:id/transactions/inward-credit', createInwardCredit);
router.post('/:id/transactions/outward-debit', createOutwardDebit);

export default router;
