import { Router } from 'express';
import {
  listParties,
  getParty,
  createParty,
  updateParty,
  deleteParty,
} from '../controllers/partyController.js';
import { listAccounts } from '../controllers/accountController.js';

const router = Router();

router.get('/', listParties);
router.get('/:id', getParty);
router.post('/', createParty);
router.patch('/:id', updateParty);
router.delete('/:id', deleteParty);
router.get('/:id/accounts', (req, res) => {
  req.query.partyId = req.params.id;
  return listAccounts(req, res);
});

export default router;
