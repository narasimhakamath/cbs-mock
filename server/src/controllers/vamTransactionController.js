import { DFL_ENVIRONMENTS } from '../config/dflEnvironments.js';

export async function postVamCredit(req, res) {
  const {
    env,
    externalRefId,
    transactionReferenceId,
    accountId,
    ledgerId,
    currency,
    amount,
  } = req.body;

  const envKey = (env || '').toUpperCase();
  const target = DFL_ENVIRONMENTS[envKey];
  if (!target) {
    return res.status(400).json({ message: 'env must be one of DEV, QA' });
  }
  if (!target.baseUrl || !target.token) {
    return res.status(500).json({ message: `${envKey} environment is not configured` });
  }
  if (!accountId || !ledgerId || !currency || !amount) {
    return res.status(400).json({ message: 'accountId, ledgerId, currency and amount are required' });
  }

  const body = {
    externalRefId,
    type: 'Money-In',
    transactionReferenceId,
    entries: [
      { accountId, indicator: 'CREDIT', amount, currency },
      { accountId: `${ledgerId}-CASH`, indicator: 'DEBIT', amount, currency },
    ],
  };

  let upstreamRes;
  try {
    upstreamRes = await fetch(`${target.baseUrl}/proxy/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${target.token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return res.status(502).json({ message: 'Failed to reach transactions service' });
  }

  const responseBody = await upstreamRes.json().catch(() => ({}));
  res.status(upstreamRes.status).json(responseBody);
}
