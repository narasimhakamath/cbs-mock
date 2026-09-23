const STYLES = {
  ACTC: 'bg-amber-100 text-amber-700',
  ACSC: 'bg-emerald-100 text-emerald-700',
  RJCT: 'bg-red-100 text-red-700',
};

export default function TransactionStatusBadge({ status }) {
  const code = status || 'ACSC';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[code] || STYLES.ACSC
      }`}
    >
      {code}
    </span>
  );
}
