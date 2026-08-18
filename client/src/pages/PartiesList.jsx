import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchParties, deleteParty } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';

const TYPE_FILTERS = [
  { value: '', label: 'All types' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'RETAIL', label: 'Retail' },
];

export default function PartiesList() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchParties({ page, limit, search, type });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, type]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await deleteParty(pendingDelete._id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete party');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">Parties</h1>
        <button
          onClick={() => navigate('/parties/new')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          + Create party
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search"
          className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <select
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          {TYPE_FILTERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-6 py-3 font-medium">Party ID</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Accounts</th>
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
                  No parties found
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((party) => (
                <tr
                  key={party._id}
                  onClick={() => navigate(`/parties/${party._id}`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-6 py-3 font-mono text-neutral-600">{party._id}</td>
                  <td className="px-6 py-3 font-medium text-neutral-700">{party.name}</td>
                  <td className="px-6 py-3 text-neutral-600">
                    {party.type === 'CORPORATE' ? 'Corporate' : 'Retail'}
                  </td>
                  <td className="px-6 py-3 text-neutral-600">{party.accountCount}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={party.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteError('');
                        setPendingDelete(party);
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
          title="Delete party"
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
