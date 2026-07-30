import Bank from '../models/Bank.js';
import Party from '../models/Party.js';

export async function listBanks(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const search = (req.query.search || '').trim();

  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { institutionId: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    Bank.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Bank.countDocuments(filter),
  ]);

  res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
}

export async function getBank(req, res) {
  const bank = await Bank.findById(req.params.id);
  if (!bank) return res.status(404).json({ message: 'Bank not found' });
  res.json(bank);
}

export async function createBank(req, res) {
  const { name, institutionId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }
  if (!institutionId || !institutionId.trim()) {
    return res.status(400).json({ message: 'institutionId is required' });
  }
  const bank = await Bank.create({ name: name.trim(), institutionId: institutionId.trim() });
  res.status(201).json(bank);
}

export async function updateBank(req, res) {
  const { name, institutionId, status } = req.body;
  const update = {};

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ message: 'name cannot be empty' });
    update.name = name.trim();
  }
  if (institutionId !== undefined) {
    if (!institutionId.trim()) return res.status(400).json({ message: 'institutionId cannot be empty' });
    update.institutionId = institutionId.trim();
  }
  if (status !== undefined) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'status must be ACTIVE or INACTIVE' });
    }
    update.status = status;
  }

  const bank = await Bank.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!bank) return res.status(404).json({ message: 'Bank not found' });
  res.json(bank);
}

export async function deleteBank(req, res) {
  const partyCount = await Party.countDocuments({ bankId: req.params.id });
  if (partyCount > 0) {
    return res.status(409).json({ message: 'Cannot delete a bank that has parties assigned to it' });
  }
  const bank = await Bank.findByIdAndDelete(req.params.id);
  if (!bank) return res.status(404).json({ message: 'Bank not found' });
  res.status(204).send();
}
