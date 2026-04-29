import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch({ clients = [], quotes = [], invoices = [] }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const merged = [
      ...clients.map((x) => ({ id: x._id, label: x.name, type: 'Client', to: `/clients?clientId=${x._id}` })),
      ...quotes.map((x) => ({ id: x._id, label: x.number || x.client?.name, type: 'Devis', to: '/quotes' })),
      ...invoices.map((x) => ({ id: x._id, label: x.number || x.client?.name, type: 'Facture', to: '/invoices' }))
    ];
    return merged.filter((item) => String(item.label || '').toLowerCase().includes(term)).slice(0, 6);
  }, [q, clients, quotes, invoices]);

  const goToResult = (result) => {
    if (!result?.to) return;
    navigate(result.to);
    setQ('');
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white px-3 py-2 shadow-[var(--pf-shadow-sm)]">
        <Search size={16} className="text-[var(--pf-neutral-500)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Recherche globale: clients, devis, factures"
          className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--pf-neutral-500)]"
        />
      </div>
      {q && (
        <div className="absolute mt-2 w-full rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white p-2 shadow-[var(--pf-shadow-md)]">
          {results.length === 0 ? (
            <p className="px-2 py-2 text-sm text-[var(--pf-neutral-600)]">Aucun resultat</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => goToResult(r)}
                    className="w-full rounded px-2 py-2 text-left text-sm hover:bg-[var(--pf-neutral-50)]"
                  >
                    <span className="font-semibold text-[var(--pf-neutral-900)]">{r.label}</span>
                    <span className="ml-2 text-xs text-[var(--pf-neutral-600)]">{r.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
