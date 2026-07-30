export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3 text-sm text-neutral-500">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <span>
          {from}-{to} of {total}
        </span>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-neutral-300 px-2 py-1 disabled:opacity-40 hover:bg-neutral-100"
        >
          ‹
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-neutral-300 px-2 py-1 disabled:opacity-40 hover:bg-neutral-100"
        >
          ›
        </button>
      </div>
    </div>
  );
}
