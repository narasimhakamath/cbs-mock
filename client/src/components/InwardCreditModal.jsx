import { useEffect, useState } from 'react';
import Modal from './Modal';
import { inputClass, labelClass } from './formStyles';
import { resolvePhysicalAccount, fetchAccount, createInwardCredit, postVamCredit } from '../api/client';
import { useEnvironment } from '../context/EnvironmentContext';

function generateAccountNumber() {
  let digits = '';
  for (let i = 0; i < 16; i++) digits += Math.floor(Math.random() * 10);
  return digits;
}

export default function InwardCreditModal({ onClose, onSuccess }) {
  const { environment } = useEnvironment();
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [sourceAccountNumber, setSourceAccountNumber] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [cbsAccount, setCbsAccount] = useState(null);
  const [vaInfo, setVaInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setCheckError('');
    setCbsAccount(null);
    setVaInfo(null);

    const trimmedId = accountId.trim();
    if (!trimmedId || !amount || Number(amount) <= 0) return;

    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        try {
          const account = await fetchAccount(trimmedId);
          if (account.status !== 'ACTIVE') {
            setCheckError(`Account ${trimmedId} is not active`);
            return;
          }
          setCbsAccount(account);
          return;
        } catch {
          // Not a physical account in CBS — try resolving it as a virtual account.
        }

        const { ok, data } = await resolvePhysicalAccount(trimmedId, environment, amount);
        if (!ok) {
          setCheckError(data?.message || 'Account does not exist in CBS and could not be resolved as a virtual account');
          return;
        }

        const accountNumber = data?.account?.number;
        if (!accountNumber) {
          setCheckError('Resolved response did not include an account number');
          return;
        }

        try {
          const account = await fetchAccount(accountNumber);
          if (account.status !== 'ACTIVE') {
            setCheckError(`The resolved physical account (${accountNumber}) is not active`);
            return;
          }
          setCbsAccount(account);
          setVaInfo({
            virtualAccountId: trimmedId,
            ledgerId: data.ledgerId,
            currency: data.account.currency,
          });
        } catch {
          setCheckError(`The resolved physical account (${accountNumber}) does not exist`);
        }
      } catch {
        setCheckError('Something went wrong while checking the account');
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [accountId, amount, environment]);

  const canSubmit = Boolean(cbsAccount) && !checking && sourceAccountNumber.trim().length === 16;

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const transaction = await createInwardCredit(cbsAccount._id, {
        sourceAccountNumber: sourceAccountNumber.trim(),
        amount: Number(amount),
        currencyCode: cbsAccount.currencyCode,
      });

      if (vaInfo) {
        const { ok, data } = await postVamCredit({
          env: environment,
          externalRefId: transaction.transactionId,
          transactionReferenceId: transaction.transactionId,
          accountId: vaInfo.virtualAccountId,
          ledgerId: vaInfo.ledgerId,
          currency: vaInfo.currency,
          amount: Number(amount),
        });
        if (!ok) {
          setSubmitError(
            `Physical account was credited, but the virtual account credit failed: ${
              data?.message || 'unknown error'
            }`
          );
          setSubmitting(false);
          return;
        }
      }

      onSuccess?.();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Inward credit" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className={labelClass}>Source account number</label>
          <div className="flex gap-2">
            <input
              className={`${inputClass} font-mono`}
              value={sourceAccountNumber}
              onChange={(e) => setSourceAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="Account crediting funds from"
              inputMode="numeric"
              maxLength={16}
            />
            <button
              type="button"
              onClick={() => setSourceAccountNumber(generateAccountNumber())}
              title="Generate a random account number"
              className="shrink-0 rounded-md border border-neutral-300 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              🎲
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Account ID</label>
          <input
            className={`${inputClass} font-mono`}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Physical or virtual account ID"
          />
        </div>

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

        {checking && <p className="text-sm text-neutral-500">Checking account…</p>}
        {!checking && checkError && <p className="text-sm text-red-600">{checkError}</p>}
        {!checking && cbsAccount && (
          <p className="text-sm text-emerald-600">
            Account: <span className="font-mono font-medium">{cbsAccount.accountNumber}</span> is
            valid
          </p>
        )}

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
