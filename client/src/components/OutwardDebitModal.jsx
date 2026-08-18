import { useEffect, useState } from 'react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';
import { inputClass, labelClass } from './formStyles';
import { fetchAccount, fetchConfig, createOutwardDebit } from '../api/client';

function generateAccountNumber() {
  let digits = '';
  for (let i = 0; i < 16; i++) digits += Math.floor(Math.random() * 10);
  return digits;
}

export default function OutwardDebitModal({ onClose, onSuccess }) {
  const [accountId, setAccountId] = useState('');
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [beneficiaryCountryCode, setBeneficiaryCountryCode] = useState('');
  const [beneficiaryCurrencyCode, setBeneficiaryCurrencyCode] = useState('');
  const [config, setConfig] = useState({ countries: [], currencies: [] });

  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [cbsAccount, setCbsAccount] = useState(null);

  const [beneficiaryChecking, setBeneficiaryChecking] = useState(false);
  const [beneficiaryChecked, setBeneficiaryChecked] = useState(false);
  const [beneficiaryAccount, setBeneficiaryAccount] = useState(null);
  const [beneficiaryError, setBeneficiaryError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  useEffect(() => {
    setCheckError('');
    setCbsAccount(null);
    const trimmedId = accountId.trim();
    if (!trimmedId) return;

    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        const account = await fetchAccount(trimmedId);
        if (account.status !== 'ACTIVE') {
          setCheckError(`Account ${trimmedId} is not active`);
          return;
        }
        setCbsAccount(account);
      } catch {
        setCheckError(`Account ${trimmedId} not found in CBS`);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [accountId]);

  useEffect(() => {
    setBeneficiaryError('');
    setBeneficiaryAccount(null);
    setBeneficiaryChecked(false);
    const trimmedId = beneficiaryAccountNumber.trim();
    if (trimmedId.length !== 16) return;

    const handle = setTimeout(async () => {
      setBeneficiaryChecking(true);
      try {
        const account = await fetchAccount(trimmedId);
        setBeneficiaryAccount(account);
      } catch {
        setBeneficiaryAccount(null);
      } finally {
        setBeneficiaryChecking(false);
        setBeneficiaryChecked(true);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [beneficiaryAccountNumber]);

  const needsExternalDetails = beneficiaryChecked && !beneficiaryAccount;
  const sameAccount =
    beneficiaryAccountNumber.trim().length === 16 && beneficiaryAccountNumber.trim() === accountId.trim();

  const canSubmit =
    Boolean(cbsAccount) &&
    !checking &&
    beneficiaryAccountNumber.trim().length === 16 &&
    beneficiaryChecked &&
    !beneficiaryChecking &&
    !sameAccount &&
    Number(amount) > 0 &&
    (!needsExternalDetails || (beneficiaryCountryCode && beneficiaryCurrencyCode));

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      await createOutwardDebit(cbsAccount._id, {
        beneficiaryAccountNumber: beneficiaryAccountNumber.trim(),
        amount: Number(amount),
        ...(needsExternalDetails ? { beneficiaryCountryCode, beneficiaryCurrencyCode } : {}),
      });
      onSuccess?.();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  const currencyOptions = config.currencies.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));
  const countryOptions = config.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.code})` }));

  return (
    <Modal title="Outward debit" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className={labelClass}>Account ID</label>
          <input
            className={`${inputClass} font-mono`}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="Physical account debiting funds from"
            inputMode="numeric"
            maxLength={16}
          />
          {checking && <p className="mt-1 text-sm text-neutral-500">Checking account…</p>}
          {!checking && checkError && <p className="mt-1 text-sm text-red-600">{checkError}</p>}
          {!checking && cbsAccount && (
            <p className="mt-1 text-sm text-emerald-600">
              Balance: <span className="font-medium">{cbsAccount.balance}</span> {cbsAccount.currencyCode}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Beneficiary account number</label>
          <div className="flex gap-2">
            <input
              className={`${inputClass} font-mono`}
              value={beneficiaryAccountNumber}
              onChange={(e) => setBeneficiaryAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="Account receiving funds"
              inputMode="numeric"
              maxLength={16}
            />
            <button
              type="button"
              onClick={() => setBeneficiaryAccountNumber(generateAccountNumber())}
              title="Generate a random account number"
              className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              🎲
            </button>
          </div>
          {sameAccount && (
            <p className="mt-1 text-sm text-red-600">Beneficiary cannot be the same as the source account</p>
          )}
          {!sameAccount && beneficiaryChecking && (
            <p className="mt-1 text-sm text-neutral-500">Checking beneficiary…</p>
          )}
          {!sameAccount && !beneficiaryChecking && beneficiaryChecked && beneficiaryAccount && (
            <p className="mt-1 text-sm text-emerald-600">
              Beneficiary exists in CBS — its balance will be credited directly.
            </p>
          )}
          {!sameAccount && !beneficiaryChecking && beneficiaryChecked && !beneficiaryAccount && (
            <p className="mt-1 text-sm text-neutral-500">
              Beneficiary not found in CBS — enter its country and currency below.
            </p>
          )}
        </div>

        {needsExternalDetails && !sameAccount && (
          <>
            <SearchableSelect
              label="Beneficiary country"
              value={beneficiaryCountryCode}
              onChange={setBeneficiaryCountryCode}
              options={countryOptions}
              placeholder="Select country"
            />
            <SearchableSelect
              label="Beneficiary currency"
              value={beneficiaryCurrencyCode}
              onChange={setBeneficiaryCurrencyCode}
              options={currencyOptions}
              placeholder="Select currency"
            />
          </>
        )}

        <div>
          <label className={labelClass}>Amount</label>
          <input
            className={inputClass}
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
