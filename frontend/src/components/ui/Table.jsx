import React from 'react';

export function Table({ columns = [], children }) {
  return (
    <div className="overflow-x-auto rounded-[var(--pf-radius-md)] border border-[var(--pf-border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--pf-neutral-100)] text-xs uppercase tracking-wide text-[var(--pf-neutral-700)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-semibold ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--pf-border)]">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, zebra = false, onClick, className = '', ...props }) {
  const clickable = typeof onClick === 'function';

  return (
    <tr
      className={`${zebra ? 'bg-[var(--pf-neutral-50)]' : 'bg-white'} ${clickable ? 'cursor-pointer hover:bg-[var(--pf-primary-bg)]/40' : 'hover:bg-[var(--pf-primary-bg)]/40'} transition-colors ${className}`}
      onClick={onClick}
      onKeyDown={clickable ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event);
        }
      } : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, align = 'left', className = '' }) {
  return (
    <td className={`px-4 py-3 text-[var(--pf-neutral-800)] ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </td>
  );
}

export function TableSkeleton({ colSpan, rows = 5 }) {
  return Array.from({ length: rows }).map((_, idx) => (
    <tr key={`skeleton-${idx}`}>
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="h-6 animate-pulse rounded bg-[var(--pf-neutral-100)]" />
      </td>
    </tr>
  ));
}
