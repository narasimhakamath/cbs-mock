import User from '../models/User.js';
import Party from '../models/Party.js';
import Account from '../models/Account.js';
import { generateUserId } from '../utils/generateUserId.js';

const DIAL_CODE_RE = /^\+\d{1,4}$/;
const PHONE_RE = /^\d{4,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Returns { error } or { entitlements } (normalized: one entry per party, deduped ids).
async function normalizeEntitlements(input) {
  if (!Array.isArray(input)) return { error: 'entitlements must be an array' };
  const byParty = new Map();
  for (const e of input) {
    if (!e || typeof e.partyId !== 'string') return { error: 'each entitlement needs a partyId' };
    if (!['ALL_ACCOUNTS', 'SELECTED_ACCOUNTS'].includes(e.access)) {
      return { error: 'access must be ALL_ACCOUNTS or SELECTED_ACCOUNTS' };
    }
    if (byParty.has(e.partyId)) return { error: `Duplicate entitlement for party ${e.partyId}` };
    const accountIds = e.access === 'SELECTED_ACCOUNTS' ? [...new Set(e.accountIds || [])] : [];
    if (e.access === 'SELECTED_ACCOUNTS' && accountIds.length === 0) {
      return { error: `Select at least one account for party ${e.partyId}` };
    }
    byParty.set(e.partyId, { partyId: e.partyId, access: e.access, accountIds });
  }

  const partyIds = [...byParty.keys()];
  const parties = await Party.find({ _id: { $in: partyIds } }, { type: 1 });
  const found = new Map(parties.map((p) => [p._id, p]));
  const missing = partyIds.filter((id) => !found.has(id));
  if (missing.length) return { error: `Party not found: ${missing.join(', ')}` };
  const notCorporate = partyIds.filter((id) => found.get(id).type !== 'CORPORATE');
  if (notCorporate.length) {
    return { error: `Users can only be linked to corporate parties: ${notCorporate.join(', ')}` };
  }

  const selectedIds = [...byParty.values()].flatMap((e) => e.accountIds);
  if (selectedIds.length) {
    const accounts = await Account.find({ _id: { $in: selectedIds } }, { partyId: 1 });
    const owner = new Map(accounts.map((a) => [String(a._id), a.partyId]));
    for (const e of byParty.values()) {
      const bad = e.accountIds.filter((id) => owner.get(id) !== e.partyId);
      if (bad.length) {
        return { error: `Accounts not found under party ${e.partyId}: ${bad.join(', ')}` };
      }
    }
  }
  return { entitlements: [...byParty.values()] };
}

export async function listUsers(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const search = (req.query.search || '').trim();
  const partyId = req.params.partyId || req.query.partyId;

  const filter = {};
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (partyId) filter['entitlements.partyId'] = partyId;

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const partyIds = [...new Set(items.flatMap((u) => u.entitlements.map((e) => e.partyId)))];
  const parties = await Party.find({ _id: { $in: partyIds } }, { name: 1 });
  const nameMap = new Map(parties.map((p) => [p._id, p.name]));

  res.json({
    items: items.map((u) => ({
      ...u.toObject(),
      parties: u.entitlements.map((e) => ({
        _id: e.partyId,
        name: nameMap.get(e.partyId) || e.partyId,
        access: e.access,
        accountCount: e.accountIds.length,
      })),
    })),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const partyIds = user.entitlements.map((e) => e.partyId);
  const [parties, accounts] = await Promise.all([
    Party.find({ _id: { $in: partyIds } }, { name: 1, status: 1 }),
    Account.find(
      { _id: { $in: user.entitlements.flatMap((e) => e.accountIds) } },
      { name: 1, partyId: 1, currencyCode: 1 }
    ),
  ]);
  const partyMap = new Map(parties.map((p) => [p._id, p.toObject()]));
  const accountMap = new Map(accounts.map((a) => [String(a._id), a.toObject()]));
  res.json({
    ...user.toObject(),
    entitlements: user.entitlements.map((e) => ({
      ...e.toObject(),
      party: partyMap.get(e.partyId) || { _id: e.partyId },
      accounts: e.accountIds.map((id) => accountMap.get(id) || { _id: id }),
    })),
  });
}

export async function createUser(req, res) {
  const { name, email, phoneDialCode, phone, entitlements = [] } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: 'name is required' });
  if (!email || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ message: 'a valid email is required' });
  }
  if (!DIAL_CODE_RE.test(phoneDialCode || '')) {
    return res.status(400).json({ message: 'phoneDialCode must look like +973' });
  }
  if (!phone || !PHONE_RE.test(phone.trim())) {
    return res.status(400).json({ message: 'phone must be 4-15 digits' });
  }
  const ent = await normalizeEntitlements(entitlements);
  if (ent.error) return res.status(400).json({ message: ent.error });

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'A user with this email already exists' });
  }

  const user = await User.create({
    _id: await generateUserId(),
    name: name.trim(),
    email: normalizedEmail,
    phoneDialCode,
    phone: phone.trim(),
    entitlements: ent.entitlements,
  });
  res.status(201).json(user);
}

export async function updateUser(req, res) {
  const { name, email, phoneDialCode, phone, entitlements, status } = req.body;
  const update = {};

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'name cannot be empty' });
    update.name = name.trim();
  }
  if (email !== undefined) {
    if (!EMAIL_RE.test(email.trim())) return res.status(400).json({ message: 'a valid email is required' });
    update.email = email.trim().toLowerCase();
    const clash = await User.exists({ email: update.email, _id: { $ne: req.params.id } });
    if (clash) return res.status(409).json({ message: 'A user with this email already exists' });
  }
  if (phoneDialCode !== undefined) {
    if (!DIAL_CODE_RE.test(phoneDialCode)) {
      return res.status(400).json({ message: 'phoneDialCode must look like +973' });
    }
    update.phoneDialCode = phoneDialCode;
  }
  if (phone !== undefined) {
    if (!PHONE_RE.test(phone.trim())) return res.status(400).json({ message: 'phone must be 4-15 digits' });
    update.phone = phone.trim();
  }
  if (status !== undefined) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'status must be ACTIVE or INACTIVE' });
    }
    update.status = status;
  }
  if (entitlements !== undefined) {
    const ent = await normalizeEntitlements(entitlements);
    if (ent.error) return res.status(400).json({ message: ent.error });
    update.entitlements = ent.entitlements;
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(204).send();
}

// Effective accounts the user can see: every account of ALL_ACCOUNTS parties (including
// ones created later) plus the explicitly selected accounts of other parties.
export async function listUserAccounts(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

  const allParties = user.entitlements.filter((e) => e.access === 'ALL_ACCOUNTS').map((e) => e.partyId);
  const selected = user.entitlements.flatMap((e) => e.accountIds);
  const filter = { $or: [{ partyId: { $in: allParties } }, { _id: { $in: selected } }] };

  const [items, total] = await Promise.all([
    Account.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Account.countDocuments(filter),
  ]);
  res.json({ items, page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
}
