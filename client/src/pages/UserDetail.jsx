import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUser, fetchUserAccounts, updateUser, deleteUser } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, a] = await Promise.all([fetchUser(id), fetchUserAccounts(id)]);
      setUser(u);
      setAccounts(a);
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
      await deleteUser(id);
      navigate('/users');
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete user');
    }
  };

  const handleToggleStatus = async () => {
    await updateUser(id, { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    load();
  };

  if (loading) return <div className="p-8 text-neutral-400">Loading…</div>;
  if (!user) return <div className="p-8 text-neutral-400">User not found</div>;

  return (
    <div className="p-8">
      <Link to="/users" className="text-sm text-neutral-500 hover:text-neutral-700">
        ← Users
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-neutral-800">{user.name}</h1>
          <StatusBadge status={user.status} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => navigate(`/users/${id}/edit`)}
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">User ID</div>
          <div className="mt-1 font-mono text-base text-neutral-800">{user._id}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">Email</div>
          <div className="mt-1 text-base text-neutral-800">{user.email}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">Phone</div>
          <div className="mt-1 text-base text-neutral-800">{user.phone ? `${user.phoneDialCode || ''} ${user.phone}` : '—'}</div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700">
          Entitlements ({user.entitlements.length})
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-6 py-3 font-medium">Party</th>
              <th className="px-6 py-3 font-medium">Access</th>
              <th className="px-6 py-3 font-medium">Accounts</th>
            </tr>
          </thead>
          <tbody>
            {user.entitlements.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-neutral-400">
                  No access granted
                </td>
              </tr>
            )}
            {user.entitlements.map((e) => (
              <tr
                key={e.partyId}
                onClick={() => navigate(`/parties/${e.partyId}`)}
                className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-6 py-3 font-medium text-neutral-700">
                  {e.party.name || e.partyId} <span className="font-mono text-neutral-400">{e.partyId}</span>
                </td>
                <td className="px-6 py-3 text-neutral-600">
                  {e.access === 'ALL_ACCOUNTS' ? 'All accounts' : 'Selected accounts'}
                </td>
                <td className="px-6 py-3 font-mono text-neutral-600">
                  {e.access === 'ALL_ACCOUNTS' ? '—' : e.accounts.map((a) => a._id).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700">
          Accessible accounts ({accounts.total})
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-6 py-3 font-medium">Account number</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Party</th>
            </tr>
          </thead>
          <tbody>
            {accounts.items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-neutral-400">
                  No accessible accounts
                </td>
              </tr>
            )}
            {accounts.items.map((a) => (
              <tr
                key={a._id}
                onClick={() => navigate(`/accounts/${a._id}`)}
                className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-6 py-3 font-mono text-neutral-600">{a._id}</td>
                <td className="px-6 py-3 font-medium text-neutral-700">{a.name}</td>
                <td className="px-6 py-3 font-mono text-neutral-600">{a.partyId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete user"
          message={deleteError || `Are you sure you want to delete ${user.name}? This cannot be undone.`}
          confirmLabel="Delete"
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
