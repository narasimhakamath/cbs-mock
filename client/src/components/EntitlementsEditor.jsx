import { useEffect, useState } from 'react';
import { fetchAccounts } from '../api/client';
import SearchableSelect from './SearchableSelect';
import { labelClass } from './formStyles';

function PartyEntitlement({ entitlement, partyName, onChange, onRemove }) {
  const [accounts, setAccounts] = useState([]);
  const selected = entitlement.access === 'SELECTED_ACCOUNTS';

  useEffect(() => {
    fetchAccounts({ partyId: entitlement.partyId, limit: 100 }).then((res) => setAccounts(res.items));
  }, [entitlement.partyId]);

  const toggleAccount = (accountId) => {
    const ids = entitlement.accountIds.includes(accountId)
      ? entitlement.accountIds.filter((a) => a !== accountId)
      : [...entitlement.accountIds, accountId];
    onChange({ ...entitlement, accountIds: ids });
  };

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800">{partyName}</span>
        <button type="button" onClick={onRemove} className="text-xs text-neutral-400 hover:text-red-600">
          Remove
        </button>
      </div>

      <div className="mt-3 flex gap-5 text-sm text-neutral-700">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!selected}
            onChange={() => onChange({ ...entitlement, access: 'ALL_ACCOUNTS', accountIds: [] })}
          />
          All accounts (incl. future)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={selected}
            onChange={() => onChange({ ...entitlement, access: 'SELECTED_ACCOUNTS' })}
          />
          Selected accounts
        </label>
      </div>

      {selected && (
        <ul className="mt-3 max-h-44 overflow-auto rounded-md border border-neutral-100 text-sm">
          {accounts.length === 0 && <li className="px-3 py-2 text-neutral-400">No accounts under this party</li>}
          {accounts.map((a) => (
            <li key={a._id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={entitlement.accountIds.includes(a._id)}
                  onChange={() => toggleAccount(a._id)}
                />
                <span className="font-mono text-neutral-600">{a._id}</span>
                <span className="text-neutral-700">
                  {a.name} ({a.currencyCode})
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EntitlementsEditor({ parties, value, onChange }) {
  const partyName = (id) => parties.find((p) => p._id === id)?.name || id;

  const add = (partyId) =>
    onChange([...value, { partyId, access: 'ALL_ACCOUNTS', accountIds: [] }]);

  return (
    <div>
      <SearchableSelect
        label="Party entitlements"
        value=""
        onChange={add}
        options={parties
          .filter((p) => !value.some((e) => e.partyId === p._id))
          .map((p) => ({ value: p._id, label: `${p.name} (${p._id})` }))}
        placeholder="Add a corporate party"
      />
      <div className="mt-3 space-y-3">
        {value.length === 0 && <p className="text-xs text-neutral-400">No access granted yet.</p>}
        {value.map((e) => (
          <PartyEntitlement
            key={e.partyId}
            entitlement={e}
            partyName={partyName(e.partyId)}
            onChange={(next) => onChange(value.map((x) => (x.partyId === e.partyId ? next : x)))}
            onRemove={() => onChange(value.filter((x) => x.partyId !== e.partyId))}
          />
        ))}
      </div>
      <p className={`${labelClass} mt-2`}>
        &ldquo;All accounts&rdquo; covers accounts opened later. &ldquo;Selected&rdquo; covers only the ticked ones.
      </p>
    </div>
  );
}
