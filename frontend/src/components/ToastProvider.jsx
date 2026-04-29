import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext({
  pushToast: () => {}
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-[var(--pf-radius-md)] border px-4 py-3 shadow-[var(--pf-shadow-md)] ${isSuccess ? 'border-[var(--pf-success)]/30 bg-[var(--pf-success-bg)] text-[var(--pf-success)]' : 'border-[var(--pf-danger)]/30 bg-[var(--pf-danger-bg)] text-[var(--pf-danger)]'}`}
            >
              {isSuccess ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button type="button" className="text-current" onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
