import { Router } from 'express';
import {
  validateCIF,
  validateCIB,
  validatePhysicalAccount,
  getPABalance,
  cifAccounts,
  initiateKYC,
  payoutAdaptor,
  exchangeRate,
  quote,
  bankStatement,
} from '../controllers/localController.js';

const router = Router();

router.post('/validate-cif', validateCIF);
router.post('/validate-cib', validateCIB);
router.post('/validate-physical-account', validatePhysicalAccount);
router.post('/get-pa-balance', getPABalance);
router.post('/cif-accounts', cifAccounts);
router.post('/initiate-kyc', initiateKYC);
router.post('/payout-adaptor', payoutAdaptor);
router.post('/exchange-rate', exchangeRate);
router.post('/quote', quote);
router.post('/bank-statement', bankStatement);

export default router;
