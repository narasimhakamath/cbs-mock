import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import accountsRouter from './routes/accounts.js';
import partiesRouter from './routes/parties.js';
import usersRouter from './routes/users.js';
import transactionsRouter from './routes/transactions.js';
import physicalAccountsRouter from './routes/physicalAccounts.js';
import vamTransactionsRouter from './routes/vamTransactions.js';
import configRouter from './routes/config.js';
import nbbAERoutes from './routes/nbbAERoutes.js';
import nbbBHRoutes from './routes/nbbBHRoutes.js';
import beaconAERoutes from './routes/beaconAERoutes.js';
import cbsStubRoutes from './routes/cbsStubRoutes.js';
import localRoutes from './routes/localRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'public');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

for (const prefix of ['/api', '/cbs/api']) {
  app.use(`${prefix}/accounts`, accountsRouter);
  app.use(`${prefix}/parties`, partiesRouter);
  app.use(`${prefix}/users`, usersRouter);
  app.use(`${prefix}/transactions`, transactionsRouter);
  app.use(`${prefix}/physical-accounts`, physicalAccountsRouter);
  app.use(`${prefix}/vam-transactions`, vamTransactionsRouter);
  app.use(`${prefix}/config`, configRouter);
  app.use(`${prefix}/nbb-ae`, nbbAERoutes);
  app.use(`${prefix}/nbb-bh`, nbbBHRoutes);
  app.use(`${prefix}/beacon-ae`, beaconAERoutes);
  app.use(`${prefix}/cbs-stub`, cbsStubRoutes);
  app.use(`${prefix}/local`, localRoutes);
}

app.use('/cbs', express.static(clientDist));
app.get(/^\/cbs(?!\/api)(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

export default app;
