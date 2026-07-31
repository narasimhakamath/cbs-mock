import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import accountsRouter from './routes/accounts.js';
import partiesRouter from './routes/parties.js';
import transactionsRouter from './routes/transactions.js';
import physicalAccountsRouter from './routes/physicalAccounts.js';
import vamTransactionsRouter from './routes/vamTransactions.js';
import configRouter from './routes/config.js';
import nbbAERoutes from './routes/nbbAERoutes.js';
import nbbBHRoutes from './routes/nbbBHRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'public');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/accounts', accountsRouter);
app.use('/api/parties', partiesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/physical-accounts', physicalAccountsRouter);
app.use('/api/vam-transactions', vamTransactionsRouter);
app.use('/api/config', configRouter);
app.use('/api/nbb-ae', nbbAERoutes);
app.use('/api/nbb-bh', nbbBHRoutes);

app.use(express.static(clientDist));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

export default app;
