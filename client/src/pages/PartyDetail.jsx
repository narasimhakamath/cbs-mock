import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchParty, updateParty, deleteParty, fetchPartyAccounts } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatAmount } from '../utils/currency';

const TABS = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'details', label: 'Details' },
];

export default function PartyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [accounts, setAccounts] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('accounts');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [partyData, accountsData] = await Promise.all([
        fetchParty(id),
        fetchPartyAccounts(id, { limit: 50 }),
      ]);
      setParty(partyData);
      setAccounts(accountsData);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await deleteParty(id);
      navigate('/parties');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete party');
    }
  };

  const handleToggleStatus = async () => {
    await updateParty(id, { status: party.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    load();
  };


  if (loading) return <div className="p-8 text-neutral-400">Loading…</div>;
  if (!party) return <div className="p-8 text-neutral-400">Party not found</div>;

  return (
    <div className="p-8">
      <Link to="/parties" className="text-sm text-neutral-500 hover:text-neutral-700">
        ← Parties
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-neutral-800">{party.name}</h1>
          <StatusBadge status={party.status} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {party.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => navigate(`/parties/${id}/edit`)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setDeleteError('');
              setShowDelete(true);
            }}
            className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-6 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-black text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t.label}
            {t.key === 'accounts' && ` (${accounts.total})`}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">Party ID</div>
            <div className="mt-1 font-mono text-base text-neutral-800">{party._id}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">Type</div>
            <div className="mt-1 text-base text-neutral-800">
              {party.type === 'CORPORATE' ? 'Corporate' : 'Retail'}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">Address</div>
            <div className="mt-1 text-base text-neutral-800">{party.address || '—'}</div>
          </div>
        </div>
      )}

      {tab === 'accounts' && (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
            <span className="text-sm font-medium text-neutral-700">Accounts ({accounts.total})</span>
            <button
              onClick={() => navigate(`/accounts/new?partyId=${id}`)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
            >
              + Create account
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-6 py-3 font-medium">Account number</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Balance</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-400">
                    No accounts yet
                  </td>
                </tr>
              )}
              {accounts.items.map((acc) => (
                <tr
                  key={acc._id}
                  onClick={() => navigate(`/accounts/${acc._id}`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-6 py-3 font-mono text-neutral-600">{acc.accountNumber}</td>
                  <td className="px-6 py-3 font-medium text-neutral-700">{acc.name}</td>
                  <td className="px-6 py-3 text-neutral-600">
                    {formatAmount(acc.balance, acc.currencyCode)}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={acc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete party"
          message={deleteError || `Are you sure you want to delete ${party.name}? This cannot be undone.`}
          confirmLabel="Delete"
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
