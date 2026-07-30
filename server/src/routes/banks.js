import { Router } from 'express';
import {
  listBanks,
  getBank,
  createBank,
  updateBank,
  deleteBank,
} from '../controllers/bankController.js';

const router = Router();

router.get('/', listBanks);
router.get('/:id', getBank);
router.post('/', createBank);
router.patch('/:id', updateBank);
router.delete('/:id', deleteBank);

export default router;
