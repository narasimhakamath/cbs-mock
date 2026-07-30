import Account from '../models/Account.js';
import Party from '../models/Party.js';
import { COUNTRY_CODES, CURRENCY_CODES } from '../config/lookups.js';

const partyPopulate = {
  path: 'partyId',
  select: 'name',
};

export async function listAccounts(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const search = (req.query.search || '').trim();
  const { partyId } = req.query;

  const filter = {};
  if (partyId) filter.partyId = partyId;
  if (search) {
    filter.$or = [
      { _id: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
  }

  const sortableFields = { balance: 'balance', createdAt: 'createdAt' };
  const sortBy = sortableFields[req.query.sortBy] || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Account.find(filter)
      .populate(partyPopulate)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
    Account.countDocuments(filter),
  ]);

  res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
}

export async function getAccount(req, res) {
  const account = await Account.findById(req.params.id).populate(partyPopulate);
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json(account);
}

function validateAccountFields({ countryCode, currencyCode }) {
  if (!countryCode || !COUNTRY_CODES.includes(countryCode.toUpperCase())) {
    return 'countryCode must be a valid ISO country code';
  }
  if (!currencyCode || !CURRENCY_CODES.includes(currencyCode.toUpperCase())) {
    return 'currencyCode must be a valid ISO currency code';
  }
  return null;
}

export async function createAccount(req, res) {
  const { partyId, name, accountNumber, countryCode, currencyCode } = req.body;

  if (!partyId) return res.status(400).json({ message: 'partyId is required' });
  const party = await Party.findById(partyId);
  if (!party) return res.status(400).json({ message: 'partyId does not reference an existing party' });

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  if (!accountNumber || !/^\d{16}$/.test(accountNumber)) {
    return res.status(400).json({ message: 'accountNumber must be exactly 16 digits' });
  }
  const existing = await Account.findById(accountNumber);
  if (existing) {
    return res.status(409).json({ message: 'An account with this account number already exists' });
  }

  const validationError = validateAccountFields({ countryCode, currencyCode });
  if (validationError) return res.status(400).json({ message: validationError });

  const account = await Account.create({
    _id: accountNumber,
    partyId,
    name: name.trim(),
    countryCode: countryCode.toUpperCase(),
    currencyCode: currencyCode.toUpperCase(),
    balance: 0,
  });

  res.status(201).json(await account.populate(partyPopulate));
}

export async function updateAccount(req, res) {
  const { name, countryCode, currencyCode, status } = req.body;
  const update = {};

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'name cannot be empty' });
    update.name = name.trim();
  }
  if (countryCode !== undefined) {
    if (!COUNTRY_CODES.includes(countryCode.toUpperCase())) {
      return res.status(400).json({ message: 'countryCode must be a valid ISO country code' });
    }
    update.countryCode = countryCode.toUpperCase();
  }
  if (currencyCode !== undefined) {
    if (!CURRENCY_CODES.includes(currencyCode.toUpperCase())) {
      return res.status(400).json({ message: 'currencyCode must be a valid ISO currency code' });
    }
    update.currencyCode = currencyCode.toUpperCase();
  }
  if (status !== undefined) {
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ message: 'status must be ACTIVE, INACTIVE, or SUSPENDED' });
    }
    update.status = status;
  }

  const account = await Account.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).populate(partyPopulate);
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json(account);
}

export async function deleteAccount(req, res) {
  const account = await Account.findByIdAndDelete(req.params.id);
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.status(204).send();
}
