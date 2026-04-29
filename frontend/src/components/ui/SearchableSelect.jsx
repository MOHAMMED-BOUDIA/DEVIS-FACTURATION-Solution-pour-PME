import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function SearchableSelect({
  label,
  items = [],
  value = '',
  onChange,
  placeholder = 'Choisir...',
  searchPlaceholder = 'Rechercher...',
  noResultsText = 'Aucun element trouve.',
  disabled = false,
  wrapperClassName = '',
  className = '',
  labelClassName = '',
  buttonClassName = '',
  panelClassName = '',
  optionClassName = '',
  getKey = (item) => item?._id,
  getLabel = (item) => item?.name || '',
  getSearchText = (item) => `${item?.name || ''} ${item?.email || ''} ${item?.phone || ''}`,
  getDescription,
  renderSelectedLabel,
  renderOptionLabel,
  renderOptionDescription,
  renderSelectedBadge,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  const selectedItem = useMemo(
    () => items.find((item) => String(getKey(item)) === String(value)) || null,
    [items, value, getKey]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) => getSearchText(item).toLowerCase().includes(normalizedQuery));
  }, [items, query, getSearchText]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  const resolvedSelectedLabel = selectedItem ? (renderSelectedLabel ? renderSelectedLabel(selectedItem) : getLabel(selectedItem)) : placeholder;

  return (
    <div ref={rootRef} className={`relative ${wrapperClassName}`}>
      {label ? (
        <label className={labelClassName || 'mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--pf-neutral-600)]'}>
          {label}
        </label>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-3 py-2.5 text-left text-sm font-medium text-[var(--pf-neutral-900)] shadow-[var(--pf-shadow-sm)] outline-none transition hover:border-[var(--pf-primary)]/40 focus:ring-2 focus:ring-[var(--pf-primary)]/20 disabled:cursor-not-allowed disabled:opacity-70 ${className} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--pf-primary-bg)] text-xs font-bold text-[var(--pf-primary)]">
            {(selectedItem ? getLabel(selectedItem) : placeholder).slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate">{resolvedSelectedLabel}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-[var(--pf-neutral-500)] transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className={`absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-[var(--pf-radius-md)] border border-[var(--pf-border)] bg-white p-2 shadow-[var(--pf-shadow-md)] ${panelClassName}`}>
          <div className="relative mb-2">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pf-neutral-500)]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-[var(--pf-radius-sm)] border border-[var(--pf-border)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--pf-primary)] focus:ring-2 focus:ring-[var(--pf-primary)]/20"
            />
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto pr-1" role="listbox">
            {filteredItems.length === 0 ? (
              <p className="px-2 py-2 text-sm text-[var(--pf-neutral-600)]">{noResultsText}</p>
            ) : filteredItems.map((item) => {
              const itemKey = getKey(item);
              const isSelected = String(value) === String(itemKey);
              const labelText = renderOptionLabel ? renderOptionLabel(item) : getLabel(item);
              const descriptionText = renderOptionDescription ? renderOptionDescription(item) : getDescription?.(item);

              return (
                <button
                  key={itemKey}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange?.(item);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`flex w-full items-center justify-between rounded-[var(--pf-radius-sm)] px-2 py-2 text-left text-sm transition ${isSelected ? 'bg-[var(--pf-primary-bg)] text-[var(--pf-primary)]' : 'text-[var(--pf-neutral-800)] hover:bg-[var(--pf-neutral-100)]'} ${optionClassName}`}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{labelText}</span>
                    {descriptionText ? <span className="truncate text-xs text-[var(--pf-neutral-400)]">{descriptionText}</span> : null}
                  </span>
                  {isSelected ? (
                    renderSelectedBadge ? renderSelectedBadge(item) : <Check size={14} className="shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}