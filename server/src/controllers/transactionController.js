import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { COUNTRY_CODES, CURRENCY_CODES } from '../config/lookups.js';

export async function listAllTransactions(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const search = (req.query.search || '').trim();

  const filter = search
    ? {
        $or: [
          { _id: { $regex: search, $options: 'i' } },
          { utrId: { $regex: search, $options: 'i' } },
          { accountNumber: { $regex: search, $options: 'i' } },
          { counterpartyAccountNumber: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
}

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

export async function acknowledgeTransaction(req, res) {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

  const { status, errorCode } = req.body;
  if (!['ACSC', 'RJCT'].includes(status)) {
    return res.status(400).json({ message: 'status must be ACSC or RJCT' });
  }
  if (transaction.status !== 'ACTC') {
    return res
      .status(400)
      .json({ message: `Transaction is already ${transaction.status}; only ACTC transactions can be acknowledged` });
  }
  if (status === 'RJCT' && (!errorCode || !String(errorCode).trim())) {
    return res.status(400).json({ message: 'errorCode is required to reject a transaction' });
  }

  if (status === 'RJCT') {
    const account = await Account.findById(transaction.accountNumber);
    if (account) {
      // Undo the original leg: give back what was debited, or claw back what was credited.
      account.balance += transaction.direction === 'OUTWARD_DEBIT' ? transaction.amount : -transaction.amount;
      await account.save();
    }

    await Transaction.create({
      accountNumber: transaction.accountNumber,
      direction: transaction.direction === 'OUTWARD_DEBIT' ? 'INWARD_CREDIT' : 'OUTWARD_DEBIT',
      amount: transaction.amount,
      currencyCode: transaction.currencyCode,
      counterpartyAccountNumber: transaction.counterpartyAccountNumber,
      counterpartyCountryCode: transaction.counterpartyCountryCode,
      status: 'ACSC',
      reversalOfTransactionId: transaction._id,
      utrId: transaction.utrId,
    });

    transaction.errorCode = String(errorCode).trim();
  }

  transaction.status = status;
  await transaction.save();

  res.json(transaction);
}

export async function createOutwardDebit(req, res) {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ message: 'Account not found' });

  const { beneficiaryAccountNumber, beneficiaryCountryCode, beneficiaryCurrencyCode, amount } = req.body;

  if (!beneficiaryAccountNumber || !String(beneficiaryAccountNumber).trim()) {
    return res.status(400).json({ message: 'beneficiaryAccountNumber is required' });
  }
  const trimmedBeneficiary = String(beneficiaryAccountNumber).trim();
  if (trimmedBeneficiary === account._id) {
    return res.status(400).json({ message: 'beneficiaryAccountNumber cannot be the same as the source account' });
  }

  const value = parseAmount(amount);
  if (value === null) return res.status(400).json({ message: 'amount must be a positive number' });
  if (value > account.balance) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  // Beneficiary may or may not exist in this CBS instance.
  const beneficiaryAccount = await Account.findById(trimmedBeneficiary);

  let counterpartyCountryCode;
  let counterpartyCurrencyCode;

  if (beneficiaryAccount) {
    if (beneficiaryAccount.status !== 'ACTIVE') {
      return res.status(400).json({ message: `Beneficiary account ${trimmedBeneficiary} is not active` });
    }
    counterpartyCountryCode = beneficiaryAccount.countryCode;
    counterpartyCurrencyCode = beneficiaryAccount.currencyCode;
  } else {
    if (!beneficiaryCountryCode || !COUNTRY_CODES.includes(beneficiaryCountryCode.toUpperCase())) {
      return res.status(400).json({ message: 'beneficiaryCountryCode must be a valid ISO country code' });
    }
    if (!beneficiaryCurrencyCode || !CURRENCY_CODES.includes(beneficiaryCurrencyCode.toUpperCase())) {
      return res.status(400).json({ message: 'beneficiaryCurrencyCode must be a valid ISO currency code' });
    }
    counterpartyCountryCode = beneficiaryCountryCode.toUpperCase();
    counterpartyCurrencyCode = beneficiaryCurrencyCode.toUpperCase();
  }

  account.balance -= value;
  await account.save();

  // Transfer between two accounts held in this CBS settles (ACSC); a transfer
  // out to an account this CBS doesn't hold is only accepted for onward clearing (ACTC).
  const status = beneficiaryAccount ? 'ACSC' : 'ACTC';

  const transaction = await Transaction.create({
    accountNumber: account._id,
    direction: 'OUTWARD_DEBIT',
    amount: value,
    currencyCode: counterpartyCurrencyCode,
    counterpartyAccountNumber: trimmedBeneficiary,
    counterpartyCountryCode,
    status,
  });

  if (beneficiaryAccount) {
    beneficiaryAccount.balance += value;
    await beneficiaryAccount.save();

    await Transaction.create({
      accountNumber: beneficiaryAccount._id,
      direction: 'INWARD_CREDIT',
      amount: value,
      currencyCode: counterpartyCurrencyCode,
      counterpartyAccountNumber: account._id,
      status: 'ACSC',
    });
  }

  res.status(201).json(transaction);
}
