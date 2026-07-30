import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchParty, createParty, updateParty } from '../api/client';
import FormPage from '../components/FormPage';
import { inputClass, labelClass } from '../components/formStyles';

export default function PartyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: '', address: '', type: 'CORPORATE' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    fetchParty(id).then((party) => {
      setForm({
        name: party.name,
        address: party.address || '',
        type: party.type,
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
      const party = isEdit ? await updateParty(id, form) : await createParty(form);
      navigate(`/parties/${party._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  };

  const backTo = isEdit ? `/parties/${id}` : '/parties';

  if (loading) return <div className="p-8 text-neutral-400">Loading…</div>;

  return (
    <FormPage
      title={isEdit ? 'Edit party' : 'Create party'}
      backTo={backTo}
      backLabel={isEdit ? 'Party' : 'Parties'}
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      submitLabel={isEdit ? 'Save changes' : 'Create party'}
    >
      <div>
        <label className={labelClass}>Name</label>
        <input
          className={inputClass}
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Emaar Properties"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Type</label>
        <select className={inputClass} value={form.type} onChange={set('type')}>
          <option value="CORPORATE">Corporate</option>
          <option value="RETAIL">Retail</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <textarea
          className={inputClass}
          value={form.address}
          onChange={set('address')}
          placeholder="e.g. Downtown Dubai, UAE"
          rows={2}
        />
      </div>
    </FormPage>
  );
}
