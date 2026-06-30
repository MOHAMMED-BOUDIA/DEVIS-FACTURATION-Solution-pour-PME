import React from 'react';

const tones = {
  neutral: 'bg-[var(--pf-neutral-100)] text-[var(--pf-neutral-700)]',
  success: 'bg-[var(--pf-success-bg)] text-[var(--pf-success)]',
  warning: 'bg-[var(--pf-warning-bg)] text-[var(--pf-warning)]',
  danger: 'bg-[var(--pf-danger-bg)] text-[var(--pf-danger)]',
  primary: 'bg-[var(--pf-primary-bg)] text-[var(--pf-primary)]'
};

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
}
