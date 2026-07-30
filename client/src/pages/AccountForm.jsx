import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAccount, createAccount, updateAccount, fetchConfig, fetchParties } from '../api/client';
import FormPage from '../components/FormPage';
import SearchableSelect from '../components/SearchableSelect';
import { inputClass, labelClass } from '../components/formStyles';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

function generateAccountNumber() {
  let digits = '';
  for (let i = 0; i < 16; i++) digits += Math.floor(Math.random() * 10);
  return digits;
}

export default function AccountForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const lockedPartyId = searchParams.get('partyId');
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    partyId: lockedPartyId || '',
    name: '',
    accountNumber: '',
    countryCode: '',
    currencyCode: '',
    status: 'ACTIVE',
  });
  const [lockedParty, setLockedParty] = useState(null);
  const [config, setConfig] = useState({ countries: [], currencies: [] });
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig().then(setConfig);

    if (isEdit) {
      fetchAccount(id).then((account) => {
        setForm({
          partyId: account.partyId?._id || '',
          name: account.name,
          accountNumber: account.accountNumber,
          countryCode: account.countryCode,
          currencyCode: account.currencyCode,
          status: account.status,
        });
        setLockedParty(account.partyId);
        setLoading(false);
      });
    } else if (!lockedPartyId) {
      fetchParties({ limit: 100 }).then((res) => setParties(res.items));
    }
  }, [id, isEdit, lockedPartyId]);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateAccount(id, {
          name: form.name,
          countryCode: form.countryCode,
          currencyCode: form.currencyCode,
          status: form.status,
        });
        navigate(`/accounts/${id}`);
      } else {
        const account = await createAccount({
          partyId: form.partyId,
          name: form.name,
          accountNumber: form.accountNumber,
          countryCode: form.countryCode,
          currencyCode: form.currencyCode,
        });
        navigate(`/accounts/${account.accountNumber}`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  };

  const backTo = isEdit
    ? `/accounts/${id}`
    : lockedPartyId
    ? `/parties/${lockedPartyId}`
    : '/accounts';

  if (loading) return <div className="p-8 text-neutral-400">Loading…</div>;

  const partyOptions = (isEdit || lockedPartyId ? [lockedParty].filter(Boolean) : parties).map(
    (p) => ({ value: p._id, label: p.name })
  );
  const countryOptions = config.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));
  const currencyOptions = config.currencies.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));

  return (
    <FormPage
      title={isEdit ? 'Edit account' : 'Create account'}
      backTo={backTo}
      backLabel={isEdit ? 'Account' : lockedPartyId ? 'Party' : 'Accounts'}
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      submitDisabled={
        !isEdit &&
        (!form.partyId || form.accountNumber.length !== 16 || !form.countryCode || !form.currencyCode)
      }
      submitLabel={isEdit ? 'Save changes' : 'Create account'}
    >
      <SearchableSelect
        label="Party"
        value={form.partyId}
        onChange={set('partyId')}
        options={partyOptions}
        placeholder="Select party"
        disabled={isEdit || Boolean(lockedPartyId)}
      />

      <div>
        <label className={labelClass}>Account name</label>
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          placeholder="e.g. Emaar Beachfront Project Escrow"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Account number</label>
        <div className="flex gap-2">
          <input
            className={`${inputClass} font-mono ${isEdit ? 'bg-neutral-50 text-neutral-400' : ''}`}
            value={form.accountNumber}
            onChange={(e) => set('accountNumber')(e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="16-digit account number"
            inputMode="numeric"
            maxLength={16}
            disabled={isEdit}
            required
          />
          {!isEdit && (
            <button
              type="button"
              onClick={() => set('accountNumber')(generateAccountNumber())}
              title="Generate a random account number"
              className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              🎲
            </button>
          )}
        </div>
        {!isEdit && (
          <p className="mt-1 text-xs text-neutral-400">{form.accountNumber.length}/16 digits</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SearchableSelect
          label="Country"
          value={form.countryCode}
          onChange={set('countryCode')}
          options={countryOptions}
          placeholder="Select country"
        />
        <SearchableSelect
          label="Currency"
          value={form.currencyCode}
          onChange={set('currencyCode')}
          options={currencyOptions}
          placeholder="Select currency"
        />
      </div>

      {isEdit && (
        <SearchableSelect
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={STATUS_OPTIONS}
        />
      )}
    </FormPage>
  );
}
