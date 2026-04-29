import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  showCompanyLink = false,
  onCompanyLink
}) {
  return (
    <div className="rounded-[var(--pf-radius-lg)] border border-dashed border-[var(--pf-border)] bg-white p-10 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pf-primary-bg)] text-[var(--pf-primary)]">
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--pf-neutral-900)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--pf-neutral-600)]">{description}</p>
      {ctaLabel && (
        <div className="mt-5">
          <Button onClick={onCta}>{ctaLabel}</Button>
        </div>
      )}
      {showCompanyLink && (
        <button
          type="button"
          onClick={onCompanyLink}
          className="mt-4 text-sm font-medium text-[var(--pf-warning)] underline"
        >
          Configurer l'entreprise
        </button>
      )}
    </div>
  );
}
