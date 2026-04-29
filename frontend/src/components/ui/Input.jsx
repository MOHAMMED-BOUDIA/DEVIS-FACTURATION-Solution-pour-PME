import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, icon: Icon, error, className = '', wrapperClassName = '', ...props },
  ref
) {
  return (
    <label className={`block space-y-2 ${wrapperClassName}`}>
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-[var(--pf-neutral-600)]">{label}</span>}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pf-neutral-500)]">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          className={`w-full rounded-[var(--pf-radius-md)] border bg-white py-2.5 text-sm text-[var(--pf-neutral-900)] outline-none transition placeholder:text-[var(--pf-neutral-400)] focus:ring-2 focus:ring-[var(--pf-primary)]/20 ${Icon ? 'pl-10 pr-3' : 'px-3'} ${error ? 'border-[var(--pf-danger)]' : 'border-[var(--pf-border)]'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-[var(--pf-danger)]">{error}</p>}
    </label>
  );
});

export default Input;
