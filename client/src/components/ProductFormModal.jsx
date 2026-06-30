import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './UI';

const getFocusableElements = (container) => {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
};

const fieldClass = (invalid) => {
  const base = 'w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition';
  const valid = 'border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';
  const error = 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10';
  return `${base} ${invalid ? error : valid}`;
};

export default function ProductFormModal({
  isOpen,
  onClose,
  isEditing,
  formData,
  setFormData,
  submitError,
  onSubmit,
  saving,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousFocusRef = useRef(null);

  const unit = formData?.unit || 'piece';
  const [discount, setDiscount] = useState('');

  const errors = useMemo(() => {
    const next = {};

    if (!String(formData.name || '').trim()) {
      next.name = 'Le nom du produit est requis.';
    }

    if (formData.price === '' || Number.isNaN(Number(formData.price))) {
      next.price = 'Le prix unitaire est requis.';
    } else if (Number(formData.price) < 0) {
      next.price = 'Le prix unitaire doit etre superieur ou egal a 0.';
    }

    if (formData.taxRate === '' || Number.isNaN(Number(formData.taxRate))) {
      next.taxRate = 'Le taux de TVA est requis.';
    } else if (Number(formData.taxRate) < 0 || Number(formData.taxRate) > 100) {
      next.taxRate = 'Le taux de TVA doit etre compris entre 0 et 100.';
    }

    if (discount !== '' && (Number.isNaN(Number(discount)) || Number(discount) < 0 || Number(discount) > 100)) {
      next.discount = 'La remise doit etre entre 0 et 100.';
    }

    return next;
  }, [discount, formData.name, formData.price, formData.taxRate]);

  const isValid = Object.keys(errors).length === 0;

  

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    const frame = requestAnimationFrame(() => {
      firstInputRef.current?.focus();
    });

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!saving) onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = getFocusableElements(panelRef.current);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6" aria-hidden={false}>
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => {
          if (!saving) onClose();
        }}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-[720px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
          aria-label="Fermer la fenetre"
          disabled={saving}
        >
          <X size={18} />
        </button>

        <div className="border-b border-slate-100 px-6 pb-5 pt-6 md:px-8 md:pt-8">
          <h3 id={titleId} className="pr-12 text-2xl font-black tracking-tight text-slate-900">
            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>
          <p id={descriptionId} className="mt-2 text-sm font-medium text-slate-500">
            Renseignez les informations produit pour enrichir votre catalogue.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="max-h-[75vh] overflow-y-auto px-6 py-6 md:px-8 md:py-8">
            {submitError ? (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {submitError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <label htmlFor="product-name" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Nom du produit
                  </label>
                  <input
                    ref={firstInputRef}
                    id="product-name"
                    name="name"
                    type="text"
                    className={fieldClass(Boolean(errors.name))}
                    placeholder="Ex: Abonnement maintenance"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'error-product-name' : undefined}
                    required
                  />
                  {errors.name ? (
                    <p id="error-product-name" className="mt-1.5 text-xs font-semibold text-rose-600">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="product-description" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Description
                  </label>
                  <textarea
                    id="product-description"
                    name="description"
                    rows={6}
                    className={`${fieldClass(Boolean(errors.description))} resize-none`}
                    placeholder="Details, usage, conditions..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? 'error-product-description' : undefined}
                  />
                  {errors.description ? (
                    <p id="error-product-description" className="mt-1.5 text-xs font-semibold text-rose-600">
                      {errors.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="product-price" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Prix unitaire
                  </label>
                  <div className="relative">
                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`${fieldClass(Boolean(errors.price))} pr-14`}
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      aria-invalid={Boolean(errors.price)}
                      aria-describedby={errors.price ? 'error-product-price' : undefined}
                      required
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-black uppercase tracking-wider text-slate-400">
                      DH
                    </span>
                  </div>
                  {errors.price ? (
                    <p id="error-product-price" className="mt-1.5 text-xs font-semibold text-rose-600">
                      {errors.price}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="product-tax" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Taux TVA
                  </label>
                  <div className="relative">
                    <input
                      id="product-tax"
                      name="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={`${fieldClass(Boolean(errors.taxRate))} pr-10`}
                      placeholder="20"
                      value={formData.taxRate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, taxRate: Number(e.target.value) }))}
                      aria-invalid={Boolean(errors.taxRate)}
                      aria-describedby={errors.taxRate ? 'error-product-tax' : undefined}
                      required
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-black text-slate-400">
                      %
                    </span>
                  </div>
                  {errors.taxRate ? (
                    <p id="error-product-tax" className="mt-1.5 text-xs font-semibold text-rose-600">
                      {errors.taxRate}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Unite
                  </label>
                  <div className="inline-flex rounded-2xl border bg-white p-1">
                      <button
                      type="button"
                      aria-pressed={unit === 'piece'}
                      className={`px-4 py-2 rounded-xl text-sm font-medium ${unit === 'piece' ? 'bg-brand-600 text-white' : 'text-slate-700'}`}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, unit: 'piece' }));
                      }}
                    >
                      Piece
                    </button>
                    <button
                      type="button"
                      aria-pressed={unit === 'pack'}
                      className={`ml-2 px-4 py-2 rounded-xl text-sm font-medium ${unit === 'pack' ? 'bg-brand-600 text-white' : 'text-slate-700'}`}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, unit: 'pack' }));
                      }}
                    >
                      Pack
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="product-discount" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Remise (optionnelle)
                  </label>
                  <div className="relative">
                    <input
                      id="product-discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={`${fieldClass(Boolean(errors.discount))} pr-10`}
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      aria-invalid={Boolean(errors.discount)}
                      aria-describedby={errors.discount ? 'error-product-discount' : undefined}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-black text-slate-400">
                      %
                    </span>
                  </div>
                  {errors.discount ? (
                    <p id="error-product-discount" className="mt-1.5 text-xs font-semibold text-rose-600">
                      {errors.discount}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 md:px-8">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" loading={saving} disabled={!isValid || saving} aria-disabled={!isValid || saving}>
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
