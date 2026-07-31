import { DFL_ENVIRONMENTS } from '../config/dflEnvironments.js';

export async function resolvePhysicalAccount(req, res) {
  const accountId = (req.query.accountId || '').trim();
  if (!accountId) {
    return res.status(400).json({ message: 'accountId is required' });
  }

  const env = (req.query.env || '').toUpperCase();
  const target = DFL_ENVIRONMENTS[env];
  if (!target) {
    return res.status(400).json({ message: 'env must be one of DEV, QA' });
  }
  if (!target.baseUrl || !target.token) {
    return res.status(500).json({ message: `${env} environment is not configured` });
  }

  const creditAmount = (req.query.creditAmount || '').trim();
  const params = new URLSearchParams({ accountId });
  if (creditAmount) params.set('creditAmount', creditAmount);
  const url = `${target.baseUrl}/proxy/physicalAccounts/resolve?${params.toString()}`;

  let upstreamRes;
  try {
    upstreamRes = await fetch(url, {
      headers: { Authorization: `JWT ${target.token}` },
    });
  } catch (err) {
    return res.status(502).json({ message: 'Failed to reach physical accounts service' });
  }

  const body = await upstreamRes.json().catch(() => ({}));
  res.status(upstreamRes.status).json(body);
}
