import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchUser, createUser, updateUser, fetchParties, fetchConfig } from '../api/client';
import FormPage from '../components/FormPage';
import SearchableSelect from '../components/SearchableSelect';
import EntitlementsEditor from '../components/EntitlementsEditor';
import { inputClass, labelClass } from '../components/formStyles';

export default function UserForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const presetPartyId = searchParams.get('partyId');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneDialCode: '',
    phone: '',
    entitlements: presetPartyId
      ? [{ partyId: presetPartyId, access: 'ALL_ACCOUNTS', accountIds: [] }]
      : [],
  });
  const [parties, setParties] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParties({ type: 'CORPORATE', limit: 100 })
      .then((res) => setParties(res.items))
      .catch(() => setLoadError('Could not load parties. Is the server running?'));
    fetchConfig().then((c) => setCountries(c.countries));
    if (!isEdit) return;
    fetchUser(id).then((user) => {
      setForm({
        name: user.name,
        email: user.email,
        phoneDialCode: user.phoneDialCode || '',
        phone: user.phone || '',
        entitlements: user.entitlements.map(({ partyId, access, accountIds }) => ({
          partyId,
          access,
          accountIds,
        })),
      });
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const user = isEdit ? await updateUser(id, form) : await createUser(form);
      navigate(`/users/${user._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  };

  // Unique dial codes; value is the code itself so it round-trips through SearchableSelect.
  const dialOptions = [...new Map(countries.map((c) => [c.dialCode, c])).values()].map((c) => ({
    value: c.dialCode,
    label: `${c.dialCode} ${countries
      .filter((x) => x.dialCode === c.dialCode)
      .map((x) => x.code)
      .join('/')}`,
  }));

  if (loading) return <div className="p-8 text-neutral-400">Loading…</div>;

  return (
    <FormPage
      title={isEdit ? 'Edit user' : 'Create user'}
      backTo={isEdit ? `/users/${id}` : '/users'}
      backLabel={isEdit ? 'User' : 'Users'}
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      submitDisabled={!form.phoneDialCode}
      submitLabel={isEdit ? 'Save changes' : 'Create user'}
    >
      <div>
        <label className={labelClass}>Name</label>
        <input className={inputClass} value={form.name} onChange={set('name')} required />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          className={inputClass}
          value={form.email}
          onChange={set('email')}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <div className="flex gap-2">
          <div className="w-52 shrink-0">
            <SearchableSelect
              value={form.phoneDialCode}
              onChange={(value) => setForm((prev) => ({ ...prev, phoneDialCode: value }))}
              options={dialOptions}
              placeholder="Select code"
            />
          </div>
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
            inputMode="numeric"
            placeholder="Phone number"
            required
          />
        </div>
      </div>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      {!loadError && parties.length === 0 && (
        <p className="text-xs text-neutral-400">No corporate parties exist yet. Create one first.</p>
      )}
      <EntitlementsEditor
        parties={parties}
        value={form.entitlements}
        onChange={(entitlements) => setForm((prev) => ({ ...prev, entitlements }))}
      />
    </FormPage>
  );
}
