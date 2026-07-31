import { Router } from 'express';
import { resolvePhysicalAccount } from '../controllers/physicalAccountController.js';

const router = Router();

router.get('/resolve', resolvePhysicalAccount);

export default router;
