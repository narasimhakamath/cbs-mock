import { useState } from 'react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';
import { inputClass, labelClass } from './formStyles';
import { createInwardCredit, createOutwardDebit } from '../api/client';

const TABS = [
  { value: 'INWARD_CREDIT', label: 'Inward credit' },
  { value: 'OUTWARD_DEBIT', label: 'Outward debit' },
];

function generateAccountNumber() {
  let digits = '';
  for (let i = 0; i < 16; i++) digits += Math.floor(Math.random() * 10);
  return digits;
}

export default function TransactionModal({ accountId, account, config, onClose, onSuccess }) {
  const [direction, setDirection] = useState('INWARD_CREDIT');
  const [form, setForm] = useState({
    sourceAccountNumber: '',
    amount: '',
    currencyCode: account.currencyCode,
    beneficiaryAccountNumber: '',
    beneficiaryCountryCode: account.countryCode,
    beneficiaryCurrencyCode: account.currencyCode,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const currencyOptions = config.currencies.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));
  const countryOptions = config.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));

  const isInward = direction === 'INWARD_CREDIT';
  const submitDisabled = isInward
    ? !form.sourceAccountNumber.trim() || !form.amount || !form.currencyCode
    : !form.beneficiaryAccountNumber.trim() ||
      !form.beneficiaryCountryCode ||
      !form.beneficiaryCurrencyCode ||
      !form.amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isInward) {
        await createInwardCredit(accountId, {
          sourceAccountNumber: form.sourceAccountNumber.trim(),
          amount: Number(form.amount),
          currencyCode: form.currencyCode,
        });
      } else {
        await createOutwardDebit(accountId, {
          beneficiaryAccountNumber: form.beneficiaryAccountNumber.trim(),
          beneficiaryCountryCode: form.beneficiaryCountryCode,
          beneficiaryCurrencyCode: form.beneficiaryCurrencyCode,
          amount: Number(form.amount),
        });
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  };

  return (
    <Modal title="New transaction" onClose={onClose}>
      <div className="mb-4 flex gap-1 rounded-md bg-neutral-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setDirection(tab.value)}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition ${
              direction === tab.value
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isInward ? (
          <div>
            <label className={labelClass}>Source account number</label>
            <div className="flex gap-2">
              <input
                className={`${inputClass} font-mono`}
                value={form.sourceAccountNumber}
                onChange={(e) => set('sourceAccountNumber')(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="Account crediting funds from"
                inputMode="numeric"
                maxLength={16}
                required
              />
              <button
                type="button"
                onClick={() => set('sourceAccountNumber')(generateAccountNumber())}
                title="Generate a random account number"
                className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                🎲
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className={labelClass}>Beneficiary account number</label>
              <div className="flex gap-2">
                <input
                  className={`${inputClass} font-mono`}
                  value={form.beneficiaryAccountNumber}
                  onChange={(e) =>
                    set('beneficiaryAccountNumber')(e.target.value.replace(/\D/g, '').slice(0, 16))
                  }
                  placeholder="Account receiving funds"
                  inputMode="numeric"
                  maxLength={16}
                  required
                />
                <button
                  type="button"
                  onClick={() => set('beneficiaryAccountNumber')(generateAccountNumber())}
                  title="Generate a random account number"
                  className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  🎲
                </button>
              </div>
            </div>
            <SearchableSelect
              label="Beneficiary country"
              value={form.beneficiaryCountryCode}
              onChange={set('beneficiaryCountryCode')}
              options={countryOptions}
              placeholder="Select country"
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount</label>
            <input
              className={inputClass}
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount')(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <SearchableSelect
            label="Currency"
            value={isInward ? form.currencyCode : form.beneficiaryCurrencyCode}
            onChange={set(isInward ? 'currencyCode' : 'beneficiaryCurrencyCode')}
            options={currencyOptions}
            placeholder="Select currency"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || submitDisabled}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? 'Submitting…' : isInward ? 'Credit account' : 'Debit account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
