import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAccounts, deleteAccount, fetchParties } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchableSelect from '../components/SearchableSelect';
import { formatAmount } from '../utils/currency';

export default function AccountsList() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [partyId, setPartyId] = useState('');
  const [balanceSort, setBalanceSort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [parties, setParties] = useState([]);

  useEffect(() => {
    fetchParties({ limit: 100 }).then((res) => setParties(res.items));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAccounts({
        page,
        limit,
        search,
        partyId: partyId || undefined,
        sortBy: balanceSort ? 'balance' : undefined,
        sortOrder: balanceSort || undefined,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, partyId, balanceSort]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    await deleteAccount(pendingDelete._id);
    setPendingDelete(null);
    load();
  };

  const toggleBalanceSort = () => {
    setBalanceSort((prev) => (prev === null ? 'desc' : prev === 'desc' ? 'asc' : null));
  };

  const partyOptions = [{ value: '', label: 'All parties' }, ...parties.map((p) => ({ value: p._id, label: p.name }))];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">Accounts</h1>
        <button
          onClick={() => navigate('/accounts/new')}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Create account
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
        <div className="w-52">
          <SearchableSelect
            value={partyId}
            onChange={(v) => {
              setPage(1);
              setPartyId(v);
            }}
            options={partyOptions}
            placeholder="All parties"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-6 py-3 font-medium">Account number</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Party</th>
              <th className="px-6 py-3 font-medium">
                <button
                  onClick={toggleBalanceSort}
                  className="flex items-center gap-1 font-medium uppercase tracking-wide text-neutral-400 hover:text-neutral-600"
                >
                  Balance
                  <span className="text-neutral-300">
                    {balanceSort === 'asc' ? '▲' : balanceSort === 'desc' ? '▼' : '↕'}
                  </span>
                </button>
              </th>
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
                  No accounts found
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((acc) => (
                <tr
                  key={acc._id}
                  onClick={() => navigate(`/accounts/${acc._id}`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-6 py-3 font-mono text-neutral-600">{acc.accountNumber}</td>
                  <td className="px-6 py-3 font-medium text-neutral-700">{acc.name}</td>
                  <td className="px-6 py-3 text-neutral-600">{acc.partyId?.name}</td>
                  <td className="px-6 py-3 text-neutral-600">
                    {formatAmount(acc.balance, acc.currencyCode)}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={acc.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(acc);
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
          title="Delete account"
          message={`Are you sure you want to delete account ${pendingDelete.accountNumber}? This cannot be undone.`}
          confirmLabel="Delete"
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
