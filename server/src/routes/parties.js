import { Router } from 'express';
import {
  listParties,
  getParty,
  createParty,
  updateParty,
  deleteParty,
} from '../controllers/partyController.js';
import { listAccounts } from '../controllers/accountController.js';
import { listUsers } from '../controllers/userController.js';

const router = Router();

router.get('/', listParties);
router.get('/:id', getParty);
router.post('/', createParty);
router.patch('/:id', updateParty);
router.delete('/:id', deleteParty);
router.get('/:id/accounts', (req, res) => {
  req.params.partyId = req.params.id;
  return listAccounts(req, res);
});

router.get('/:id/users', (req, res) => {
  req.params.partyId = req.params.id;
  return listUsers(req, res);
});

export default router;
