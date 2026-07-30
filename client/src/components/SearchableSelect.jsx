import { useEffect, useMemo, useRef, useState } from 'react';

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {label && <label className="mb-1 block text-xs font-medium text-neutral-500">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-md border border-neutral-300 px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 ${
          disabled ? 'cursor-not-allowed bg-neutral-50 text-neutral-400' : 'text-neutral-800'
        }`}
      >
        <span className={selected ? '' : 'text-neutral-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-neutral-400">▾</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>
          <ul className="max-h-56 overflow-auto py-1 text-sm">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-neutral-400">No matches</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`block w-full px-3 py-2 text-left hover:bg-neutral-50 ${
                    o.value === value ? 'bg-neutral-50 font-medium text-neutral-900' : 'text-neutral-700'
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
