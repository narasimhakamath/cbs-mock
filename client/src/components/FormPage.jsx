import { Link } from 'react-router-dom';

export default function FormPage({
  title,
  backTo,
  backLabel,
  onSubmit,
  error,
  saving,
  submitDisabled,
  submitLabel,
  children,
}) {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link to={backTo} className="text-sm text-neutral-500 hover:text-neutral-700">
        ← {backLabel}
      </Link>

      <h1 className="mt-3 mb-6 text-xl font-semibold text-neutral-800">{title}</h1>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6"
      >
        {children}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-5">
          <Link
            to={backTo}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || submitDisabled}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
