const STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-neutral-200 text-neutral-600',
  SUSPENDED: 'bg-amber-100 text-amber-700',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] || STYLES.INACTIVE
      }`}
    >
      {status}
    </span>
  );
}
