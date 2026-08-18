import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllTransactions, fetchAccounts } from '../api/client';
import Pagination from '../components/Pagination';
import InwardCreditModal from '../components/InwardCreditModal';
import OutwardDebitModal from '../components/OutwardDebitModal';
import { formatAmount } from '../utils/currency';

export default function TransactionsList() {
  const [data, setData] = useState({ items: [], page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInwardCredit, setShowInwardCredit] = useState(false);
  const [showOutwardDebit, setShowOutwardDebit] = useState(false);
  const [knownAccounts, setKnownAccounts] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllTransactions({ page, limit, search });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchAccounts({ limit: 100 }).then((result) => {
      setKnownAccounts(new Set(result.items.map((a) => a.accountNumber)));
    });
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOutwardDebit(true)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            + Outbound Transaction
          </button>
          <button
            onClick={() => setShowInwardCredit(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            + Inbound Transaction
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by transaction or account ID"
          className="w-72 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
              <th className="px-6 py-3 font-medium">Transaction ID</th>
              <th className="px-6 py-3 font-medium">Source account</th>
              <th className="px-6 py-3 font-medium">Beneficiary account</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                  No transactions found
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((txn) => {
                const isCredit = txn.direction === 'INWARD_CREDIT';
                const sourceAccount = isCredit ? txn.counterpartyAccountNumber : txn.accountNumber;
                const beneficiaryAccount = isCredit ? txn.accountNumber : txn.counterpartyAccountNumber;
                return (
                  <tr
                    key={txn.transactionId}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-neutral-500">{txn.transactionId}</td>
                    <td className="px-6 py-3 font-mono text-neutral-600">
                      {renderAccountCell(sourceAccount, knownAccounts)}
                    </td>
                    <td className="px-6 py-3 font-mono text-neutral-600">
                      {renderAccountCell(beneficiaryAccount, knownAccounts)}
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-medium ${
                        isCredit ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {isCredit ? '+' : '−'}
                      {formatAmount(txn.amount, txn.currencyCode)}
                    </td>
                    <td className="px-6 py-3 text-neutral-500">
                      {new Date(txn.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
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

      {showInwardCredit && (
        <InwardCreditModal
          onClose={() => setShowInwardCredit(false)}
          onSuccess={() => {
            setShowInwardCredit(false);
            load();
          }}
        />
      )}

      {showOutwardDebit && (
        <OutwardDebitModal
          onClose={() => setShowOutwardDebit(false)}
          onSuccess={() => {
            setShowOutwardDebit(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function renderAccountCell(accountNumber, knownAccounts) {
  if (knownAccounts.has(accountNumber)) {
    return (
      <Link to={`/accounts/${accountNumber}`} className="text-neutral-800 hover:underline">
        {accountNumber}
      </Link>
    );
  }
  return accountNumber;
}
