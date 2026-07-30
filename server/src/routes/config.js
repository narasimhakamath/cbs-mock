import { Router } from 'express';
import { COUNTRIES, CURRENCIES } from '../config/lookups.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ countries: COUNTRIES, currencies: CURRENCIES });
});

export default router;
