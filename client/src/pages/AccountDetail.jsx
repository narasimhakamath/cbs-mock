import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAccount, deleteAccount, fetchConfig } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatAmount } from '../utils/currency';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [config, setConfig] = useState({ countries: [], currencies: [] });
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cfg] = await Promise.all([fetchAccount(id), fetchConfig()]);
      setAccount(data);
      setConfig(cfg);
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
  const bankName = account.partyId?.bankId?.name;

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
        {bankName && `${bankName} · `}
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
        <div className="px-6 py-10 text-center text-sm text-neutral-400">
          No transactions yet. Coming soon.
        </div>
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
