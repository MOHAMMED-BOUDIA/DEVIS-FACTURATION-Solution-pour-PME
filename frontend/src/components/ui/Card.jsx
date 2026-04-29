import React from 'react';

export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)] ${className}`}
    >
      {(title || subtitle || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-[var(--pf-border)] px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-[var(--pf-neutral-900)]">{title}</h3>}
            {subtitle && <p className="text-xs text-[var(--pf-neutral-600)]">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
