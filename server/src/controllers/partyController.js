import Party from '../models/Party.js';
import Account from '../models/Account.js';
import { generatePartyId } from '../utils/generatePartyId.js';

export async function listParties(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const search = (req.query.search || '').trim();
  const { type } = req.query;

  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (type) filter.type = type;

  const [items, total] = await Promise.all([
    Party.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Party.countDocuments(filter),
  ]);

  const counts = await Account.aggregate([
    { $match: { partyId: { $in: items.map((p) => p._id) } } },
    { $group: { _id: '$partyId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  res.json({
    items: items.map((p) => ({ ...p.toObject(), accountCount: countMap.get(String(p._id)) || 0 })),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
}

export async function getParty(req, res) {
  const party = await Party.findById(req.params.id);
  if (!party) return res.status(404).json({ message: 'Party not found' });
  res.json(party);
}

export async function createParty(req, res) {
  const { name, address, type } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }
  if (!['CORPORATE', 'RETAIL'].includes(type)) {
    return res.status(400).json({ message: 'type must be CORPORATE or RETAIL' });
  }

  const partyId = await generatePartyId();
  const party = await Party.create({
    _id: partyId,
    name: name.trim(),
    address: (address || '').trim(),
    type,
  });
  res.status(201).json(party);
}

export async function updateParty(req, res) {
  const { name, address, type, status } = req.body;
  const update = {};

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'name cannot be empty' });
    update.name = name.trim();
  }
  if (address !== undefined) {
    update.address = address.trim();
  }
  if (type !== undefined) {
    if (!['CORPORATE', 'RETAIL'].includes(type)) {
      return res.status(400).json({ message: 'type must be CORPORATE or RETAIL' });
    }
    update.type = type;
  }
  if (status !== undefined) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'status must be ACTIVE or INACTIVE' });
    }
    update.status = status;
  }

  const party = await Party.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!party) return res.status(404).json({ message: 'Party not found' });
  res.json(party);
}

export async function deleteParty(req, res) {
  const accountCount = await Account.countDocuments({ partyId: req.params.id });
  if (accountCount > 0) {
    return res.status(409).json({ message: 'Cannot delete a party that has accounts' });
  }
  const party = await Party.findByIdAndDelete(req.params.id);
  if (!party) return res.status(404).json({ message: 'Party not found' });
  res.status(204).send();
}
