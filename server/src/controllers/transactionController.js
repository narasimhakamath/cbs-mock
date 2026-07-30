import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { COUNTRY_CODES, CURRENCY_CODES } from '../config/lookups.js';

export async function listTransactions(req, res) {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ message: 'Account not found' });

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

  const [items, total] = await Promise.all([
    Transaction.find({ accountNumber: account._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments({ accountNumber: account._id }),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
}

function parseAmount(amount) {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function createInwardCredit(req, res) {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ message: 'Account not found' });

  const { sourceAccountNumber, amount, currencyCode } = req.body;

  if (!sourceAccountNumber || !String(sourceAccountNumber).trim()) {
    return res.status(400).json({ message: 'sourceAccountNumber is required' });
  }
  const value = parseAmount(amount);
  if (value === null) return res.status(400).json({ message: 'amount must be a positive number' });
  if (!currencyCode || !CURRENCY_CODES.includes(currencyCode.toUpperCase())) {
    return res.status(400).json({ message: 'currencyCode must be a valid ISO currency code' });
  }

  account.balance += value;
  await account.save();

  const transaction = await Transaction.create({
    accountNumber: account._id,
    direction: 'INWARD_CREDIT',
    amount: value,
    currencyCode: currencyCode.toUpperCase(),
    counterpartyAccountNumber: String(sourceAccountNumber).trim(),
  });

  res.status(201).json(transaction);
}

export async function createOutwardDebit(req, res) {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ message: 'Account not found' });

  const { beneficiaryAccountNumber, beneficiaryCountryCode, beneficiaryCurrencyCode, amount } = req.body;

  if (!beneficiaryAccountNumber || !String(beneficiaryAccountNumber).trim()) {
    return res.status(400).json({ message: 'beneficiaryAccountNumber is required' });
  }
  if (!beneficiaryCountryCode || !COUNTRY_CODES.includes(beneficiaryCountryCode.toUpperCase())) {
    return res.status(400).json({ message: 'beneficiaryCountryCode must be a valid ISO country code' });
  }
  if (!beneficiaryCurrencyCode || !CURRENCY_CODES.includes(beneficiaryCurrencyCode.toUpperCase())) {
    return res.status(400).json({ message: 'beneficiaryCurrencyCode must be a valid ISO currency code' });
  }
  const value = parseAmount(amount);
  if (value === null) return res.status(400).json({ message: 'amount must be a positive number' });
  if (value > account.balance) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  account.balance -= value;
  await account.save();

  const transaction = await Transaction.create({
    accountNumber: account._id,
    direction: 'OUTWARD_DEBIT',
    amount: value,
    currencyCode: beneficiaryCurrencyCode.toUpperCase(),
    counterpartyAccountNumber: String(beneficiaryAccountNumber).trim(),
    counterpartyCountryCode: beneficiaryCountryCode.toUpperCase(),
  });

  res.status(201).json(transaction);
}
