import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, deleteUser } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';

export default function UsersList() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchUsers({ page, limit, search }));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await deleteUser(pendingDelete._id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete user');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">Users</h1>
        <button
          onClick={() => navigate('/users/new')}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Create user
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name or email"
          className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-6 py-3 font-medium">User ID</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Parties</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-400">
                  No users found
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((user) => (
                <tr
                  key={user._id}
                  onClick={() => navigate(`/users/${user._id}`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-6 py-3 font-mono text-neutral-600">{user._id}</td>
                  <td className="px-6 py-3 font-medium text-neutral-700">{user.name}</td>
                  <td className="px-6 py-3 text-neutral-600">{user.email}</td>
                  <td className="px-6 py-3 text-neutral-600">
                    {user.parties.length === 0 ? '—' : user.parties.map((p) => p.name).join(', ')}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteError('');
                        setPendingDelete(user);
                      }}
                      className="rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete user"
          message={
            deleteError ||
            `Are you sure you want to delete ${pendingDelete.name}? This cannot be undone.`
          }
          confirmLabel="Delete"
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
