import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './MonthPicker.css';

const MonthPicker = ({ selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const containerRef = useRef(null);

  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    onChange(newDate);
    setIsOpen(false);
  };

  const formattedDate = selectedDate.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-full shadow-sm hover:shadow-md transition-all duration-300 group"
      >
        <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
          <Calendar size={16} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-black text-slate-700 capitalize tracking-tight">
          {formattedDate}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden w-80">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <button 
                onClick={() => setViewYear(v => v - 1)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-black text-slate-900 tracking-widest">{viewYear}</span>
              <button 
                onClick={() => setViewYear(v => v + 1)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Grid */}
            <div className="p-4 grid grid-cols-3 gap-2">
              {months.map((month, idx) => {
                const isSelected = selectedDate.getMonth() === idx && selectedDate.getFullYear() === viewYear;
                const isCurrentMonth = new Date().getMonth() === idx && new Date().getFullYear() === viewYear;
                
                return (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(idx)}
                    className={`
                      py-4 text-xs font-black rounded-2xl transition-all duration-300 capitalize
                      ${isSelected 
                        ? 'bg-slate-900 text-white shadow-lg scale-105' 
                        : isCurrentMonth
                          ? 'bg-brand-50 text-brand-600 border border-brand-100'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    {month.substring(0, 4)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthPicker;