import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBanks, updateBank, deleteBank } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';

export default function BanksList() {
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
      const result = await fetchBanks({ page, limit, search });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async (bank, e) => {
    e.stopPropagation();
    await updateBank(bank._id, { status: bank.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    load();
  };

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await deleteBank(pendingDelete._id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete bank');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">Banks</h1>
        <button
          onClick={() => navigate('/banks/new')}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Create bank
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by name or institution ID"
          className="w-80 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Institution ID</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-neutral-400">
                  No banks found
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((bank) => (
                <tr
                  key={bank._id}
                  onClick={() => navigate(`/banks/${bank._id}/edit`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-6 py-3 font-medium text-neutral-700">{bank.name}</td>
                  <td className="px-6 py-3 font-mono text-neutral-600">{bank.institutionId}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={bank.status} />
                  </td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button
                      onClick={(e) => handleToggleStatus(bank, e)}
                      className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
                    >
                      {bank.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteError('');
                        setPendingDelete(bank);
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
          title="Delete bank"
          message={
            deleteError || `Are you sure you want to delete ${pendingDelete.name}? This cannot be undone.`
          }
          confirmLabel="Delete"
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
