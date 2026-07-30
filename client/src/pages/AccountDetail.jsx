import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAccount, deleteAccount, fetchConfig, fetchTransactions } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import TransactionModal from '../components/TransactionModal';
import { formatAmount } from '../utils/currency';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [config, setConfig] = useState({ countries: [], currencies: [] });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cfg, txns] = await Promise.all([fetchAccount(id), fetchConfig(), fetchTransactions(id)]);
      setAccount(data);
      setConfig(cfg);
      setTransactions(txns.items);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    await deleteAccount(id);
    navigate('/accounts');
  };

  if (loading) {
    return <div className="p-8 text-neutral-400">Loading…</div>;
  }

  if (!account) {
    return <div className="p-8 text-neutral-400">Account not found</div>;
  }

  const countryName = config.countries.find((c) => c.code === account.countryCode)?.name;
  const currencyName = config.currencies.find((c) => c.code === account.currencyCode)?.name;

  return (
    <div className="p-8">
      <Link to="/accounts" className="text-sm text-neutral-500 hover:text-neutral-700">
        ← Accounts
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-neutral-800">{account.name}</h1>
          <StatusBadge status={account.status} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransaction(true)}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            New transaction
          </button>
          <button
            onClick={() => navigate(`/accounts/${id}/edit`)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-1 text-sm text-neutral-500">
        <Link to={`/parties/${account.partyId?._id}`} className="text-neutral-700 hover:underline">
          {account.partyId?.name}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Account number" value={account.accountNumber} mono />
        <InfoCard label="Balance" value={formatAmount(account.balance, account.currencyCode)} />
        <InfoCard
          label="Country"
          value={countryName ? `${countryName} (${account.countryCode})` : account.countryCode}
        />
        <InfoCard
          label="Currency"
          value={currencyName ? `${currencyName} (${account.currencyCode})` : account.currencyCode}
        />
      </div>

      <div className="mt-8 rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700">
          Transaction history
        </div>
        {transactions.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-neutral-400">No transactions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-6 py-2 font-medium">Transaction ID</th>
                <th className="px-6 py-2 font-medium">Type</th>
                <th className="px-6 py-2 font-medium">Counterparty</th>
                <th className="px-6 py-2 font-medium text-right">Amount</th>
                <th className="px-6 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.transactionId} className="border-b border-neutral-50 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs text-neutral-500">{txn.transactionId}</td>
                  <td className="px-6 py-3">
                    <span
                      className={
                        txn.direction === 'INWARD_CREDIT' ? 'text-emerald-600' : 'text-red-600'
                      }
                    >
                      {txn.direction === 'INWARD_CREDIT' ? 'Inward credit' : 'Outward debit'}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-neutral-600">
                    {txn.counterpartyAccountNumber}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {txn.direction === 'INWARD_CREDIT' ? '+' : '−'}
                    {formatAmount(txn.amount, txn.currencyCode)}
                  </td>
                  <td className="px-6 py-3 text-neutral-500">
                    {new Date(txn.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete account"
          message={`Are you sure you want to delete account ${account.accountNumber}? This cannot be undone.`}
          confirmLabel="Delete"
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      {showTransaction && (
        <TransactionModal
          accountId={id}
          account={account}
          config={config}
          onClose={() => setShowTransaction(false)}
          onSuccess={() => {
            setShowTransaction(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function InfoCard({ label, value, mono }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={`mt-1 text-base text-neutral-800 ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </div>
    </div>
  );
}
