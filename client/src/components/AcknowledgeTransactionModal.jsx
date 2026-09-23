import { useState } from 'react';
import Modal from './Modal';
import { inputClass, labelClass } from './formStyles';
import { acknowledgeTransaction, postVamStatusAck } from '../api/client';
import { useEnvironment } from '../context/EnvironmentContext';

export default function AcknowledgeTransactionModal({ transaction, onClose, onSuccess }) {
  const { environment } = useEnvironment();
  const [errorCode, setErrorCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleAcknowledge = async (targetStatus) => {
    setError('');
    if (targetStatus === 'RJCT' && !errorCode.trim()) {
      setError('Error code is required to reject a transaction');
      return;
    }

    setSubmitting(true);
    const trimmedErrorCode = targetStatus === 'RJCT' ? errorCode.trim() : undefined;

    const { ok, data } = await acknowledgeTransaction(transaction.transactionId, {
      status: targetStatus,
      errorCode: trimmedErrorCode,
    });
    if (!ok) {
      setError(data?.message || 'Failed to update transaction');
      setSubmitting(false);
      return;
    }

    const vam = await postVamStatusAck({
      env: environment,
      externalRefId: transaction.utrId,
      status: targetStatus,
      errorCode: trimmedErrorCode,
    });

    setResult({
      finalStatus: targetStatus,
      vamOk: vam.ok,
      vamMessage: vam.ok ? 'VAM acknowledged the status update.' : vam.data?.message || 'VAM acknowledgement failed.',
    });
    setSubmitting(false);
  };

  if (result) {
    return (
      <Modal title="Transaction acknowledged" onClose={onClose}>
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">
            Transaction status set to <span className="font-mono font-medium">{result.finalStatus}</span>.
          </p>
          <p className={`text-sm ${result.vamOk ? 'text-emerald-600' : 'text-red-600'}`}>{result.vamMessage}</p>
          <div className="flex justify-end border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Acknowledge transaction" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Transaction{' '}
          <span className="font-mono text-xs text-neutral-500">{transaction.utrId}</span> is currently{' '}
          <span className="font-mono font-medium">ACTC</span>. Move it to its final status.
        </p>

        <div>
          <label className={labelClass}>Error code (required to reject)</label>
          <input
            className={inputClass}
            value={errorCode}
            onChange={(e) => setErrorCode(e.target.value)}
            placeholder="e.g. AC04"
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
            type="button"
            disabled={submitting}
            onClick={() => handleAcknowledge('RJCT')}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Reject (RJCT)
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAcknowledge('ACSC')}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Mark settled (ACSC)'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
