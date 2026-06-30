import React from 'react';

const variantClasses = {
  primary: 'bg-[var(--pf-primary)] text-white border-transparent hover:bg-[color-mix(in_oklab,var(--pf-primary),black_12%)]',
  secondary: 'bg-white text-[var(--pf-neutral-900)] border-[var(--pf-border)] hover:bg-[var(--pf-neutral-50)]',
  warning: 'bg-[var(--pf-warning)] text-white border-transparent hover:bg-[color-mix(in_oklab,var(--pf-warning),black_12%)]',
  danger: 'bg-[var(--pf-danger)] text-white border-transparent hover:bg-[color-mix(in_oklab,var(--pf-danger),black_12%)]',
  ghost: 'bg-transparent text-[var(--pf-neutral-700)] border-transparent hover:bg-[var(--pf-neutral-100)]'
};

const sizeClasses = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--pf-radius-md)] border font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
}
