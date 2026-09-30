import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listUserAccounts,
} from '../controllers/userController.js';

const router = Router();

router.get('/', listUsers);
router.get('/:id', getUser);
router.get('/:id/accounts', listUserAccounts);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
