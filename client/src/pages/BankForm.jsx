import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBank, createBank, updateBank } from '../api/client';
import FormPage from '../components/FormPage';
import { inputClass, labelClass } from '../components/formStyles';

export default function BankForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: '', institutionId: '', status: 'ACTIVE' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    fetchBank(id).then((bank) => {
      setForm({ name: bank.name, institutionId: bank.institutionId, status: bank.status });
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const bank = isEdit ? await updateBank(id, form) : await createBank(form);
      navigate('/banks');
      void bank;
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-neutral-400">Loading…</div>;

  return (
    <FormPage
      title={isEdit ? 'Edit bank' : 'Create bank'}
      backTo="/banks"
      backLabel="Banks"
      onSubmit={handleSubmit}
      error={error}
      saving={saving}
      submitLabel={isEdit ? 'Save changes' : 'Create bank'}
    >
      <div>
        <label className={labelClass}>Name</label>
        <input
          className={inputClass}
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. National Bank of Bahrain"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Institution ID</label>
        <input
          className={inputClass}
          value={form.institutionId}
          onChange={set('institutionId')}
          placeholder="e.g. NBB001"
          required
        />
      </div>

      {isEdit && (
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={form.status} onChange={set('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      )}
    </FormPage>
  );
}
