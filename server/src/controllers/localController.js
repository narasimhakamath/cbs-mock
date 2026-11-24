import Party from '../models/Party.js';
import Account from '../models/Account.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { mockFxRate } from '../utils/fxRate.js';
import { FINANCIAL_INSTITUTION_IDS } from '../config/lookups.js';

// POST /api/local/validate-cif
// VAM sends: { cif }
// VAM reads: { isValidCIF, party }
export async function validateCIF(req, res) {
  const { cif } = req.body;
  if (!cif) return res.status(400).json({ message: 'cif is required' });

  const party = await Party.findById(cif);
  if (!party) return res.json({ isValidCIF: false, party: null });

  return res.json({ isValidCIF: true, party });
}

// POST /api/local/validate-cib
// VAM sends: { cib }
// VAM reads: { isValidCIB, user }
export async function validateCIB(req, res) {
  const { cib } = req.body;
  if (!cib) return res.status(400).json({ message: 'cib is required' });

  const user = await User.findById(cib);
  if (!user) return res.json({ isValidCIB: false, user: null });

  return res.json({ isValidCIB: true, user });
}

// POST /api/local/validate-physical-account
// VAM sends: { accountId, country }
// VAM reads: { currencyCode, country, financialInstitutionId }
export async function validatePhysicalAccount(req, res) {
  const { accountId, country } = req.body;
  if (!accountId) return res.status(400).json({ message: 'accountId is required' });

  const account = await Account.findById(accountId);
  if (!account) return res.status(404).json({ message: 'Account not found' });

  return res.json({
    currencyCode: account.currencyCode,
    country: account.countryCode,
    financialInstitutionId: FINANCIAL_INSTITUTION_IDS[account.countryCode] ?? '999',
  });
}

// POST /api/local/get-pa-balance
// VAM sends: { physicalAccountId, countryCode, currencyCode }
// VAM reads: { physicalAccountId, currency, availableBalance }
export async function getPABalance(req, res) {
  const { physicalAccountId } = req.body;
  if (!physicalAccountId) return res.status(400).json({ message: 'physicalAccountId is required' });

  const account = await Account.findById(physicalAccountId);
  if (!account) return res.status(404).json({ message: 'Account not found' });

  return res.json({
    physicalAccountId: account._id,
    currency: account.currencyCode,
    availableBalance: account.balance,
  });
}

// POST /api/local/cif-accounts
// VAM sends: { cif }
// VAM reads: [ { accountId, ... } ]
export async function cifAccounts(req, res) {
  const { cif } = req.body;
  if (!cif) return res.status(400).json({ message: 'cif is required' });

  const accounts = await Account.find({ partyId: cif });

  return res.json(accounts.map(a => ({
    accountId: a._id,
    name: a.name,
    currency: a.currencyCode,
    country: a.countryCode,
    financialInstitutionId: FINANCIAL_INSTITUTION_IDS[a.countryCode] ?? '999',
    balance: a.balance,
  })));
}

// POST /api/local/initiate-kyc
// VAM sends: { new: <account>, old: <account|null> }
// VAM reads: { attributes, kycExternalData } — auto-approve
export async function initiateKYC(req, res) {
  const incoming = req.body?.new || {};
  const attributes = incoming.attributes || {};

  return res.json({
    ...attributes,
    kycExternalData: attributes.kycExternalData || [],
    attributes,
  });
}

// POST /api/local/payout-adaptor
// VAM sends: full payment body (req.body)
// VAM reads: { status, code, message } — RJCT/FAIL triggers error
export async function payoutAdaptor(req, res) {
  return res.json({ status: 'ACCP', code: 'LOCAL_CBS', message: 'Accepted by local CBS mock' });
}

// POST /api/local/exchange-rate
// VAM sends: { fromCurrency, toCurrency, amount }
// VAM reads: { exchangeRate, contract }
export async function exchangeRate(req, res) {
  const { fromCurrency, toCurrency, amount } = req.body;
  if (!fromCurrency || !toCurrency) return res.status(400).json({ message: 'fromCurrency and toCurrency are required' });

  const symbol = `${fromCurrency}/${toCurrency}`;
  const rate = mockFxRate(symbol);

  return res.json({
    exchangeRate: rate,
    contract: `LOCAL-${fromCurrency}-${toCurrency}-${Date.now()}`,
  });
}

// POST /api/local/quote
// VAM sends: { fromCurrency, toCurrency, amount }
// VAM reads: response.data directly (the entire object)
export async function quote(req, res) {
  const { fromCurrency, toCurrency, amount } = req.body;
  if (!fromCurrency || !toCurrency) return res.status(400).json({ message: 'fromCurrency and toCurrency are required' });

  const symbol = `${fromCurrency}/${toCurrency}`;
  const rate = mockFxRate(symbol);
  const convertedAmount = amount ? Number((amount * rate).toFixed(6)) : null;

  return res.json({
    fromCurrency,
    toCurrency,
    amount,
    exchangeRate: rate,
    convertedAmount,
    contract: `LOCAL-QUOTE-${fromCurrency}-${toCurrency}-${Date.now()}`,
    validUntil: new Date(Date.now() + 60_000).toISOString(),
  });
}

// POST /api/local/bank-statement
// v1 VAM sends: { ledgerId, fromDate, toDate, physicalAccountId, countryCode }
//   v1 VAM reads: { success, data }
// v2 VAM sends: { ledgerId, fromDate, toDate, physicalAccountId, page, limit }
//   v2 VAM reads: { statements, hasMore }
export async function bankStatement(req, res) {
  const { physicalAccountId, fromDate, toDate, page, limit } = req.body;
  if (!physicalAccountId) return res.status(400).json({ message: 'physicalAccountId is required' });

  const query = { accountNumber: physicalAccountId };
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  if (page !== undefined && limit !== undefined) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const [statements, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);
    return res.json({ statements, hasMore: skip + statements.length < total });
  }

  const transactions = await Transaction.find(query).sort({ createdAt: -1 });
  return res.json({ success: true, data: transactions });
}
