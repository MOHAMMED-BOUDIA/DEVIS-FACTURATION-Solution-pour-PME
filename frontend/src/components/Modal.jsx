import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal Component using React Portals
 * 
 * Why Portals?
 * Parent elements with 'transform', 'filter', or 'perspective' properties 
 * create a new local stacking context. This causes 'position: fixed' 
 * elements to be relative to that parent instead of the viewport.
 * createPortal moves the modal to document.body, bypassing these constraints.
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Scroll Lock
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300"
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop / Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div className={`bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full ${maxWidth} z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100 relative`}>
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-slate-900 p-2 hover:bg-slate-50 rounded-2xl transition-all duration-200"
            aria-label="Fermer"
          >
            <X size={28} />
          </button>
        </div>
        
        <div className="max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;